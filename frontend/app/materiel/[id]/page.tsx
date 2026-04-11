'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { MapPin, Phone, Wrench, Loader2, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';

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
  proprietaire: { nom: string; telephone: string; commune: string };
}

export default function PageDetailMateriel() {
  const { id } = useParams<{ id: string }>();
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
    setErreur('');
    try {
      await api.post(`/materiel/${id}/louer`, {
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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/materiel" />
      <div className="skeleton h-56 w-full" />
      <div className="max-w-xl mx-auto px-4 py-5 space-y-4 w-full">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    </div>
  );

  if (!materiel) return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Header retour="/materiel" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center">
          <Wrench size={32} className="text-muted-fg" strokeWidth={1.5} />
        </div>
        <p className="font-bold text-foreground-3 text-lg">Matériel introuvable</p>
        <button onClick={() => router.push('/materiel')} className="btn btn-secondary btn-sm mt-1">
          Retour au matériel
        </button>
      </div>
    </div>
  );

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

  const whatsappMsg = encodeURIComponent(
    `Bonjour ${materiel.proprietaire.nom}, je suis intéressé par la location de votre ${typeLabel} (${materiel.prixJour.toLocaleString('fr')} FCFA/jour) sur Sɔrɔ.`
  );

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/materiel" titre={typeLabel} />

      <main className="flex-1 pb-36">

        {/* Hero */}
        {materiel.photoUrl ? (
          <div className={`relative w-full bg-gradient-to-br ${gradient}`} style={{ minHeight: '220px', maxHeight: '320px' }}>
            <ImageLightbox
              src={materiel.photoUrl}
              alt={typeLabel}
              gradient={gradient}
              className="relative w-full block"
              open={photoOpen}
              onOpen={() => setPhotoOpen(true)}
              onClose={() => setPhotoOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-4 pointer-events-none">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white drop-shadow">{typeLabel}</h1>
                  <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />{materiel.commune}, {regionLabel}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-right flex-shrink-0">
                  <div className="text-xl font-black text-white">{materiel.prixJour.toLocaleString('fr')}</div>
                  <div className="text-white/70 text-xs font-semibold">FCFA/jour</div>
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
              <h1 className="text-2xl font-black text-white drop-shadow">{typeLabel}</h1>
              <p className="text-white/70 text-sm flex items-center justify-center gap-1 mt-0.5">
                <MapPin size={12} />{materiel.commune}, {regionLabel}
              </p>
            </div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-right">
              <div className="text-xl font-black text-white">{materiel.prixJour.toLocaleString('fr')}</div>
              <div className="text-white/70 text-xs font-semibold">FCFA/jour</div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 py-4 space-y-3">

          {/* Disponibilité + caution */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {materiel.disponible ? (
                  <CheckCircle2 size={18} className="text-primary-600" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
                <span className={`font-bold text-sm ${materiel.disponible ? 'text-primary-700' : 'text-red-600'}`}>
                  {materiel.disponible ? 'Disponible à la location' : 'Indisponible actuellement'}
                </span>
              </div>
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
              <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">À propos</p>
              <p className="text-sm text-foreground-2 leading-relaxed">{materiel.description}</p>
            </div>
          )}

          {/* Propriétaire */}
          <div className={`card p-4 ${estProprietaire ? 'ring-2 ring-amber-300' : ''}`}>
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">Propriétaire</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-black text-lg">{materiel.proprietaire.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{materiel.proprietaire.nom}</p>
                  <p className="text-xs text-muted-fg flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {materiel.proprietaire.commune}
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
                  <a
                    href={`tel:${materiel.proprietaire.telephone}`}
                    aria-label={`Appeler ${materiel.proprietaire.nom}`}
                    className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                  >
                    <Phone size={16} className="text-amber-600" aria-hidden="true" />
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
                <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
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
        <div className="max-w-xl mx-auto bg-white/97 backdrop-blur-xl border-t border-border/60 px-4 py-3 space-y-2">
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
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${materiel.proprietaire.telephone.replace('+', '')}?text=${whatsappMsg}`}
                target="_blank" rel="noopener noreferrer"
                className="btn flex-shrink-0 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-2xl px-4"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <button
                onClick={louer}
                disabled={chargement || succes}
                className="btn flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
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
