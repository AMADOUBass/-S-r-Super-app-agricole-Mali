// Routes du matériel agricole (location)
// GET  /materiel          → liste matériel disponible
// GET  /materiel/:id      → détail
// POST /materiel          → publier matériel (auth)
// PUT  /materiel/:id      → modifier (auth + propriétaire)
// DELETE /materiel/:id    → supprimer
// POST /materiel/:id/louer → créer une location avec caution escrow

import { Router } from 'express';
import {
  listerMateriel,
  getMateriel,
  creerMateriel,
  modifierMateriel,
  supprimerMateriel,
  louerMateriel,
} from '../controllers/materiel.controller';
import { authentifier } from '../middleware/auth.middleware';
import { valider } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const schemaMateriel = z.object({
  type: z.enum([
    'TRACTEUR', 'MOTOPOMPE', 'BATTEUSE', 'CHARRUE',
    'SEMOIR', 'SILO', 'REMORQUE', 'PULVERISATEUR', 'MOISSONNEUSE'
  ]),
  description: z.string().max(500).optional(),
  prixJour: z.number().int().positive(),
  caution: z.number().int().positive(),
  commune: z.string().min(2),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
});

const schemaLocation = z.object({
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
});

router.get('/', listerMateriel);
router.get('/:id', getMateriel);
router.post('/', authentifier, valider(schemaMateriel), creerMateriel);
router.put('/:id', authentifier, valider(schemaMateriel.partial()), modifierMateriel);
router.delete('/:id', authentifier, supprimerMateriel);
router.post('/:id/louer', authentifier, valider(schemaLocation), louerMateriel);

export default router;
