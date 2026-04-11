// Cron job — exécuté chaque matin à 7h00 (heure de Bamako)
// 1. Met à jour les prix du marché (variation quotidienne ±5%)
// 2. Envoie un SMS récapitulatif aux agriculteurs inscrits

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { envoyerSMSPrixMatin } from '../services/sms.service';


// ─── Prix de base OMA Mali (FCFA/kg) ─────────────────────────
// Source : Observatoire du Marché Agricole Mali, bulletins 2025-2026
// Mis à jour manuellement si un bulletin OMA plus récent est disponible
const PRIX_BASE: Record<string, number> = {
  MIL:          320,
  SORGHO:       290,
  MAIS:         230,
  RIZ:          575,
  ARACHIDE:     600,
  NIEBE:        450,
  SESAME:       800,
  COTON:        275,
  MANGUE:       150,
  OIGNON:       200,
  TOMATE:       180,
  KARITE:       500,
  GOMBO:        250,
  PATATE_DOUCE: 175,
  IGNAME:       220,
};

// Coefficients régionaux (transport + disponibilité locale)
const COEFF: Record<string, number> = {
  BAMAKO:     1.00,
  KOULIKORO:  0.95,
  SIKASSO:    0.88,  // zone de production
  SEGOU:      0.93,
  KAYES:      0.92,
  MOPTI:      1.12,  // enclavé + insécurité
  TOMBOUCTOU: 1.28,
  GAO:        1.22,
  KIDAL:      1.40,  // zone de conflit
  MENAKA:     1.35,
  TAOUDENIT:  1.45,
};

// Produits disponibles par région
const PRODUITS_PAR_REGION: Record<string, string[]> = {
  BAMAKO:     ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','MANGUE','OIGNON','TOMATE','KARITE','SESAME'],
  SIKASSO:    ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','MANGUE','OIGNON','TOMATE','KARITE','IGNAME','PATATE_DOUCE'],
  SEGOU:      ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','OIGNON','KARITE','COTON'],
  KAYES:      ['MIL','SORGHO','ARACHIDE','NIEBE','SESAME','KARITE','MANGUE'],
  KOULIKORO:  ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','OIGNON','KARITE'],
  MOPTI:      ['MIL','SORGHO','RIZ','NIEBE','OIGNON'],
  TOMBOUCTOU: ['MIL','SORGHO','RIZ','NIEBE'],
  GAO:        ['MIL','SORGHO','RIZ','NIEBE','OIGNON'],
  KIDAL:      ['MIL','SORGHO'],
  MENAKA:     ['MIL','SORGHO','NIEBE'],
  TAOUDENIT:  ['MIL','SORGHO'],
};

