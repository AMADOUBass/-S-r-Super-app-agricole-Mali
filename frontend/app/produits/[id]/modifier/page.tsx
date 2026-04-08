'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { Loader2, CheckCircle2, XCircle, TrendingUp, Package, ToggleLeft, ToggleRight } from 'lucide-react';

interface Produit {
  id: string;
  type: string;
  quantiteKg: number;
  prixFcfa: number;
  description: string | null;
  disponible: boolean;
  commune: string;
  region: string;
  agriculteurId: string;
}

const TYPES_LABELS: Record<string, { label: string; emoji: string }> = {
  MIL: { label: 'Mil', emoji: '🌾' }, SORGHO: { label: 'Sorgho', emoji: '🌾' },
  MAIS: { label: 'Maïs', emoji: '🌽' }, RIZ: { label: 'Riz', emoji: '🍚' },
  ARACHIDE: { label: 'Arachide', emoji: '🥜' }, NIEBE: { label: 'Niébé', emoji: '🫘' },
  MANGUE: { label: 'Mangue', emoji: '🥭' }, OIGNON: { label: 'Oignon', emoji: '🧅' },
  TOMATE: { label: 'Tomate', emoji: '🍅' }, KARITE: { label: 'Karité', emoji: '🌿' },
  SESAME: { label: 'Sésame', emoji: '✨' }, COTON: { label: 'Coton', emoji: '☁️' },
  GOMBO: { label: 'Gombo', emoji: '🥦' }, PATATE_DOUCE: { label: 'Patate', emoji: '🍠' },
  IGNAME: { label: 'Igname', emoji: '🥔' },
};

export default function PageModifierProduit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    quantiteKg: '',
    prixFcfa: '',
    description: '',
    disponible: true,
  });
  const [prixMarche, setPrixMarche] = useState<number | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const { data: produit, isLoading } = useQuery({
    queryKey: ['produit', id],
    queryFn: async () => {
      const res = await api.get(`/produits/${id}`);
      return res.data.data as Produit;
    },
    enabled: !!id,
  });

  // Pré-remplir le formulaire une fois le produit chargé
  useEffect(() => {
    if (!produit) return;

    // Vérifier que c'est bien son annonce
    if (produit.agriculteurId !== utilisateur?.id) {
      router.replace('/tableau-bord');
      return;
    }

    setForm({
      quantiteKg: String(produit.quantiteKg),
      prixFcfa: String(produit.prixFcfa),
      description: produit.description ?? '',
      disponible: produit.disponible,
    });
  }, [produit, utilisateur, router]);

  // Récupérer le prix du marché
  useEffect(() => {
    if (!produit) return;
    api.get(`/prix?produit=${produit.type}&region=${produit.region}`)
      .then(res => {
        const prix = res.data?.data?.[0]?.prixKg;
        if (prix) setPrixMarche(prix);
      })
      .catch(() => {});
  }, [produit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      await api.put(`/produits/${id}`, {
        quantiteKg: parseFloat(form.quantiteKg),
        prixFcfa: parseInt(form.prixFcfa),
        description: form.description || undefined,
        disponible: form.disponible,
      });

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['mes-produits'] });
      queryClient.invalidateQueries({ queryKey: ['produit', id] });

      router.push('/tableau-bord');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setChargement(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/tableau-bord" titre="Modifier l'annonce" />
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4 w-full">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    </div>
  );

  if (!produit) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/tableau-bord" titre="Modifier l'annonce" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-fg">Annonce introuvable</p>
      </div>
    </div>
  );

  const info = TYPES_LABELS[produit.type] ?? { label: produit.type, emoji: '📦' };
  const regionLabel = produit.region.charAt(0) + produit.region.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/tableau-bord" titre="Modifier l'annonce" />

      <main className="flex-1 px-4 py-6 pb-10 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identité du produit — non modifiable */}
          <div className="card p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0 text-3xl">
              {info.emoji}
            </div>
            <div>
              <p className="font-black text-foreground text-lg">{info.label}</p>
              <p className="text-sm text-muted-fg">{produit.commune} · {regionLabel}</p>
            </div>
          </div>

          {/* Disponibilité — toggle principal */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Statut de l'annonce</p>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                form.disponible
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.disponible ? 'bg-primary-100' : 'bg-red-100'}`}>
                  {form.disponible
                    ? <CheckCircle2 size={20} className="text-primary-600" />
                    : <XCircle size={20} className="text-red-500" />
                  }
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{form.disponible ? 'Disponible' : 'Rupture de stock'}</p>
                  <p className={`text-xs mt-0.5 ${form.disponible ? 'text-primary-600' : 'text-red-500'}`}>
                    {form.disponible ? 'Visible aux acheteurs' : 'Masqué des résultats'}
                  </p>
                </div>
              </div>
              {form.disponible
                ? <ToggleRight size={32} className="text-primary-500 flex-shrink-0" />
                : <ToggleLeft size={32} className="text-red-400 flex-shrink-0" />
              }
            </button>
          </div>

          {/* Quantité */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Stock disponible</p>
            <div className="relative">
              <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" aria-hidden="true" />
              <input
                type="number"
                value={form.quantiteKg}
                onChange={e => setForm(f => ({ ...f, quantiteKg: e.target.value }))}
                placeholder="Ex: 200"
                min="0"
                className="input pl-9 text-lg font-bold"
                required={form.disponible}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-fg font-semibold">kg</span>
            </div>
            <p className="text-xs text-muted-fg mt-2">
              Mettez à jour ce chiffre quand vous avez vendu ou ajouté du stock.
            </p>
          </div>

          {/* Prix */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Prix par kg</p>
              {prixMarche && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, prixFcfa: String(prixMarche) }))}
                  className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <TrendingUp size={10} aria-hidden="true" />
                  Prix marché : {prixMarche} F/kg
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                value={form.prixFcfa}
                onChange={e => setForm(f => ({ ...f, prixFcfa: e.target.value }))}
                placeholder="Ex: 300"
                min="1"
                className="input text-lg font-bold pr-16"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-fg font-semibold">FCFA</span>
            </div>
            {form.prixFcfa && prixMarche && (
              <p className={`text-xs font-semibold mt-2 ${
                parseInt(form.prixFcfa) > prixMarche ? 'text-red-500' : 'text-primary-600'
              }`}>
                {parseInt(form.prixFcfa) > prixMarche
                  ? `+${Math.round((parseInt(form.prixFcfa) / prixMarche - 1) * 100)}% au-dessus du marché`
                  : parseInt(form.prixFcfa) < prixMarche
                    ? `-${Math.round((1 - parseInt(form.prixFcfa) / prixMarche) * 100)}% en dessous du marché`
                    : '= Prix du marché'}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="card p-4">
            <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
              Description <span className="normal-case font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Qualité, variété, conditions de stockage…"
              rows={3}
              maxLength={500}
              className="input resize-none"
            />
            <p className="text-xs text-muted-fg mt-1.5 text-right">{form.description.length}/500</p>
          </div>

          {erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <XCircle size={16} className="flex-shrink-0" aria-hidden="true" />
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="btn btn-primary w-full btn-lg gap-2"
          >
            {chargement ? (
              <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Enregistrement…</>
            ) : (
              <><CheckCircle2 size={18} aria-hidden="true" /> Enregistrer les modifications</>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
