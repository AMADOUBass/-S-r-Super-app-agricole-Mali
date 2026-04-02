// Page détail d'une annonce de récolte
// Contact direct + bouton commander

'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { useProduit } from '@/lib/queries';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️', GOMBO: '🥦',
  PATATE_DOUCE: '🍠', IGNAME: '🥔',
};

export default function PageDetailProduit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useStore(s => s.token);
  const { data: produit, isLoading } = useProduit(id);
  const [quantite, setQuantite] = useState(50);
  const [chargement, setChargement] = useState(false);

  const commander = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);

    try {
      const res = await api.post('/commandes', { produitId: id, quantiteKg: quantite });
      router.push(`/commandes/${res.data.data.id}/payer`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setChargement(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/produits" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🌾</div>
      </div>
    </div>
  );

  if (!produit) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/produits" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-fg">Annonce introuvable</p>
      </div>
    </div>
  );

  const montantTotal = Math.round(produit.prixFcfa * quantite);
  const commission = Math.round(montantTotal * 0.03);
  const typeLabel = produit.type.charAt(0) + produit.type.slice(1).toLowerCase();
  const regionLabel = produit.region.charAt(0) + produit.region.slice(1).toLowerCase();
  const emoji = EMOJI[produit.type] || '📦';

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/produits" />

      <main className="flex-1 pb-32">
        {/* Photo / placeholder */}
        {produit.photoUrl ? (
          <div className="relative h-60 bg-surface-3">
            <Image src={produit.photoUrl} alt={produit.type} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
            <span className="text-8xl">{emoji}</span>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* En-tête */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-black text-foreground">{typeLabel}</h1>
                <p className="text-sm text-muted-fg flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {produit.commune}, {regionLabel}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-primary-700">{produit.prixFcfa.toLocaleString('fr')}</div>
                <div className="text-xs text-muted-fg">FCFA/kg</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-primary-800 font-bold text-sm">
                {produit.quantiteKg.toLocaleString('fr')} kg disponibles
              </span>
            </div>
          </div>

          {/* Description */}
          {produit.description && (
            <div className="card p-4">
              <p className="text-sm text-foreground-2 leading-relaxed">{produit.description}</p>
            </div>
          )}

          {/* Vendeur */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Agriculteur</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{produit.agriculteur.nom}</p>
                <p className="text-sm text-muted-fg">{produit.agriculteur.commune}</p>
              </div>
              <a
                href={`tel:${produit.agriculteur.telephone}`}
                className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
              </a>
            </div>
          </div>

          {/* Calculateur commande */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Commander</p>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-semibold text-foreground">Quantité (kg)</label>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setQuantite(q => Math.max(1, q - 10))}
                  className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center hover:bg-surface-2 font-bold"
                >−</button>
                <input
                  type="number"
                  value={quantite}
                  onChange={e => setQuantite(Math.max(1, Math.min(produit.quantiteKg, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={produit.quantiteKg}
                  className="w-20 text-center text-lg font-black border-2 border-border rounded-xl px-2 py-1.5 outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantite(q => Math.min(produit.quantiteKg, q + 10))}
                  className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center hover:bg-surface-2 font-bold"
                >+</button>
              </div>
            </div>

            <div className="bg-surface-2 rounded-xl p-3 space-y-2 text-sm">
              <div className="flex justify-between text-foreground-2">
                <span>{quantite} kg × {produit.prixFcfa.toLocaleString('fr')} FCFA</span>
                <span className="font-semibold">{montantTotal.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Commission plateforme (3%)</span>
                <span>{commission.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between font-black text-foreground border-t border-border pt-2 mt-1">
                <span>Total</span>
                <span className="text-primary-700">{(montantTotal + commission).toLocaleString('fr')} FCFA</span>
              </div>
            </div>

            <p className="text-xs text-muted-fg mt-2 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              L'agriculteur reçoit 100% — commission payée par l'acheteur
            </p>
          </div>
        </div>
      </main>

      {/* Boutons fixes */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border px-4 py-4 flex gap-3 max-w-xl mx-auto">
        <a
          href={`tel:${produit.agriculteur.telephone}`}
          className="btn btn-secondary flex-1 text-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
          Appeler
        </a>
        <button
          onClick={commander}
          disabled={chargement}
          className="btn btn-primary flex-1"
        >
          {chargement ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              Commande…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              Commander
            </>
          )}
        </button>
      </div>
    </div>
  );
}
