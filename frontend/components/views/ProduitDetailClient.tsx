'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useState } from 'react';
import useStore from '@/store/useStore';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  MapPin, Package, XCircle, Loader2,
  ShoppingCart, Minus, Plus, Lock, ChevronRight, MessageSquare, Star, ShieldCheck
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SORO_BLUR_PLACEHOLDER } from '@/lib/image-utils';
import toast from 'react-hot-toast';

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅',
  KARITE: '🌿', SESAME: '✨', COTON: '☁️', GOMBO: '🥦',
  PATATE_DOUCE: '🍠', IGNAME: '🥔',
};

const GRADIENT: Record<string, string> = {
  MIL: 'from-primary-600 to-emerald-700',
  SORGHO: 'from-primary-600 to-emerald-700',
  MAIS: 'from-yellow-500 to-amber-600',
  RIZ: 'from-slate-500 to-gray-600',
  ARACHIDE: 'from-amber-500 to-yellow-600',
  NIEBE: 'from-orange-500 to-amber-600',
  MANGUE: 'from-yellow-500 to-orange-600',
  OIGNON: 'from-purple-500 to-pink-600',
  TOMATE: 'from-red-500 to-rose-600',
  KARITE: 'from-primary-500 to-teal-600',
  SESAME: 'from-amber-500 to-yellow-600',
  COTON: 'from-sky-400 to-blue-600',
};

const QUANTITES_RAPIDES = [10, 25, 50, 100, 200, 500];

interface Produit {
  id: string;
  type: string;
  disponible: boolean;
  quantiteKg: number;
  prixFcfa: number;
  photoUrl?: string | null;
  description?: string | null;
  commune: string;
  region: string;
  agriculteur: {
    id: string;
    nom: string;
    telephone: string;
    commune: string;
    photoUrl?: string;
    avisRecus?: Array<{ note: number }>;
  };
}

