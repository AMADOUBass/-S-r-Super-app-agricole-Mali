// Routes des prix du marché
// GET  /prix           → prix du jour par produit et région
// GET  /prix/historique → historique des 30 derniers jours
// POST /prix           → mettre à jour prix (admin uniquement)

import { Router } from 'express';
import {
  getPrixDuJour,
  getHistoriquePrix,
  mettreAJourPrix,
} from '../controllers/prix.controller';
import { authentifier, autoriser } from '../middleware/auth.middleware';
import { valider } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const schemaPrix = z.object({
  produit: z.enum([
    'MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'SESAME',
    'COTON', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'GOMBO',
    'PATATE_DOUCE', 'IGNAME'
  ]),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
  prixKg: z.number().int().positive(),
  source: z.string().optional(),
});

router.get('/', getPrixDuJour);
router.get('/historique', getHistoriquePrix);
router.post('/', authentifier, autoriser('ADMIN'), valider(schemaPrix), mettreAJourPrix);

export default router;
