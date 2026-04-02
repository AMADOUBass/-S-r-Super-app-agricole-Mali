// Routes de l'élevage (achat/vente d'animaux)
// GET  /elevage       → liste animaux à vendre
// GET  /elevage/:id   → détail
// POST /elevage       → publier annonce animal (auth)
// PUT  /elevage/:id   → modifier (auth + propriétaire)
// DELETE /elevage/:id → supprimer

import { Router } from 'express';
import {
  listerAnimaux,
  getAnimal,
  creerAnimal,
  modifierAnimal,
  supprimerAnimal,
} from '../controllers/elevage.controller';
import { authentifier, autoriser } from '../middleware/auth.middleware';
import { valider } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const schemaAnimal = z.object({
  type: z.enum(['BOEUF', 'MOUTON', 'CHEVRE', 'VOLAILLE', 'PORC', 'ANE', 'CHEVAL', 'CHAMEAU']),
  race: z.string().max(100).optional(),
  age: z.number().int().positive().optional(),       // en mois
  poidsKg: z.number().positive().optional(),
  prixFcfa: z.number().int().positive(),
  description: z.string().max(500).optional(),
  commune: z.string().min(2),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
});

router.get('/', listerAnimaux);
router.get('/:id', getAnimal);
router.post('/', authentifier, autoriser('AGRICULTEUR', 'ELEVEUR'), valider(schemaAnimal), creerAnimal);
router.put('/:id', authentifier, autoriser('AGRICULTEUR', 'ELEVEUR'), valider(schemaAnimal.partial()), modifierAnimal);
router.delete('/:id', authentifier, supprimerAnimal);

export default router;
