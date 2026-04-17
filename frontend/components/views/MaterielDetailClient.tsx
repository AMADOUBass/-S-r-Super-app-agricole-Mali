'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  MapPin, CheckCircle2, XCircle, Phone, Loader2,
  ChevronRight, MessageSquare, Star
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SORO_BLUR_PLACEHOLDER } from '@/lib/image-utils';

const EMOJI: Record<string, string> = {
  TRACTEUR: '🚜', MOTOPOMPE: '💧', BATTEUSE: '⚙️',
  CHARRUE: '🔩', SEMOIR: '🌱', SILO: '🏗️',
  REMORQUE: '🚛', PULVERISATEUR: '💦', MOISSONNEUSE: '🌾',
};

const GRADIENT: Record<string, string> = {
  TRACTEUR:      'from-amber-600 to-orange-700',
  MOTOPOMPE:     'from-sky-500 to-blue-700',
  BATTEUSE:      'from-slate-500 to-gray-700',
  CHARRUE:       'from-stone-500 to-amber-700',
  SEMOIR:        'from-primary-500 to-emerald-700',
  SILO:          'from-zinc-500 to-slate-700',
  REMORQUE:      'from-amber-700 to-orange-800',
  PULVERISATEUR: 'from-sky-400 to-blue-600',
  MOISSONNEUSE:  'from-yellow-500 to-amber-600',
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
  proprietaire: {
    id: string;
    nom: string;
    telephone: string;
    commune: string;
    photoUrl?: string;
    avisRecus?: Array<{ note: number }>;
  };
}

