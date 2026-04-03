// Routes admin — accès réservé au rôle ADMIN

import { Router } from 'express';
import { authentifier, autoriser } from '../middleware/auth.middleware';
import {
  getStats,
  listerAnnonces, supprimerAnnonce, toggleAnnonce,
  listerCommandes,
  listerUtilisateurs, toggleUtilisateur,
  listerMaterielAdmin, toggleMateriel, supprimerMateriel,
  listerAnimauxAdmin, supprimerAnimal,
} from '../controllers/admin.controller';

const router = Router();

// Toutes les routes admin nécessitent authentification + rôle ADMIN
router.use(authentifier, autoriser('ADMIN'));

router.get('/stats', getStats);

router.get('/annonces', listerAnnonces);
router.delete('/annonces/:id', supprimerAnnonce);
router.patch('/annonces/:id/toggle', toggleAnnonce);

router.get('/commandes', listerCommandes);

router.get('/utilisateurs', listerUtilisateurs);
router.patch('/utilisateurs/:id/toggle', toggleUtilisateur);

router.get('/materiel', listerMaterielAdmin);
router.patch('/materiel/:id/toggle', toggleMateriel);
router.delete('/materiel/:id', supprimerMateriel);

router.get('/animaux', listerAnimauxAdmin);
router.delete('/animaux/:id', supprimerAnimal);

export default router;
