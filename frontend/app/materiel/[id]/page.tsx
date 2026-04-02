'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';

const EMOJI: Record<string, string> = {
  TRACTEUR: '🚜', MOTOPOMPE: '💧', BATTEUSE: '⚙️',
  CHARRUE: '🔩', SEMOIR: '🌱', SILO: '🏗️',
  REMORQUE: '🚛', PULVERISATEUR: '💦', MOISSONNEUSE: '🌾',
};

interface Materiel {
  id: string;
  type: string;
  description?: string | null;
  prixJour: number;
  caution: number;
  disponible: boolean;
  photoUrl?: string | null;
  commune: string;
  region: string;
  proprietaire: { nom: string; telephone: string; commune: string };
}

export default function PageDetailMateriel() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useStore(s => s.token);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(tomorrow);
  const [chargement, setChargement] = useState(false);

  const { data: materiel, isLoading } = useQuery({
    queryKey: ['materiel', id],
    queryFn: async () => {
      const res = await api.get(`/materiel/${id}`);
      return res.data.data as Materiel;
    },
    enabled: !!id,
  });

  const nbJours = Math.max(1, Math.ceil(
    (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000
  ));

  const louer = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      await api.post(`/materiel/${id}/louer`, {
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
      });
      alert(`Location confirmée — ${nbJours} jour(s). Le propriétaire vous contactera.`);
      router.push('/materiel');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erreur lors de la location');
    } finally {
      setChargement(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/materiel" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚜</div>
      </div>
    </div>
  );

  if (!materiel) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/materiel" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-fg">Matériel introuvable</p>
      </div>
    </div>
  );

  const typeLabel = materiel.type.charAt(0) + materiel.type.slice(1).toLowerCase();
  const regionLabel = materiel.region.charAt(0) + materiel.region.slice(1).toLowerCase();
  const montant = nbJours * materiel.prixJour;
  const commission = Math.round(montant * 0.05);

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/materiel" />

      <main className="flex-1 pb-32">
        {materiel.photoUrl ? (
          <div className="relative h-60 bg-surface-3">
            <Image src={materiel.photoUrl} alt={materiel.type} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
            <span className="text-8xl">{EMOJI[materiel.type] || '⚙️'}</span>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Info principale */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-black text-foreground">{typeLabel}</h1>
                <p className="text-sm text-muted-fg flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {materiel.commune}, {regionLabel}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-amber-600">{materiel.prixJour.toLocaleString('fr')}</div>
                <div className="text-xs text-muted-fg">FCFA/jour</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-amber-800 font-bold text-sm">
                Caution : {materiel.caution.toLocaleString('fr')} FCFA (remboursée)
              </span>
            </div>
          </div>

          {materiel.description && (
            <div className="card p-4">
              <p className="text-sm text-foreground-2 leading-relaxed">{materiel.description}</p>
            </div>
          )}

          {/* Propriétaire */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Propriétaire</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{materiel.proprietaire.nom}</p>
                <p className="text-sm text-muted-fg">{materiel.proprietaire.commune}</p>
              </div>
              <a
                href={`tel:${materiel.proprietaire.telephone}`}
                className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
              </a>
            </div>
          </div>

          {/* Calculateur location */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-4">Période de location</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Début</label>
                <input
                  type="date"
                  value={dateDebut}
                  min={today}
                  onChange={e => setDateDebut(e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Fin</label>
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  onChange={e => setDateFin(e.target.value)}
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="bg-surface-2 rounded-xl p-3 space-y-2 text-sm">
              <div className="flex justify-between text-foreground-2">
                <span>{nbJours} jour{nbJours > 1 ? 's' : ''} × {materiel.prixJour.toLocaleString('fr')} FCFA</span>
                <span className="font-semibold">{montant.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Commission (5%)</span>
                <span>{commission.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-fg">
                <span>Caution (remboursable)</span>
                <span>{materiel.caution.toLocaleString('fr')} FCFA</span>
              </div>
              <div className="flex justify-between font-black text-foreground border-t border-border pt-2">
                <span>Total à payer</span>
                <span className="text-amber-600">{(montant + commission + materiel.caution).toLocaleString('fr')} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border px-4 py-4 flex gap-3 max-w-xl mx-auto">
        <a
          href={`tel:${materiel.proprietaire.telephone}`}
          className="btn btn-secondary flex-1 text-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
          Appeler
        </a>
        <button
          onClick={louer}
          disabled={chargement || !materiel.disponible}
          className="btn btn-amber flex-1"
        >
          {chargement ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          )}
          {materiel.disponible ? `Louer ${nbJours}j` : 'Indisponible'}
        </button>
      </div>
    </div>
  );
}
