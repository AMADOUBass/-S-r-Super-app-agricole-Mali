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

export function CarteAnnonce({ annonce, type }: CarteAnnonceProps) {
  const href = `/${type === 'produit' ? 'produits' : type === 'materiel' ? 'materiel' : 'elevage'}/${annonce.id}`;
  const emoji = EMOJI[annonce.type] || '📦';
  const label = annonce.type.charAt(0) + annonce.type.slice(1).toLowerCase();
  const regionLabel = annonce.region.charAt(0) + annonce.region.slice(1).toLowerCase();

  const vendeur =
    type === 'produit' ? (annonce as AnnonceProduit).agriculteur?.nom
    : type === 'materiel' ? (annonce as AnnonceMateriel).proprietaire?.nom
    : (annonce as AnnonceAnimal).vendeur?.nom;

  return (
    <Link href={href} className="card-hover flex gap-4 p-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-surface-3 flex items-center justify-center">
        {annonce.photoUrl ? (
          <Image src={annonce.photoUrl} alt={annonce.type} width={72} height={72} className="object-cover w-full h-full" />
        ) : (
          <span className="text-3xl">{emoji}</span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-foreground text-base">
              {label}
              {type === 'animal' && (annonce as AnnonceAnimal).race
                ? <span className="text-muted-fg font-normal"> · {(annonce as AnnonceAnimal).race}</span>
                : null}
            </div>

            {type === 'produit' && (
              <div className="text-sm text-muted-fg mt-0.5">
                {(annonce as AnnonceProduit).quantiteKg.toLocaleString('fr')} kg disponibles
              </div>
            )}
            {type === 'materiel' && (
              <div className="text-sm text-muted-fg mt-0.5">
                Caution : {(annonce as AnnonceMateriel).caution.toLocaleString('fr')} FCFA
              </div>
            )}
            {type === 'animal' && (annonce as AnnonceAnimal).poidsKg && (
              <div className="text-sm text-muted-fg mt-0.5">
                {(annonce as AnnonceAnimal).poidsKg} kg
                {(annonce as AnnonceAnimal).age ? ` · ${(annonce as AnnonceAnimal).age} mois` : ''}
              </div>
            )}
          </div>

          {type === 'produit' && <PrixBadge prixKg={(annonce as AnnonceProduit).prixFcfa} />}
          {type === 'materiel' && (
            <span className="badge badge-amber">
              {(annonce as AnnonceMateriel).prixJour.toLocaleString('fr')} F/j
            </span>
          )}
          {type === 'animal' && (
            <span className="badge bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-xs px-2.5 py-1 rounded-full">
              {(annonce as AnnonceAnimal).prixFcfa.toLocaleString('fr')} F
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{annonce.commune}, {regionLabel}</span>
          {vendeur && <><span>·</span><span>{vendeur}</span></>}
        </div>
      </div>
    </Link>
  );
}
