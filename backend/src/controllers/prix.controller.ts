// Contrôleur des prix du marché
// Retourne les prix du jour et l'historique par produit et région

import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// ─────────────────────────────────────────────────────────────
// GET /prix — prix du jour
// ─────────────────────────────────────────────────────────────
export const getPrixDuJour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produit, region } = req.query;

    const debutJournee = new Date();
    debutJournee.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = { date: { gte: debutJournee } };
    if (produit) where.produit = produit;
    if (region) where.region = region;

    // Si pas de données du jour, prendre les 7 derniers jours
    let prix = await prisma.prixMarche.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    if (prix.length === 0) {
      const semaineDerniere = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      prix = await prisma.prixMarche.findMany({
        where: { ...where, date: { gte: semaineDerniere } },
        orderBy: { date: 'desc' },
        take: 100,
      });
    }

    res.json({ success: true, data: prix });
  } catch (err) {
    console.error('[prix/jour]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des prix' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /prix/historique — 30 derniers jours
// ─────────────────────────────────────────────────────────────
export const getHistoriquePrix = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produit, region } = req.query;

    if (!produit || !region) {
      res.status(400).json({ success: false, error: 'Paramètres produit et region requis' });
      return;
    }

    const il_y_a_30_jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const historique = await prisma.prixMarche.findMany({
      where: {
        produit: produit as string,
        region: region as string,
        date: { gte: il_y_a_30_jours },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: historique });
  } catch (err) {
    console.error('[prix/historique]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /prix — mise à jour manuelle (admin ou cron)
// ─────────────────────────────────────────────────────────────
export const mettreAJourPrix = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produit, region, prixKg, source } = req.body;

    const prix = await prisma.prixMarche.upsert({
      where: {
        produit_region_date: {
          produit,
          region,
          date: new Date(new Date().toDateString()), // date du jour sans l'heure
        },
      },
      create: { produit, region, prixKg, source },
      update: { prixKg, source },
    });

    res.json({ success: true, data: prix });
  } catch (err) {
    console.error('[prix/maj]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
  }
};
