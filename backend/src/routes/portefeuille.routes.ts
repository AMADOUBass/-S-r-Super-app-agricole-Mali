import { Router } from 'express';
import { authentifier } from '../middleware/auth.middleware';
import { getPortefeuille, demanderRetrait } from '../controllers/portefeuille.controller';

const router = Router();

// Toutes les routes de portefeuille nécessitent une authentification
router.use(authentifier);

router.get('/', getPortefeuille);
router.post('/retrait', demanderRetrait);

export default router;