export function ProduitDetailClient({ produit }: { produit: Produit }) {
  useTranslation();
  const router = useRouter();
  const token = useStore(s => s.token);
  const utilisateur = useStore(s => s.utilisateur);
  const [quantite, setQuantite] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const commander = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/commandes', { produitId: produit.id, quantiteKg: quantite });
      router.push(`/commandes/${res.data.data.id}/payer`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Erreur lors de la commande. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  const negocier = async () => {
    if (!token) { router.push('/connexion'); return; }
    setChargement(true);
    try {
      const res = await api.post('/conversations', { produitId: produit.id });
      router.push(`/messages/${res.data.data.id}`);
    } catch {
      toast.error('Impossible de démarrer la discussion');
    } finally {
      setChargement(false);
    }
  };

  const ajuster = (delta: number) =>
    setQuantite(q => Math.max(1, Math.min(produit.quantiteKg, q + delta)));

  const montant = Math.round(produit.prixFcfa * quantite);
  const commission = Math.round(montant * 0.03);
  const total = montant + commission;
  const typeLabel = produit.type.charAt(0) + produit.type.slice(1).toLowerCase();
  const regionLabel = produit.region.charAt(0) + produit.region.slice(1).toLowerCase();
  const emoji = EMOJI[produit.type] || '📦';
  const gradient = GRADIENT[produit.type] || 'from-primary-600 to-emerald-700';
  const dispo = produit.disponible && produit.quantiteKg > 0;
  const stockPct = Math.min(100, Math.round((produit.quantiteKg / 1000) * 100));
  const estProprietaire = utilisateur?.telephone === produit.agriculteur.telephone;
  const estAdmin = utilisateur?.role === 'ADMIN';
  const peutCommander = dispo && !estProprietaire && !estAdmin;

  const avis = produit.agriculteur.avisRecus || [];
  const noteMoyenne = avis.length > 0
    ? avis.reduce((acc, curr) => acc + curr.note, 0) / avis.length
    : 0;

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Header retour="/produits" titre={typeLabel} />

      <main className="flex-1 pb-36">

        {/* Hero Immersif */}
        <div className="relative w-full bg-surface-3" style={{ height: 'clamp(320px, 55vh, 520px)' }}>
          {produit.photoUrl ? (
            <>
              {/* Fond flou plein écran — ambiance uniquement */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={produit.photoUrl}
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
                  src={produit.photoUrl}
                  alt={typeLabel}
                  height="100%"
                  objectCover={true}
                  className="h-full w-full"
                  open={photoOpen}
                  onOpen={() => setPhotoOpen(true)}
                  onClose={() => setPhotoOpen(false)}
                />

              {/* Overlay — masqué quand le lightbox est ouvert */}
              {!photoOpen && (
                <div className="absolute bottom-4 left-0 right-0 z-20 pointer-events-none">
                  <div className="max-w-xl mx-auto px-4">
                    <div className="bg-black/30 backdrop-blur-md border border-white/25 rounded-2xl p-4 shadow-2xl flex items-end justify-between gap-3">
                      <div className="drop-shadow-lg min-w-0">
                        <h1 className="text-[1.65rem] font-black text-white leading-tight">{typeLabel}</h1>
                        <p className="text-white/75 text-sm flex items-center gap-1 mt-1 font-medium">
                          <MapPin size={13} className="text-primary-300 flex-shrink-0" />{produit.commune}, {regionLabel}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl px-4 py-2.5 text-right shadow-xl ring-1 ring-white/20 flex-shrink-0">
                        <div className="text-2xl font-black">{produit.prixFcfa.toLocaleString('fr')}</div>
                        <div className="text-white/75 text-[10px] font-bold uppercase tracking-widest">FCFA/kg</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                <div className="text-2xl font-black text-white">{produit.prixFcfa.toLocaleString('fr')}</div>
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest">FCFA/kg</div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

          {/* Stock + statut */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              {dispo ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500" />
                  </span>
                  <span className="font-bold text-sm text-primary-700">En stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="font-bold text-sm text-red-600">Rupture de stock</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm font-bold text-foreground-2">
                <Package size={14} className="text-muted-fg" />
                {produit.quantiteKg.toLocaleString('fr')} kg
              </div>
            </div>
            {dispo && (
              <>
                <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, stockPct)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-fg mt-1.5">
                  Stock disponible — commandez avant rupture
                </p>
              </>
            )}
          </div>

          {/* Description */}
          {produit.description && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">À propos</p>
              </div>
              <p className="text-sm text-foreground-2 leading-relaxed">{produit.description}</p>
            </div>
          )}

          {/* Agriculteur */}
          <div className={`bg-white border border-border/60 rounded-[2rem] p-5 shadow-sm ${estProprietaire ? 'ring-2 ring-amber-300' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
              <p className="text-[10px] font-black text-muted-fg uppercase tracking-[0.2em]">Producteur</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-500 to-emerald-700 flex items-center justify-center shadow-lg ring-4 ring-white flex-shrink-0">
                  <span className="text-white font-black text-2xl">{produit.agriculteur.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-lg">{produit.agriculteur.nom}</p>
                    <ShieldCheck size={16} className="text-primary-500" />
                  </div>
                  <p className="text-xs text-muted-fg font-medium flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-primary-400" /> {produit.agriculteur.commune}
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
                    href={`https://wa.me/${produit.agriculteur.telephone.replace('+', '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce de ${typeLabel} sur Sɔrɔ.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all active:scale-90 border border-[#25D366]/20"
                    title="WhatsApp"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <button
                    onClick={negocier}
                    className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center transition-all active:scale-90 border border-primary-100"
                    title="Négocier"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              )}
            </div>
            

          </div>

          {/* Message propriétaire / admin */}
          {(estProprietaire || estAdmin) && (
            <div className={`card p-4 flex items-start gap-3 border ${estAdmin ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${estAdmin ? 'bg-purple-100' : 'bg-amber-100'}`}>
                <span className="text-xl">{estAdmin ? '🛡️' : '🌾'}</span>
              </div>
              <div>
                <p className={`font-bold text-sm ${estAdmin ? 'text-purple-700' : 'text-amber-700'}`}>
                  {estAdmin ? 'Mode administration' : 'Votre annonce'}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${estAdmin ? 'text-purple-600' : 'text-amber-600'}`}>
                  {estAdmin
                    ? 'En tant qu\'administrateur, vous pouvez visualiser les annonces mais ne pouvez pas passer de commande ni contacter les vendeurs.'
                    : 'Vous ne pouvez pas commander votre propre récolte. Les acheteurs peuvent vous contacter via WhatsApp ou téléphone.'}
                </p>
              </div>
            </div>
          )}

          {/* Commande */}
          {peutCommander && (
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary-500 rounded-full" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Votre commande</p>
              </div>

              {/* Quantités rapides */}
              <div>
                <p className="text-xs text-muted-fg mb-2 font-medium">Sélection rapide</p>
                <div className="flex flex-wrap gap-2">
                  {QUANTITES_RAPIDES.filter(q => q <= produit.quantiteKg).map(q => (
                    <button
                      key={q}
                      onClick={() => setQuantite(q)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        quantite === q
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                          : 'bg-white text-foreground-3 border-border hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      {q} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur quantité */}
              <div>
                <p className="text-xs text-muted-fg mb-2 font-medium">Quantité personnalisée</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => ajuster(-1)}
                    disabled={quantite <= 1}
                    aria-label="Diminuer la quantité"
                    className="w-11 h-11 rounded-2xl bg-surface-3 border border-border flex items-center justify-center hover:bg-surface-2 transition-all disabled:opacity-30 active:scale-95"
                  >
                    <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      value={quantite}
                      onChange={e => setQuantite(Math.max(1, Math.min(produit.quantiteKg, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={produit.quantiteKg}
                      className="w-full text-center text-2xl font-black border-2 border-border rounded-2xl px-2 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                    <p className="text-xs text-muted-fg mt-1">kg · max {produit.quantiteKg.toLocaleString('fr')} kg</p>
                  </div>
                  <button
                    onClick={() => ajuster(1)}
                    disabled={quantite >= produit.quantiteKg}
                    aria-label="Augmenter la quantité"
                    className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center hover:from-primary-600 hover:to-primary-800 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                  >
                    <Plus size={16} strokeWidth={2.5} color="white" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Récapitulatif prix */}
              <div className="bg-surface-2 border border-border/60 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between text-foreground-2">
                    <span className="font-medium">{quantite} kg × {produit.prixFcfa.toLocaleString('fr')} FCFA</span>
                    <span className="font-bold">{montant.toLocaleString('fr')} FCFA</span>
                  </div>
                  <div className="flex justify-between text-muted-fg text-xs">
                    <span>Commission Sɔrɔ (3%)</span>
                    <span>{commission.toLocaleString('fr')} FCFA</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary-600 to-emerald-700 px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">Total à payer</span>
                  <span className="text-white font-black text-xl">{total.toLocaleString('fr')} FCFA</span>
                </div>
              </div>

              {/* Note sécurité */}
              <div className="flex items-start gap-2 text-xs text-muted-fg bg-primary-50 border border-primary-100 rounded-xl p-3">
                <Lock size={12} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <span><span className="text-primary-700 font-semibold">Paiement sécurisé</span> — L&apos;agriculteur reçoit 100% du montant. La commission est payée par l&apos;acheteur.</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Barre fixe bas — Style Premium Floating */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto p-4">
           <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_-15px_40px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-4 flex flex-col gap-3">
              {peutCommander ? (
                <div className="flex flex-col gap-3">
                   <button
                    onClick={commander}
                    disabled={chargement}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-primary-600 to-emerald-700 hover:from-primary-700 hover:to-emerald-800 text-white font-black rounded-[1.8rem] h-16 flex items-center justify-center transition-all shadow-xl shadow-primary-100 active:scale-95 disabled:opacity-50"
                  >
                    {chargement ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <div className="flex items-center gap-3">
                         <ShoppingCart size={22} strokeWidth={2.5} />
                         <span className="text-lg">Commander ({total.toLocaleString('fr')} FCFA)</span>
                      </div>
                    )}
                  </button>
                  

                </div>
              ) : estProprietaire ? (
                <button onClick={() => router.push('/tableau-bord')} className="w-full bg-surface-3 text-foreground font-black rounded-3xl h-14 flex items-center justify-center gap-2 border border-border">
                  Mon tableau de bord <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={() => router.push('/produits')} className="w-full bg-red-50 text-red-700 font-black rounded-3xl h-14 flex items-center justify-center gap-2 border border-red-100">
                  Produit épuisé <XCircle size={18} />
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
