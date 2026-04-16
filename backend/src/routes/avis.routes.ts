import { Router } from 'express';
import { creerAvis, getAvisUtilisateur } from '../controllers/avis.controller';
import { authentifier } from '../middleware/auth.middleware';

const router = Router();

// Créer un avis (nécessite d'être connecté)
router.post('/', authentifier, creerAvis);

// Récupérer les avis d'un utilisateur (public)
router.get('/utilisateur/:id', getAvisUtilisateur);

export default router;