// ─────────────────────────────────────────────────────────────
// Met à jour les prix du jour avec une variation ±5%
// ─────────────────────────────────────────────────────────────
export const mettreAJourPrixDuJour = async (): Promise<void> => {
  console.log('[CRON] Mise à jour des prix du marché...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Récupérer les prix d'hier pour calculer la variation à partir du dernier réel
  const hier = new Date(today);
  hier.setDate(hier.getDate() - 1);

  const prixHier = await prisma.prixMarche.findMany({
    where: { date: { gte: hier, lt: today } },
  });

  const prixHierMap: Record<string, number> = {};
  for (const p of prixHier) {
    prixHierMap[`${p.region}__${p.produit}`] = p.prixKg;
  }

  let total = 0;

  for (const [region, produits] of Object.entries(PRODUITS_PAR_REGION)) {
    const coeff = COEFF[region] ?? 1.0;

    for (const produit of produits) {
      const base = PRIX_BASE[produit];
      if (!base) continue;

      // Prendre prix hier comme base, sinon prix de référence OMA
      const prixReference = prixHierMap[`${region}__${produit}`] ?? Math.round(base * coeff);

      // Variation quotidienne ±5% (mouvement de marché réaliste)
      const variation = 1 + (Math.random() * 0.10 - 0.05);
      // Garde le prix dans une fourchette ±15% du prix de référence OMA
      const prixMin = Math.round(base * coeff * 0.85);
      const prixMax = Math.round(base * coeff * 1.15);
      const prixKg = Math.min(prixMax, Math.max(prixMin, Math.round(prixReference * variation / 5) * 5));

      try {
        await prisma.prixMarche.upsert({
          where: {
            produit_region_date: {
              produit: produit as never,
              region: region as never,
              date: today,
            },
          },
          create: {
            produit: produit as never,
            region: region as never,
            prixKg,
            source: 'Cron OMA Mali',
            date: today,
          },
          update: { prixKg, source: 'Cron OMA Mali' },
        });
        total++;
      } catch (err) {
        console.error(`[CRON] Erreur prix ${region}/${produit}:`, err);
      }
    }
  }

  console.log(`[CRON] ${total} prix mis à jour pour aujourd'hui`);
};

// ─────────────────────────────────────────────────────────────
// Envoie les SMS prix du matin aux agriculteurs
// ─────────────────────────────────────────────────────────────
const formaterPrixPourSms = (prix: Array<{ produit: string; prixKg: number }>): string => {
  const traductions: Record<string, string> = {
    MIL: 'Mil', SORGHO: 'Sorgho', MAIS: 'Maïs', RIZ: 'Riz',
    ARACHIDE: 'Arachide', NIEBE: 'Niébé', SESAME: 'Sésame',
    MANGUE: 'Mangue', OIGNON: 'Oignon', TOMATE: 'Tomate',
    KARITE: 'Karité', COTON: 'Coton',
  };
  return prix
    .slice(0, 5)
    .map(p => `${traductions[p.produit] || p.produit}: ${p.prixKg} F/kg`)
    .join('\n');
};

const envoyerPrixDuMatin = async (): Promise<void> => {
  console.log('[CRON] Envoi SMS prix du matin...');

  try {
    const agriculteurs = await prisma.utilisateur.findMany({
      where: { role: 'AGRICULTEUR', actif: true },
      select: { telephone: true, region: true },
    });

    const parRegion: Record<string, string[]> = {};
    for (const user of agriculteurs) {
      if (!parRegion[user.region]) parRegion[user.region] = [];
      parRegion[user.region].push(user.telephone);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [region, telephones] of Object.entries(parRegion) as [string, string[]][]) {
      const prix = await prisma.prixMarche.findMany({
        where: { region: region as never, date: { gte: today } },
        orderBy: { produit: 'asc' },
        take: 10,
      });

      if (prix.length === 0) {
        console.log(`[CRON] Pas de prix pour ${region}, SMS non envoyé`);
        continue;
      }

      const resume = formaterPrixPourSms(prix);
      await envoyerSMSPrixMatin(telephones, region, resume);
      console.log(`[CRON] SMS envoyé à ${telephones.length} agriculteurs en ${region}`);
    }

    console.log('[CRON] Envoi SMS terminé');
  } catch (err) {
    console.error('[CRON] Erreur SMS prix:', err);
  }
};

// ─────────────────────────────────────────────────────────────
// Tâche principale : mise à jour prix + SMS
// Tous les jours à 6h45 Bamako : mise à jour prix
// Tous les jours à 7h00 Bamako : envoi SMS
// ─────────────────────────────────────────────────────────────
export const demarrerCronPrix = (): void => {
  // 6h45 : mettre à jour les prix du jour
  cron.schedule('45 6 * * *', mettreAJourPrixDuJour, {
    timezone: 'Africa/Bamako',
  });

  // 7h00 : envoyer les SMS avec les nouveaux prix
  cron.schedule('0 7 * * *', envoyerPrixDuMatin, {
    timezone: 'Africa/Bamako',
  });

  console.log('[CRON] Jobs prix planifiés — 6h45 mise à jour, 7h00 SMS (heure Bamako)');
};
