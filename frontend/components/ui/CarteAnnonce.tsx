import Link from 'next/link';
import Image from 'next/image';
import { PrixBadge } from './PrixBadge';

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

// Thumbnail background gradient per category type
const THUMB_BG: Record<'produit' | 'materiel' | 'animal', string> = {
  produit:  'bg-gradient-to-br from-primary-100 to-emerald-50',
  materiel: 'bg-gradient-to-br from-amber-100 to-orange-50',
  animal:   'bg-gradient-to-br from-rose-100 to-pink-50',
};

// Accent color on left border per category type
const ACCENT: Record<'produit' | 'materiel' | 'animal', string> = {
  produit:  'border-l-primary-400',
  materiel: 'border-l-amber-400',
  animal:   'border-l-rose-400',
};

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

  return (
    <Link
      href={href}
      className={`
        relative flex gap-3.5 p-3.5 bg-white rounded-2xl
        border border-border/50 border-l-[3px] ${ACCENT[type]}
        shadow-card hover:shadow-card-hover
        hover:-translate-y-0.5 hover:border-opacity-80
        transition-all duration-300 cursor-pointer group
      `}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-[76px] h-[76px] group-hover:scale-[1.03] transition-transform duration-300">
        <div className={`w-full h-full rounded-xl overflow-hidden ${THUMB_BG[type]} flex items-center justify-center`}>
          {annonce.photoUrl ? (
            <Image
              src={annonce.photoUrl}
              alt={annonce.type}
              width={76}
              height={76}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-3xl drop-shadow-sm">{emoji}</span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-foreground text-[15px] leading-snug">
                {label}
                {type === 'animal' && (annonce as AnnonceAnimal).race
                  ? <span className="text-muted-fg font-normal"> · {(annonce as AnnonceAnimal).race}</span>
                  : null}
              </span>
              {nouveau && (
                <span className="flex items-center gap-0.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap flex-shrink-0">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse-soft" />
                  Nouveau
                </span>
              )}
            </div>

            {type === 'produit' && (
              <div className="text-xs text-muted-fg mt-0.5 font-medium">
                {(annonce as AnnonceProduit).quantiteKg.toLocaleString('fr')} kg dispo
              </div>
            )}
            {type === 'materiel' && (
              <div className="text-xs text-muted-fg mt-0.5 font-medium">
                Caution {(annonce as AnnonceMateriel).caution.toLocaleString('fr')} F
              </div>
            )}
            {type === 'animal' && (annonce as AnnonceAnimal).poidsKg && (
              <div className="text-xs text-muted-fg mt-0.5 font-medium">
                {(annonce as AnnonceAnimal).poidsKg} kg
                {(annonce as AnnonceAnimal).age ? ` · ${(annonce as AnnonceAnimal).age} mois` : ''}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 ml-1">
            {type === 'produit' && <PrixBadge prixKg={(annonce as AnnonceProduit).prixFcfa} />}
            {type === 'materiel' && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs px-2.5 py-1 rounded-full">
                {(annonce as AnnonceMateriel).prixJour.toLocaleString('fr')}<span className="font-normal opacity-70"> F/j</span>
              </span>
            )}
            {type === 'animal' && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs px-2.5 py-1 rounded-full">
                {(annonce as AnnonceAnimal).prixFcfa.toLocaleString('fr')}<span className="font-normal opacity-70"> F</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-fg/80 font-medium">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="truncate">{annonce.commune}, {regionLabel}</span>
          {vendeur && (
            <>
              <span className="opacity-40 mx-0.5">·</span>
              <span className="truncate text-foreground-3 font-semibold">{vendeur}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </Link>
  );
}
