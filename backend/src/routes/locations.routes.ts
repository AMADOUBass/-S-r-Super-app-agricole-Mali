import { Router } from 'express';
import {
  getStatutLocation,
  payerLocation,
  confirmerRemiseMateriel,
  confirmerRetourLocation,
  annulerLocation,
} from '../controllers/materiel.controller';
import { authentifier } from '../middleware/auth.middleware';

const router = Router();

router.get('/:id/statut', authentifier, getStatutLocation);
router.post('/:id/payer', authentifier, payerLocation);
router.post('/:id/confirmer-remise', authentifier, confirmerRemiseMateriel);
router.post('/:id/confirmer-retour', authentifier, confirmerRetourLocation);
router.post('/:id/annuler', authentifier, annulerLocation);

export default router;
