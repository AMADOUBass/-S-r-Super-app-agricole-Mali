import Link from 'next/link';
import Image from 'next/image';
import { PrixBadge } from './PrixBadge';
import { BoutonVocal } from './BoutonVocal';

interface AnnonceBase {
  id: string;
  photoUrl?: string | null;
  commune: string;
  region: string;
  description?: string | null;
  createdAt?: string;
}

interface AnnonceProduit extends AnnonceBase {
  type: string;
  quantiteKg: number;
  prixFcfa: number;
  agriculteur?: { nom: string };
}

interface AnnonceMateriel extends AnnonceBase {
  type: string;
  prixJour: number;
  caution: number;
  proprietaire?: { nom: string };
}

interface AnnonceAnimal extends AnnonceBase {
  type: string;
  race?: string | null;
  age?: number | null;
  poidsKg?: number | null;
  prixFcfa: number;
  vendeur?: { nom: string };
}

type Annonce = AnnonceProduit | AnnonceMateriel | AnnonceAnimal;

interface CarteAnnonceProps {
  annonce: Annonce;
  type: 'produit' | 'materiel' | 'animal';
}

const EMOJI: Record<string, string> = {
  MIL: '🌾', SORGHO: '🌾', MAIS: '🌽', RIZ: '🍚', ARACHIDE: '🥜',
  NIEBE: '🫘', MANGUE: '🥭', OIGNON: '🧅', TOMATE: '🍅', KARITE: '🌿',
  SESAME: '✨', COTON: '☁️', TRACTEUR: '🚜', MOTOPOMPE: '💧',
  BATTEUSE: '⚙️', CHARRUE: '🔩', SEMOIR: '🌱', SILO: '🏗️',
  BOEUF: '🐄', MOUTON: '🐑', CHEVRE: '🐐', VOLAILLE: '🐓', ANE: '🫏',
};

const THUMB_BG: Record<'produit' | 'materiel' | 'animal', string> = {
  produit:  'bg-emerald-50',
  materiel: 'bg-amber-50',
  animal:   'bg-rose-50',
};

function getCloudinaryThumb(url: string, size = 200): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`);
}

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

export function CarteAnnonce({ annonce, type }: CarteAnnonceProps) {
  const href = `/${type === 'produit' ? 'produits' : type === 'materiel' ? 'materiel' : 'elevage'}/${annonce.id}`;
  const emoji = EMOJI[annonce.type] || '📦';
  const label = annonce.type.charAt(0) + annonce.type.slice(1).toLowerCase();
  const regionLabel = annonce.region.charAt(0) + annonce.region.slice(1).toLowerCase();
  const nouveau = isNew(annonce.createdAt);

  const vendeur =
    type === 'produit' ? (annonce as AnnonceProduit).agriculteur?.nom
    : type === 'materiel' ? (annonce as AnnonceMateriel).proprietaire?.nom
    : (annonce as AnnonceAnimal).vendeur?.nom;

  let texteVocal = `${label} à ${annonce.commune}. `;
  if (type === 'produit') {
    const p = annonce as AnnonceProduit;
    texteVocal += `${p.quantiteKg} kg à ${p.prixFcfa} francs le kilo.`;
  }

  return (
    <div className="group h-full">
      <Link
        href={href}
        className="
          h-full relative flex flex-col p-5 bg-white rounded-[2.5rem]
          border border-black/5 hover:border-black/10
          shadow-[0_8px_30px_rgb(0,0,0,0.04)]
          hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]
          hover:-translate-y-1.5 transition-all duration-500 ease-out
          cursor-pointer overflow-hidden
        "
      >
        {/* Header: Badge Nouveauté */}
        {nouveau && (
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-primary-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/30 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              NOUVEAU
            </span>
          </div>
        )}

        {/* Thumbnail: Fixed ratio, large display */}
        <div className={`relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden ${THUMB_BG[type]} flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.03] shadow-inner mb-5`}>
          {annonce.photoUrl ? (
            <Image
              src={getCloudinaryThumb(annonce.photoUrl, 400)}
              alt={annonce.type}
              fill
              className="object-cover"
              unoptimized={true}
            />
          ) : (
            <span className="text-6xl filter drop-shadow-md">{emoji}</span>
          )}
          
          {/* Overlay gradient only at the bottom for text contrast if needed */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content Section: Vertical stack with clear spacing */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Title & Type */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-extrabold text-foreground text-xl tracking-tight leading-tight truncate">
                {label}
              </h3>
              <p className="text-[11px] font-bold text-muted-fg uppercase tracking-widest mt-1">
                {type} {type === 'animal' && (annonce as AnnonceAnimal).race ? `· ${(annonce as AnnonceAnimal).race}` : ''}
              </p>
            </div>
            
            {/* Dedicated Action: Voice Button always on Top Right of content section */}
            <div className="flex-shrink-0">
              <BoutonVocal texte={texteVocal} />
            </div>
          </div>

          {/* Pricing Section: Large and bold, separated from geolocation */}
          <div className="bg-surface-2 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 transition-colors group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-border/30">
            <div className="flex flex-col">
              {type === 'produit' && (
                <>
                  <span className="text-xl font-black text-emerald-700 leading-none">
                    {(annonce as AnnonceProduit).prixFcfa.toLocaleString('fr')} <span className="text-[11px] font-bold uppercase opacity-60">F / kg</span>
                  </span>
                  <span className="text-[11px] font-bold text-muted-fg mt-1">
                    📦 {(annonce as AnnonceProduit).quantiteKg.toLocaleString('fr')} kg disponibles
                  </span>
                </>
              )}
              {type === 'materiel' && (
                <>
                  <span className="text-xl font-black text-amber-700 leading-none">
                    {(annonce as AnnonceMateriel).prixJour.toLocaleString('fr')} <span className="text-[11px] font-bold uppercase opacity-60">F / jour</span>
                  </span>
                  <span className="text-[11px] font-bold text-muted-fg mt-1">
                    🛡️ Caution: {(annonce as AnnonceMateriel).caution.toLocaleString('fr')} F
                  </span>
                </>
              )}
              {type === 'animal' && (
                <>
                  <span className="text-xl font-black text-rose-700 leading-none">
                    {(annonce as AnnonceAnimal).prixFcfa.toLocaleString('fr')} <span className="text-[11px] font-bold uppercase opacity-60">FCFA</span>
                  </span>
                  <span className="text-[11px] font-bold text-muted-fg mt-1 uppercase tracking-tighter">
                    🐾 Vente directe
                  </span>
                </>
              )}
            </div>
            
            {/* Right arrow indicator */}
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-muted-fg border border-border/40 transition-transform group-hover:translate-x-1 group-hover:text-primary-600">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          {/* Geographical & Seller Footer */}
          <div className="mt-auto pt-3 border-t border-black/[0.03] space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-bold text-foreground-3">
              <svg className="text-primary-600 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="truncate">{annonce.commune}, {regionLabel}</span>
            </div>
            {vendeur && (
              <div className="flex items-center gap-2 text-[12px] font-bold text-muted-fg bg-surface-3/50 px-2 py-1 rounded-lg w-fit">
                <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {vendeur}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
