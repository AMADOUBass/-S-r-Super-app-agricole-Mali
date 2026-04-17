'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import useStore from '@/store/useStore';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  MapPin, Phone, Loader2, MessageSquare, ChevronRight, Star
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { SORO_BLUR_PLACEHOLDER } from '@/lib/image-utils';

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
  vendeur: {
    id: string;
    nom: string;
    telephone: string;
    commune: string;
    photoUrl?: string;
    avisRecus?: Array<{ note: number }>;
  };
}

export function ElevageDetailClient({ animal }: { animal: Animal }) {
  useTranslation();
  const router = useRouter();
  const utilisateur = useStore(s => s.utilisateur);
  const token = useStore(s => s.token);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [chargement, setChargement] = useState(false);

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const regionLabel = animal.region.charAt(0) + animal.region.slice(1).toLowerCase();
  const emoji = EMOJI[animal.type] || '🐾';
  const gradient = GRADIENT[animal.type] || 'from-amber-600 to-orange-700';

  const estProprietaire = utilisateur?.telephone === animal.vendeur.telephone;
  const estAdmin = utilisateur?.role === 'ADMIN';
  const peutContacter = !estProprietaire && !estAdmin;

  const avis = animal.vendeur.avisRecus || [];
  const noteMoyenne = avis.length > 0
    ? avis.reduce((acc, curr) => acc + curr.note, 0) / avis.length
    : 0;

  const whatsappMsg = encodeURIComponent(
    `Bonjour ${animal.vendeur.nom}, je suis intéressé par votre ${typeLabel}${animal.race ? ` (${animal.race})` : ''} à ${animal.prixFcfa.toLocaleString('fr')} FCFA sur Sɔrɔ.`
  );

  const negocier = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/conversations', { animalId: animal.id });
      router.push(`/messages/${res.data.data.id}`);
    } catch {
      // Handle error silently or via toast
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/elevage" titre={typeLabel} />

      <main className="flex-1 pb-32">

        {/* Hero Immersif */}
        <div className="relative w-full bg-surface-3" style={{ height: 'clamp(320px, 55vh, 520px)' }}>
          {animal.photoUrl ? (
            <>
              {/* Fond flou plein écran — ambiance uniquement */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={animal.photoUrl}
                  alt=""
                  fill
                  className="object-cover blur-2xl opacity-40 scale-110"
                  aria-hidden="true"
                  placeholder="blur"
                  blurDataURL={SORO_BLUR_PLACEHOLDER}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/75" />
              </div>

              {/* Image principale — max-w-xl pour éviter l'étirement desktop */}
              <div className="relative h-full max-w-xl mx-auto z-10 overflow-hidden">
                <ImageLightbox
                  src={animal.photoUrl}
                  alt={typeLabel}
                  height="100%"
                  objectCover={true}
                  className="h-full w-full"
                  open={photoOpen}
                  onOpen={() => setPhotoOpen(true)}
                  onClose={() => setPhotoOpen(false)}
                />
              </div>

              {/* Overlay — masqué quand le lightbox est ouvert */}
              {!photoOpen && (
                <div className="absolute bottom-4 left-0 right-0 z-20 pointer-events-none">
                  <div className="max-w-xl mx-auto px-4">
                    <div className="bg-black/30 backdrop-blur-md border border-white/25 rounded-2xl p-4 shadow-2xl flex items-end justify-between gap-3">
                      <div className="drop-shadow-lg min-w-0">
                        <h1 className="text-[1.65rem] font-black text-white leading-tight">
                          {typeLabel}{animal.race && <span className="font-normal text-white/75"> · {animal.race}</span>}
                        </h1>
                        <p className="text-white/75 text-sm flex items-center gap-1 mt-1 font-medium">
                          <MapPin size={13} className="text-primary-300 flex-shrink-0" />{animal.commune}, {regionLabel}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl px-4 py-2.5 text-right shadow-xl ring-1 ring-white/20 flex-shrink-0">
                        <div className="text-2xl font-black">{animal.prixFcfa.toLocaleString('fr')}</div>
                        <div className="text-white/75 text-[10px] font-bold uppercase tracking-widest">FCFA</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Fallback sans photo */
            <div className={`relative w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden`}>
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-black/10" />
              <div className="absolute right-1/3 top-1/4 w-16 h-16 rounded-full bg-white/5" />
              <span className="text-8xl drop-shadow-lg mb-3 relative z-10">{emoji}</span>
              <h1 className="text-2xl font-black text-white drop-shadow relative z-10">
                {typeLabel}{animal.race && <span className="font-normal text-white/80"> · {animal.race}</span>}
              </h1>
              <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 text-right shadow-xl">
                <div className="text-2xl font-black text-white">{animal.prixFcfa.toLocaleString('fr')}</div>
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest">FCFA</div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Caractéristiques */}
          {(animal.age || animal.poidsKg) && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-primary-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Caractéristiques</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {animal.age && (
                  <div className="relative bg-surface-2 border border-border/50 rounded-2xl px-3 py-4 text-center overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-600" />
                    <div className="text-3xl font-black text-foreground mt-1">{animal.age}</div>
                    <div className="text-xs text-muted-fg font-semibold mt-1.5">mois d&apos;âge</div>
                  </div>
                )}
                {animal.poidsKg && (
                  <div className="relative bg-surface-2 border border-border/50 rounded-2xl px-3 py-4 text-center overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-400 to-primary-600" />
                    <div className="text-3xl font-black text-foreground mt-1">{animal.poidsKg}</div>
                    <div className="text-xs text-muted-fg font-semibold mt-1.5">kg</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {animal.description && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">À propos</p>
              </div>
              <p className="text-sm text-foreground-2 leading-relaxed">{animal.description}</p>
            </div>
          )}

          {/* Éleveur */}
          <div className={`card p-4 ${estProprietaire ? 'ring-2 ring-amber-300' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Éleveur</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md ring-2 ring-white flex-shrink-0">
                  <span className="text-white font-black text-xl">{animal.vendeur.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{animal.vendeur.nom}</p>
                    {noteMoyenne > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700">{noteMoyenne.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-fg flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {animal.vendeur.commune}
                    {avis.length > 0 && (
                      <span className="text-muted-fg/60">· {avis.length} avis</span>
                    )}
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
                  <button
                    onClick={negocier}
                    disabled={chargement}
                    aria-label="Négocier par chat"
                    className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                  >
                    {chargement ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <MessageSquare size={16} className="text-emerald-600" />}
                  </button>
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
        <div className="max-w-xl mx-auto bg-white/97 backdrop-blur-xl border-t border-border/60 px-4 py-3 shadow-[0_-4px_28px_rgba(0,0,0,0.09)]">
          {peutContacter ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${animal.vendeur.telephone.replace('+', '')}?text=${whatsappMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0e7a60] text-white font-bold rounded-2xl shadow-md"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${animal.vendeur.telephone}`}
                  className="btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white font-bold rounded-2xl shadow-md"
                >
                  <Phone size={17} />
                  Appeler
                </a>
              </div>
              <button
                onClick={negocier}
                disabled={chargement}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors border-2 border-emerald-300"
              >
                {chargement ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                Négocier sur Sɔrɔ
              </button>
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
