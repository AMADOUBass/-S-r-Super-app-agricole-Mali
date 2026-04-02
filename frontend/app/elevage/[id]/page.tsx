'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';

const EMOJI: Record<string, string> = {
  BOEUF: '🐄', MOUTON: '🐑', CHEVRE: '🐐',
  VOLAILLE: '🐓', PORC: '🐷', ANE: '🫏',
  CHEVAL: '🐴', CHAMEAU: '🐪',
};

interface Animal {
  id: string;
  type: string;
  race?: string | null;
  age?: number | null;
  poidsKg?: number | null;
  prixFcfa: number;
  description?: string | null;
  photoUrl?: string | null;
  commune: string;
  region: string;
  vendeur: { nom: string; telephone: string; commune: string };
}

export default function PageDetailAnimal() {
  const { id } = useParams<{ id: string }>();

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const res = await api.get(`/elevage/${id}`);
      return res.data.data as Animal;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/elevage" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🐄</div>
      </div>
    </div>
  );

  if (!animal) return (
    <div className="min-h-screen flex flex-col">
      <Header retour="/elevage" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-fg">Annonce introuvable</p>
      </div>
    </div>
  );

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const regionLabel = animal.region.charAt(0) + animal.region.slice(1).toLowerCase();
  const emoji = EMOJI[animal.type] || '🐾';

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/elevage" />

      <main className="flex-1 pb-28">
        {animal.photoUrl ? (
          <div className="relative h-60 bg-surface-3">
            <Image src={animal.photoUrl} alt={animal.type} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
            <span className="text-8xl">{emoji}</span>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Info principale */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-black text-foreground">
                  {typeLabel}
                  {animal.race && <span className="text-muted-fg font-normal text-lg"> · {animal.race}</span>}
                </h1>
                <p className="text-sm text-muted-fg flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {animal.commune}, {regionLabel}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-rose-600">{animal.prixFcfa.toLocaleString('fr')}</div>
                <div className="text-xs text-muted-fg">FCFA</div>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="grid grid-cols-2 gap-2">
              {animal.age && (
                <div className="bg-surface-2 rounded-xl px-3 py-2.5 text-center">
                  <div className="text-lg font-black text-foreground">{animal.age}</div>
                  <div className="text-xs text-muted-fg">mois</div>
                </div>
              )}
              {animal.poidsKg && (
                <div className="bg-surface-2 rounded-xl px-3 py-2.5 text-center">
                  <div className="text-lg font-black text-foreground">{animal.poidsKg}</div>
                  <div className="text-xs text-muted-fg">kg</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {animal.description && (
            <div className="card p-4">
              <p className="text-sm text-foreground-2 leading-relaxed">{animal.description}</p>
            </div>
          )}

          {/* Vendeur */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Éleveur</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{animal.vendeur.nom}</p>
                <p className="text-sm text-muted-fg">{animal.vendeur.commune}</p>
              </div>
              <a
                href={`tel:${animal.vendeur.telephone}`}
                className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
              </a>
            </div>
          </div>

          {/* Note contact */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800">
            <p className="font-semibold mb-1">💬 Comment acheter ?</p>
            <p className="text-xs leading-relaxed">
              Appelez l'éleveur directement pour négocier et organiser le transport. Le paiement se fait entre les deux parties.
            </p>
          </div>
        </div>
      </main>

      {/* Bouton fixe */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border px-4 py-4 max-w-xl mx-auto">
        <a
          href={`tel:${animal.vendeur.telephone}`}
          className="btn w-full btn-lg flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
          Appeler l'éleveur · {animal.prixFcfa.toLocaleString('fr')} FCFA
        </a>
      </div>
    </div>
  );
}
