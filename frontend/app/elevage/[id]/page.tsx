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
      <div className="h-48 bg-surface-3 animate-pulse" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4 w-full">
        <div className="card p-5 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-7 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
            <div className="skeleton h-8 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
          </div>
        </div>
        <div className="card p-4 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="card p-4 space-y-3">
          <div className="skeleton h-4 w-1/4" />
          <div className="skeleton h-12 w-full" />
        </div>
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
          <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '4/3', maxHeight: '420px' }}>
            <Image src={animal.photoUrl} alt={animal.type} fill className="object-contain bg-surface-3" />
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

      {/* Boutons fixes */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border px-4 py-4 flex gap-3 max-w-xl mx-auto">
        <a
          href={`https://wa.me/${animal.vendeur.telephone.replace('+', '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre ${typeLabel} (${animal.prixFcfa.toLocaleString('fr')} FCFA) sur Sɔrɔ.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-2xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={`tel:${animal.vendeur.telephone}`}
          className="btn flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81 19.79 19.79 0 0120.92 2.18 2 2 0 0123 4.36v2.56a2 2 0 01-1.63 2.1L18 9.91a16 16 0 01-1.38 3.09l1.07 1.07a16 16 0 003.09-1.38l.63-2.36a2 2 0 012.1-1.63z"/></svg>
          Appeler · {animal.prixFcfa.toLocaleString('fr')} FCFA
        </a>
      </div>
    </div>
  );
}
