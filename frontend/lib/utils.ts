// Fonctions utilitaires pour le frontend Sɔrɔ

// ─────────────────────────────────────────────────────────────
// FORMATAGE FCFA
// ─────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 * Ex: 250000 → "250 000 FCFA"
 */
export const formatFcfa = (montant: number): string => {
  return `${montant.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Formate un prix par kg
 * Ex: 250 → "250 FCFA/kg"
 */
export const formatPrixKg = (prix: number): string => {
  return `${prix.toLocaleString('fr-FR')} FCFA/kg`;
};

// ─────────────────────────────────────────────────────────────
// FORMATAGE DATES
// ─────────────────────────────────────────────────────────────

/**
 * Retourne une date relative lisible en français
 * Ex: "il y a 2 heures", "il y a 3 jours"
 */
export const dateRelative = (date: string | Date): string => {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (heures < 24) return `Il y a ${heures}h`;
  if (jours < 7) return `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  return new Date(date).toLocaleDateString('fr-FR');
};

// ─────────────────────────────────────────────────────────────
// NUMÉROS DE TÉLÉPHONE MALI
// ─────────────────────────────────────────────────────────────

/**
 * Valide un numéro de téléphone malien
 * Accepte : +22360000000, 22360000000, 60000000
 */
export const validerTelephoneMali = (telephone: string): boolean => {
  const clean = telephone.replace(/\s/g, '');
  return /^(\+223|223)?[0-9]{8}$/.test(clean);
};

/**
 * Normalise un numéro malien au format +223XXXXXXXX
 */
export const normaliserTelephone = (telephone: string): string => {
  const clean = telephone.replace(/\s/g, '');
  if (clean.startsWith('+223')) return clean;
  if (clean.startsWith('223')) return `+${clean}`;
  if (clean.length === 8) return `+223${clean}`;
  return clean;
};

// ─────────────────────────────────────────────────────────────
// CALCULS COMMISSIONS
// ─────────────────────────────────────────────────────────────

/** Calcule la commission acheteur (3%) */
export const calculerCommission = (montant: number): number =>
  Math.round(montant * 0.03);

/** Calcule le total TTC pour l'acheteur */
export const calculerTotalAcheteur = (montant: number): number =>
  montant + calculerCommission(montant);

// ─────────────────────────────────────────────────────────────
// TRADUCTIONS DES TYPES
// ─────────────────────────────────────────────────────────────

export const LABELS_PRODUITS: Record<string, string> = {
  MIL: '🌾 Mil', SORGHO: '🌾 Sorgho', MAIS: '🌽 Maïs', RIZ: '🍚 Riz',
  ARACHIDE: '🥜 Arachide', NIEBE: '🫘 Niébé', SESAME: '✨ Sésame',
  COTON: '☁️ Coton', MANGUE: '🥭 Mangue', OIGNON: '🧅 Oignon',
  TOMATE: '🍅 Tomate', KARITE: '🌿 Karité', GOMBO: '🟢 Gombo',
  PATATE_DOUCE: '🍠 Patate douce', IGNAME: '🥔 Igname',
};

export const LABELS_ANIMAUX: Record<string, string> = {
  BOEUF: '🐄 Bœuf', MOUTON: '🐑 Mouton', CHEVRE: '🐐 Chèvre',
  VOLAILLE: '🐓 Volaille', PORC: '🐷 Porc', ANE: '🫏 Âne',
  CHEVAL: '🐴 Cheval', CHAMEAU: '🐪 Chameau',
};

export const LABELS_MATERIEL: Record<string, string> = {
  TRACTEUR: '🚜 Tracteur', MOTOPOMPE: '💧 Motopompe', BATTEUSE: '⚙️ Batteuse',
  CHARRUE: '🔩 Charrue', SEMOIR: '🌱 Semoir', SILO: '🏗️ Silo',
  REMORQUE: '🪝 Remorque', PULVERISATEUR: '🌫️ Pulvérisateur',
  MOISSONNEUSE: '🌾 Moissonneuse',
};
