'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import useStore from '@/store/useStore';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  MapPin, Loader2, MessageSquare, ChevronRight, Star,
  CheckCircle2, ShieldCheck, Scale, Calendar
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { SORO_BLUR_PLACEHOLDER } from '@/lib/image-utils';
import toast from 'react-hot-toast';

const EMOJI: Record<string, string> = {
  BOEUF: '🐄', MOUTON: '🐑', CHEVRE: '🐐',
  VOLAILLE: '🐓', PORC: '🐷', ANE: '🫏',
  CHEVAL: '🐴', CHAMEAU: '🐪',
};

const GRADIENT: Record<string, string> = {
  BOEUF:    'from-amber-600 to-orange-800',
  MOUTON:   'from-slate-500 to-slate-700',
  CHEVRE:   'from-stone-500 to-amber-800',
  VOLAILLE: 'from-yellow-500 to-amber-700',
  PORC:     'from-pink-500 to-rose-700',
  ANE:      'from-zinc-500 to-slate-700',
  CHEVAL:   'from-amber-700 to-stone-900',
  CHAMEAU:  'from-yellow-600 to-amber-800',
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
  const [succes, setSucces] = useState(false);

  const typeLabel = animal.type.charAt(0) + animal.type.slice(1).toLowerCase();
  const regionLabel = animal.region.charAt(0) + animal.region.slice(1).toLowerCase();
  const emoji = EMOJI[animal.type] || '🐾';
  const gradient = GRADIENT[animal.type] || 'from-amber-600 to-orange-700';

  const estProprietaire = utilisateur?.telephone === animal.vendeur.telephone;
  const estAdmin = utilisateur?.role === 'ADMIN';

  const avis = animal.vendeur.avisRecus || [];
  const noteMoyenne = avis.length > 0
    ? avis.reduce((acc, curr) => acc + curr.note, 0) / avis.length
    : 0;

  const whatsappMsg = encodeURIComponent(
    `Bonjour ${animal.vendeur.nom}, je suis intéressé par votre ${typeLabel}${animal.race ? ` (${animal.race})` : ''} à ${animal.prixFcfa.toLocaleString('fr')} FCFA sur Sɔrɔ.`
  );

  const commander = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/commandes', { animalId: animal.id });
      setSucces(true);
      setTimeout(() => router.push(`/commandes/${res.data.data.id}/payer`), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'achat. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  const negocier = async () => {
    if (!token) { router.push('/connexion'); return; }
    try {
      const res = await api.post('/conversations', { animalId: animal.id });
      router.push(`/messages/${res.data.data.id}`);
    } catch {
      toast.error('Impossible de démarrer la discussion');
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/elevage" titre={typeLabel} />

      <main className="flex-1 pb-36">

        {/* Hero Bétail */}
        <div className="relative w-full bg-surface-3" style={{ height: 'clamp(320px, 55vh, 520px)' }}>
          {animal.photoUrl ? (
            <>
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
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60" />
              </div>

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

                {!photoOpen && (
                  <div className="absolute bottom-4 left-0 right-0 z-20 pointer-events-none px-4">
                    <div className="max-w-xl mx-auto">
                       <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl flex items-end justify-between gap-3 text-white">
                          <div className="drop-shadow-lg min-w-0">
                             <h1 className="text-[1.65rem] font-black leading-tight flex items-center gap-2">
                                <span>{emoji}</span> {typeLabel}
                             </h1>
                             <p className="text-white/80 text-sm flex items-center gap-1 mt-1 font-medium">
                                <MapPin size={13} className="text-amber-400 flex-shrink-0" />{animal.commune}, {regionLabel}
                             </p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-600 to-orange-800 rounded-2xl px-5 py-2.5 text-right shadow-xl ring-1 ring-white/20">
                             <div className="text-2xl font-black leading-none">{animal.prixFcfa.toLocaleString('fr')}</div>
                             <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">FCFA NET</div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
             <div className={`relative w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden`}>
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
                <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-black/10" />
                <span className="text-9xl drop-shadow-2xl mb-4 relative z-10">{emoji}</span>
                <h1 className="text-3xl font-black text-white drop-shadow relative z-10">{typeLabel}</h1>
                <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-2.5 text-right shadow-xl">
                   <div className="text-2xl font-black text-white">{animal.prixFcfa.toLocaleString('fr')}</div>
                   <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">FCFA NET</div>
                </div>
             </div>
          )}
        </div>

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Caractéristiques */}
          {(animal.age || animal.poidsKg || animal.race) && (
            <div className="grid grid-cols-2 gap-3">
               {animal.race && (
                  <div className="card p-4 col-span-2 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-xl">🧬</div>
                     <div>
                        <p className="text-[10px] font-black text-muted-fg uppercase tracking-widest leading-none">Race de l&apos;animal</p>
                        <p className="font-bold text-foreground mt-0.5">{animal.race}</p>
                     </div>
                  </div>
               )}
               {animal.age && (
                  <div className="card p-4 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-muted-fg uppercase tracking-widest leading-none">Âge</p>
                        <p className="font-bold text-foreground mt-0.5">{animal.age} mois</p>
                     </div>
                  </div>
               )}
               {animal.poidsKg && (
                  <div className="card p-4 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Scale size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-muted-fg uppercase tracking-widest leading-none">Poids est.</p>
                        <p className="font-bold text-foreground mt-0.5">{animal.poidsKg} kg</p>
                     </div>
                  </div>
               )}
            </div>
          )}

          {/* Vendeur / Éleveur */}
          <div className={`bg-white border border-border/60 rounded-[2rem] p-5 shadow-sm ${estProprietaire ? 'ring-2 ring-amber-400' : ''}`}>
             <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <p className="text-[10px] font-black text-muted-fg uppercase tracking-[0.2em]">Éleveur Professionnel</p>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg ring-4 ring-white text-white font-black text-2xl flex-shrink-0">
                      {animal.vendeur.nom.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-lg">{animal.vendeur.nom}</p>
                        <ShieldCheck size={16} className="text-primary-500" />
                      </div>
                      <p className="text-xs text-muted-fg font-medium flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-amber-500" /> {animal.vendeur.commune}
                        {noteMoyenne > 0 && (
                          <span className="flex items-center gap-0.5 ml-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 italic">
                            <Star size={10} className="fill-amber-500 text-amber-500" /> 
                            <span className="font-black text-amber-700 text-[10px]">{noteMoyenne.toFixed(1)}</span>
                          </span>
                        )}
                      </p>
                   </div>
                </div>

                {!estAdmin && !estProprietaire && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${animal.vendeur.telephone.replace('+', '')}?text=${whatsappMsg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all active:scale-90 border border-[#25D366]/20"
                      title="WhatsApp"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <button
                      onClick={negocier}
                      className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-all active:scale-90 border border-amber-100"
                      title="Chat"
                    >
                      <MessageSquare size={20} />
                    </button>
                  </div>
                )}
             </div>
          </div>

          {/* Description */}
          {animal.description && (
             <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-4 bg-orange-500 rounded-full" />
                   <p className="text-xs font-bold text-foreground uppercase tracking-widest">Description</p>
                </div>
                <p className="text-sm text-foreground-2 leading-relaxed whitespace-pre-wrap">{animal.description}</p>
             </div>
          )}

          {/* Info Escrow */}
          {!estProprietaire && !estAdmin && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-100">🛡️</div>
               <div>
                  <p className="text-sm font-bold text-amber-800">Achat Sécurisé Sɔrô</p>
                  <p className="text-xs text-amber-700 leading-relaxed mt-1">L&apos;argent ne sera reversé à l&apos;éleveur qu&apos;après votre confirmation de réception de l&apos;animal.</p>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Barre d'action fixe Premium */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto p-4">
           <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_-15px_40px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-4 flex flex-col gap-3">
              {succes && (
                <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-3 rounded-2xl text-xs font-bold border border-primary-100 flex-shrink-0">
                   <CheckCircle2 size={16} /> Redirection...
                </div>
              )}
              
              {!estAdmin && !estProprietaire ? (
                <div className="flex flex-col gap-3">
                   <button
                    onClick={commander}
                    disabled={chargement || succes}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-800 text-white font-black rounded-[1.8rem] h-16 flex items-center justify-center transition-all shadow-xl shadow-amber-100 active:scale-95 disabled:opacity-50"
                  >
                    {chargement ? (
                       <Loader2 className="animate-spin" size={24} />
                    ) : (
                       <div className="flex items-center gap-3">
                          <CheckCircle2 size={22} strokeWidth={2.5} />
                          <span className="text-lg">Acheter cet animal</span>
                       </div>
                    )}
                  </button>

                </div>
              ) : estProprietaire ? (
                 <button onClick={() => router.push('/tableau-bord')} className="w-full bg-surface-3 text-foreground font-black rounded-3xl h-14 flex items-center justify-center gap-2 border border-border">
                    Accéder à mon tableau <ChevronRight size={18} />
                 </button>
              ) : (
                 <button onClick={() => router.push('/elevage')} className="w-full bg-slate-50 text-slate-700 font-black rounded-3xl h-14 flex items-center justify-center gap-2 border border-slate-100">
                    Découvrir d&apos;autres bêtes
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
