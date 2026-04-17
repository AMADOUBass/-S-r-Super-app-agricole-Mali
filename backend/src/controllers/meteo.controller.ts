// Contrôleur météo — proxy vers Open-Meteo (API gratuite, sans clé)
// Traduit le nom de commune malienne en coordonnées GPS puis appelle Open-Meteo

import { Request, Response } from 'express';
import { getMeteoParCommune } from '../services/meteo.service';

// ─────────────────────────────────────────────────────────────
// GET /meteo/:commune
// ─────────────────────────────────────────────────────────────
export const getMeteo = async (req: Request, res: Response): Promise<void> => {
  try {
    const commune = decodeURIComponent(req.params.commune);
    const meteo = await getMeteoParCommune(commune);

    res.json({ success: true, data: meteo });
  } catch (err: any) {
    console.error(`[meteo] Erreur lors de la récupération pour ${req.params.commune}:`, err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Impossible de récupérer la météo',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
