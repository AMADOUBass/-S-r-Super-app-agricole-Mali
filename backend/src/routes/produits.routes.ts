// Routes des produits (récoltes agricoles)
// GET    /produits        → liste avec filtres
// GET    /produits/:id    → détail
// POST   /produits        → publier récolte (auth agriculteur)
// PUT    /produits/:id    → modifier (auth + propriétaire)
// DELETE /produits/:id    → supprimer (auth + propriétaire)

import { Router } from 'express';
import {
  listerProduits,
  getProduit,
  getMesAnnonces,
  creerProduit,
  modifierProduit,
  supprimerProduit,
} from '../controllers/produits.controller';
import { authentifier } from '../middleware/auth.middleware';
import { valider } from '../middleware/validate.middleware';
import { uploadPhoto } from '../services/cloudinary.service';
import { z } from 'zod';

const router = Router();

const schemaProduit = z.object({
  type: z.enum([
    'MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'SESAME',
    'COTON', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'GOMBO',
    'PATATE_DOUCE', 'IGNAME'
  ]),
  quantiteKg: z.coerce.number().positive(),   // coerce : accepte string depuis FormData
  prixFcfa:   z.coerce.number().int().positive(),
  description: z.string().max(500).optional(),
  commune: z.string().min(2),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
});

router.get('/', listerProduits);
router.get('/mes-annonces', authentifier, getMesAnnonces); // avant /:id
router.get('/:id', getProduit);
router.post('/', authentifier, uploadPhoto, valider(schemaProduit), creerProduit);
router.put('/:id', authentifier, valider(schemaProduit.partial()), modifierProduit);
router.delete('/:id', authentifier, supprimerProduit);

export default router;
