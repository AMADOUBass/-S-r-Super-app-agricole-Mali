// Routes des commandes
// POST /commandes               → créer une commande
// GET  /commandes/mes-commandes → mes commandes (acheteur ou vendeur)
// POST /commandes/:id/payer     → initier paiement escrow CinetPay
// POST /commandes/:id/confirmer → confirmer livraison et débloquer le paiement
// POST /commandes/:id/annuler   → annuler et rembourser
// POST /webhooks/cinetpay       → webhook de notification CinetPay

import { Router } from 'express';
import {
  creerCommande,
  getMesCommandes,
  payerCommande,
  confirmerLivraison,
  annulerCommande,
  webhookCinetPay,
} from '../controllers/commandes.controller';
import { authentifier } from '../middleware/auth.middleware';
import { valider } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const schemaCommande = z.object({
  produitId: z.string().cuid(),
  quantiteKg: z.number().positive(),
});

router.post('/', authentifier, valider(schemaCommande), creerCommande);
router.get('/mes-commandes', authentifier, getMesCommandes);
router.post('/:id/payer', authentifier, payerCommande);
router.post('/:id/confirmer', authentifier, confirmerLivraison);
router.post('/:id/annuler', authentifier, annulerCommande);

// Webhook CinetPay — pas d'auth JWT (appel serveur→serveur)
router.post('/webhooks/cinetpay', webhookCinetPay);

export default router;