export function MaterielDetailClient({ materiel }: { materiel: Materiel }) {
  useTranslation();
  const router = useRouter();
  const token = useStore(s => s.token);
  const utilisateur = useStore(s => s.utilisateur);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(tomorrow);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const nbJours = Math.max(1, Math.ceil(
    (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000
  ));

  const louer = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    setErreur('');
    try {
      await api.post(`/materiel/${materiel.id}/louer`, {
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
      });
      setSucces(true);
      setTimeout(() => router.push('/materiel'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErreur(error.response?.data?.error || 'Erreur lors de la location. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  const negocier = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/conversations', { materielId: materiel.id });
      router.push(`/messages/${res.data.data.id}`);
    } catch {
      setErreur('Impossible de démarrer la discussion');
    } finally {
      setChargement(false);
    }
  };

  const typeLabel = materiel.type.charAt(0) + materiel.type.slice(1).toLowerCase();
  const regionLabel = materiel.region.charAt(0) + materiel.region.slice(1).toLowerCase();
  const emoji = EMOJI[materiel.type] || '⚙️';
  const gradient = GRADIENT[materiel.type] || 'from-amber-600 to-orange-700';
  const montant = nbJours * materiel.prixJour;
  const commission = Math.round(montant * 0.05);
  const total = montant + commission + materiel.caution;

  const estProprietaire = utilisateur?.telephone === materiel.proprietaire.telephone;
  const estAdmin = utilisateur?.role === 'ADMIN';
  const peutLouer = materiel.disponible && !estProprietaire && !estAdmin;

  const avis = materiel.proprietaire.avisRecus || [];
  const noteMoyenne = avis.length > 0
    ? avis.reduce((acc, curr) => acc + curr.note, 0) / avis.length
    : 0;

  const whatsappMsg = encodeURIComponent(
    `Bonjour ${materiel.proprietaire.nom}, je suis intéressé par la location de votre ${typeLabel} (${materiel.prixJour.toLocaleString('fr')} FCFA/jour) sur Sɔrɔ.`
  );

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/materiel" titre={typeLabel} />

      <main className="flex-1 pb-36">

        {/* Hero Immersif */}
        <div className="relative w-full bg-surface-3" style={{ height: 'clamp(320px, 55vh, 520px)' }}>
          {materiel.photoUrl ? (
            <>
              {/* Fond flou plein écran — ambiance uniquement */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={materiel.photoUrl}
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
                  src={materiel.photoUrl}
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
                        <h1 className="text-[1.65rem] font-black text-white leading-tight">{typeLabel}</h1>
                        <p className="text-white/75 text-sm flex items-center gap-1 mt-1 font-medium">
                          <MapPin size={13} className="text-primary-300 flex-shrink-0" />{materiel.commune}, {regionLabel}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl px-4 py-2.5 text-right shadow-xl ring-1 ring-white/20 flex-shrink-0">
                        <div className="text-2xl font-black">{materiel.prixJour.toLocaleString('fr')}</div>
                        <div className="text-white/75 text-[10px] font-bold uppercase tracking-widest">FCFA/jour</div>
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
              <h1 className="text-2xl font-black text-white drop-shadow relative z-10">{typeLabel}</h1>
              <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 text-right shadow-xl">
                <div className="text-2xl font-black text-white">{materiel.prixJour.toLocaleString('fr')}</div>
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest">FCFA/jour</div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Disponibilité + caution */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              {materiel.disponible ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500" />
                  </span>
                  <span className="font-bold text-sm text-primary-700">Disponible à la location</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="font-bold text-sm text-red-600">Indisponible actuellement</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 size={15} className="text-amber-600 flex-shrink-0" />
              <span className="text-amber-800 font-semibold text-sm">
                Caution : {materiel.caution.toLocaleString('fr')} FCFA (remboursée)
              </span>
            </div>
          </div>

          {/* Description */}
          {materiel.description && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">À propos</p>
              </div>
              <p className="text-sm text-foreground-2 leading-relaxed">{materiel.description}</p>
            </div>
          )}

          {/* Propriétaire */}
          <div className={`card p-4 ${estProprietaire ? 'ring-2 ring-amber-300' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-amber-600 rounded-full" />
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Propriétaire</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md ring-2 ring-white flex-shrink-0">
                  <span className="text-white font-black text-xl">{materiel.proprietaire.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{materiel.proprietaire.nom}</p>
                    {noteMoyenne > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700">{noteMoyenne.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-fg flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {materiel.proprietaire.commune}
                    {avis.length > 0 && (
                      <span className="text-muted-fg/60">· {avis.length} avis</span>
                    )}
                  </p>
                </div>
              </div>
              {peutLouer && (
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${materiel.proprietaire.telephone.replace('+', '')}?text=${whatsappMsg}`}
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
                    href={`tel:${materiel.proprietaire.telephone}`}
                    aria-label={`Appeler ${materiel.proprietaire.nom}`}
                    className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center hover:bg-primary-100 transition-colors"
                  >
                    <Phone size={16} className="text-primary-600" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Message propriétaire / admin */}
          {(estProprietaire || estAdmin) && (
            <div className={`card p-4 flex items-start gap-3 border ${estAdmin ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${estAdmin ? 'bg-purple-100' : 'bg-amber-100'}`}>
                <span className="text-xl">{estAdmin ? '🛡️' : '🚜'}</span>
              </div>
              <div>
                <p className={`font-bold text-sm ${estAdmin ? 'text-purple-700' : 'text-amber-700'}`}>
                  {estAdmin ? 'Mode administration' : 'Votre matériel'}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${estAdmin ? 'text-purple-600' : 'text-amber-600'}`}>
                  {estAdmin
                    ? 'En tant qu\'administrateur, vous pouvez visualiser les annonces mais ne pouvez pas effectuer de location.'
                    : 'Vous ne pouvez pas louer votre propre matériel. Les locataires peuvent vous contacter directement.'}
                </p>
              </div>
            </div>
          )}

          {/* Calculateur location */}
          {peutLouer && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-primary-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Période de location</p>
              </div>

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

              <div className="bg-surface-2 border border-border/60 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between text-foreground-2">
                    <span className="font-medium">{nbJours} jour{nbJours > 1 ? 's' : ''} × {materiel.prixJour.toLocaleString('fr')} FCFA</span>
                    <span className="font-bold">{montant.toLocaleString('fr')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-muted-fg text-xs">
                    <span>Commission Sɔrɔ (5%)</span>
                    <span>{commission.toLocaleString('fr')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-muted-fg text-xs">
                    <span>Caution (remboursable)</span>
                    <span>{materiel.caution.toLocaleString('fr')} FCFA</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-700 px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">Total à payer</span>
                  <span className="text-white font-black text-xl">{total.toLocaleString('fr')} FCFA</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Barre fixe bas */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-xl mx-auto bg-white/97 backdrop-blur-xl border-t border-border/60 px-4 py-3 space-y-2 shadow-[0_-4px_28px_rgba(0,0,0,0.09)]">
          {erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-xs font-semibold animate-fade-up">
              <XCircle size={14} className="flex-shrink-0" /> {erreur}
            </div>
          )}
          {succes && (
            <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-2.5 text-primary-700 text-xs font-semibold animate-fade-up">
              <CheckCircle2 size={14} className="flex-shrink-0" /> Location confirmée ! Le propriétaire vous contactera.
            </div>
          )}
          {peutLouer ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${materiel.proprietaire.telephone.replace('+', '')}?text=${whatsappMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0e7a60] text-white font-bold rounded-2xl shadow-md px-4"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <button
                  onClick={negocier}
                  disabled={chargement}
                  className="btn flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors border-2 border-emerald-300"
                >
                  {chargement ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                  Négocier
                </button>
              </div>
              <button
                onClick={louer}
                disabled={chargement || succes}
                className="btn w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
              >
                {chargement ? (
                  <><Loader2 size={16} className="animate-spin" /> Réservation…</>
                ) : (
                  <>Louer {nbJours}j — {total.toLocaleString('fr')} FCFA</>
                )}
              </button>
            </div>
          ) : estProprietaire ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-amber-700 font-semibold flex-1">C&apos;est votre matériel — les locataires peuvent vous contacter directement.</p>
              <button onClick={() => router.push('/tableau-bord')} className="btn btn-secondary btn-sm flex-shrink-0">
                Mon tableau <ChevronRight size={13} />
              </button>
            </div>
          ) : estAdmin ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-purple-700 font-semibold flex-1">Visualisation admin — aucune action disponible.</p>
              <button onClick={() => router.push('/materiel')} className="btn btn-secondary btn-sm flex-shrink-0">
                Retour
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={18} />
                <span className="font-bold text-sm">Indisponible actuellement</span>
              </div>
              <button onClick={() => router.push('/materiel')} className="btn btn-secondary btn-sm">
                Voir d&apos;autres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
