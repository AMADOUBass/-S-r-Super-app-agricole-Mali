'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import useStore from '@/store/useStore';
import { MapPin, Phone, PawPrint, ChevronRight } from 'lucide-react';

const EMOJI: Record<string, string> = {
  BOEUF: '🐄', MOUTON: '🐑', CHEVRE: '🐐',
  VOLAILLE: '🐓', PORC: '🐷', ANE: '🫏',
  CHEVAL: '🐴', CHAMEAU: '🐪',
};

const GRADIENT: Record<string, string> = {
  BOEUF:    'from-amber-600 to-orange-700',
  MOUTON:   'from-slate-500 to-gray-600',
  CHEVRE:   'from-stone-500 to-amber-700',
  VOLAILLE: 'from-yellow-500 to-amber-600',
  PORC:     'from-pink-500 to-rose-600',
  ANE:      'from-zinc-500 to-slate-600',
  CHEVAL:   'from-amber-700 to-brown-800',
  CHAMEAU:  'from-yellow-600 to-amber-700',
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
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const res = await api.get(`/elevage/${id}`);
      return res.data.data as Animal;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/elevage" />
      <div className="skeleton h-56 w-full" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4 w-full">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
      </div>
    </div>
  );

  if (!animal) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/elevage" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center">
          <PawPrint size={32} className="text-muted-fg" strokeWidth={1.5} />
        </div>
        <p className="font-bold text-foreground-3 text-lg">Annonce introuvable</p>
        <button onClick={() => router.push('/elevage')} className="btn btn-secondary btn-sm mt-1">
          Retour à l&apos;élevage
        </button>
      </div>
    </div>
  );

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const regionLabel = animal.region.charAt(0) + animal.region.slice(1).toLowerCase();
  const emoji = EMOJI[animal.type] || '🐾';
  const gradient = GRADIENT[animal.type] || 'from-amber-600 to-orange-700';

  const estProprietaire = utilisateur?.telephone === animal.vendeur.telephone;
  const estAdmin = utilisateur?.role === 'ADMIN';
  const peutContacter = !estProprietaire && !estAdmin;

  const whatsappMsg = encodeURIComponent(
    `Bonjour ${animal.vendeur.nom}, je suis intéressé par votre ${typeLabel}${animal.race ? ` (${animal.race})` : ''} à ${animal.prixFcfa.toLocaleString('fr')} FCFA sur Sɔrɔ.`
  );

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/elevage" titre={typeLabel} />

      <main className="flex-1 pb-32">

        {/* Hero */}
        {animal.photoUrl ? (
          <div className={`relative w-full bg-gradient-to-br ${gradient} flex items-center justify-center`} style={{ minHeight: '220px', maxHeight: '320px' }}>
            <div className="relative w-full" style={{ height: '260px' }}>
              <Image
                src={animal.photoUrl}
                alt={typeLabel}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 640px"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-4">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white drop-shadow">
                    {typeLabel}{animal.race && <span className="font-normal text-white/80"> · {animal.race}</span>}
                  </h1>
                  <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />{animal.commune}, {regionLabel}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-right flex-shrink-0">
                  <div className="text-xl font-black text-white">{animal.prixFcfa.toLocaleString('fr')}</div>
                  <div className="text-white/70 text-xs font-semibold">FCFA</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`relative bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden`} style={{ height: '220px' }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-black/10" />
            <span className="text-8xl drop-shadow-lg relative z-10 mb-2">{emoji}</span>
            <div className="relative z-10 text-center">
              <h1 className="text-2xl font-black text-white drop-shadow">
                {typeLabel}{animal.race && <span className="font-normal text-white/80"> · {animal.race}</span>}
              </h1>
              <p className="text-white/70 text-sm flex items-center justify-center gap-1 mt-0.5">
                <MapPin size={12} />{animal.commune}, {regionLabel}
              </p>
            </div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-right">
              <div className="text-xl font-black text-white">{animal.prixFcfa.toLocaleString('fr')}</div>
              <div className="text-white/70 text-xs font-semibold">FCFA</div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-4 space-y-3">

          {/* Caractéristiques */}
          {(animal.age || animal.poidsKg) && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Caractéristiques</p>
              <div className="grid grid-cols-2 gap-3">
                {animal.age && (
                  <div className="bg-surface-2 border border-border/50 rounded-xl px-3 py-3 text-center">
                    <div className="text-2xl font-black text-foreground">{animal.age}</div>
                    <div className="text-xs text-muted-fg font-semibold mt-0.5">mois d&apos;âge</div>
                  </div>
                )}
                {animal.poidsKg && (
                  <div className="bg-surface-2 border border-border/50 rounded-xl px-3 py-3 text-center">
                    <div className="text-2xl font-black text-foreground">{animal.poidsKg}</div>
                    <div className="text-xs text-muted-fg font-semibold mt-0.5">kg</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {animal.description && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">À propos</p>
              <p className="text-sm text-foreground-2 leading-relaxed">{animal.description}</p>
            </div>
          )}

          {/* Éleveur */}
          <div className={`card p-4 ${estProprietaire ? 'ring-2 ring-amber-300' : ''}`}>
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Éleveur</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-black text-lg">{animal.vendeur.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{animal.vendeur.nom}</p>
                  <p className="text-xs text-muted-fg flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {animal.vendeur.commune}
                  </p>
                </div>
              </div>
              {peutContacter && (
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${animal.vendeur.telephone.replace('+', '')}?text=${whatsappMsg}`}
                    target="_blank" rel="noopener noreferrer"
                    aria-label="Contacter via WhatsApp"
                    className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <a
                    href={`tel:${animal.vendeur.telephone}`}
                    aria-label={`Appeler ${animal.vendeur.nom}`}
                    className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors"
                  >
                    <Phone size={16} className="text-rose-600" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Message propriétaire / admin */}
          {(estProprietaire || estAdmin) && (
            <div className={`card p-4 flex items-start gap-3 border ${estAdmin ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${estAdmin ? 'bg-purple-100' : 'bg-amber-100'}`}>
                <span className="text-xl">{estAdmin ? '🛡️' : '🐾'}</span>
              </div>
              <div>
                <p className={`font-bold text-sm ${estAdmin ? 'text-purple-700' : 'text-amber-700'}`}>
                  {estAdmin ? 'Mode administration' : 'Votre annonce'}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${estAdmin ? 'text-purple-600' : 'text-amber-600'}`}>
                  {estAdmin
                    ? 'En tant qu\'administrateur, vous pouvez visualiser les annonces mais ne pouvez pas contacter les vendeurs.'
                    : 'Vous ne pouvez pas contacter votre propre annonce. Les acheteurs peuvent vous appeler directement.'}
                </p>
              </div>
            </div>
          )}

          {/* Info achat */}
          {peutContacter && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800">
              <p className="font-semibold mb-1">💬 Comment acheter ?</p>
              <p className="text-xs leading-relaxed">
                Appelez ou contactez l&apos;éleveur via WhatsApp pour négocier et organiser le transport. Le paiement se fait entre les deux parties.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Barre fixe bas */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-xl mx-auto bg-white/97 backdrop-blur-xl border-t border-border/60 px-4 py-3">
          {peutContacter ? (
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${animal.vendeur.telephone.replace('+', '')}?text=${whatsappMsg}`}
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
                <Phone size={17} />
                Appeler · {animal.prixFcfa.toLocaleString('fr')} FCFA
              </a>
            </div>
          ) : estProprietaire ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-amber-700 font-semibold flex-1">C&apos;est votre annonce — les acheteurs peuvent vous contacter directement.</p>
              <button onClick={() => router.push('/tableau-bord')} className="btn btn-secondary btn-sm flex-shrink-0">
                Mon tableau <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-purple-700 font-semibold flex-1">Visualisation admin — aucune action disponible.</p>
              <button onClick={() => router.push('/elevage')} className="btn btn-secondary btn-sm flex-shrink-0">
                Retour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
