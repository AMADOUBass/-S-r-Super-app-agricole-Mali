// Cron job — exécuté chaque matin à 7h00 (heure de Bamako)
// Envoie un SMS récapitulatif des prix du marché aux agriculteurs inscrits
// et met à jour les prix depuis une source externe (à brancher selon disponibilité)

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { envoyerSMSPrixMatin } from '../services/sms.service';


// Formater les prix pour un SMS lisible et court
const formaterPrixPourSms = (prix: Array<{ produit: string; prixKg: number }>): string => {
  const traductions: Record<string, string> = {
    MIL: 'Mil', SORGHO: 'Sorgho', MAIS: 'Maïs', RIZ: 'Riz',
    ARACHIDE: 'Arachide', NIEBE: 'Niébé', SESAME: 'Sésame',
    MANGUE: 'Mangue', OIGNON: 'Oignon', TOMATE: 'Tomate',
    KARITE: 'Karité', COTON: 'Coton',
  };

  return prix
    .slice(0, 5) // Limiter à 5 produits pour garder le SMS court
    .map(p => `${traductions[p.produit] || p.produit}: ${p.prixKg} F/kg`)
    .join('\n');
};

// ─────────────────────────────────────────────────────────────
// Tâche principale : envoi SMS prix du matin
// ─────────────────────────────────────────────────────────────
const envoyerPrixDuMatin = async (): Promise<void> => {
  console.log('[CRON] Début envoi SMS prix du matin...');

  try {
    // Récupérer les régions distinctes avec des agriculteurs actifs
    const agriculteurs = await prisma.utilisateur.findMany({
      where: { role: 'AGRICULTEUR', actif: true },
      select: { telephone: true, region: true },
    });

    // Grouper par région
    const parRegion = agriculteurs.reduce<Record<string, string[]>>((acc, user) => {
      if (!acc[user.region]) acc[user.region] = [];
      acc[user.region].push(user.telephone);
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pour chaque région, récupérer les prix et envoyer le SMS
    for (const [region, telephones] of Object.entries(parRegion)) {
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

    console.log('[CRON] Envoi SMS prix du matin terminé');
  } catch (err) {
    console.error('[CRON] Erreur envoi prix matin:', err);
  }
};

// ─────────────────────────────────────────────────────────────
// Démarrer le cron job
// ─────────────────────────────────────────────────────────────
export const demarrerCronPrix = (): void => {
  // Tous les jours à 7h00 (heure UTC = 7h00, Bamako = UTC+0 en hiver)
  cron.schedule('0 7 * * *', envoyerPrixDuMatin, {
    timezone: 'Africa/Bamako',
  });

  console.log('[CRON] Job prix matin planifié (7h00 Bamako)');
};
