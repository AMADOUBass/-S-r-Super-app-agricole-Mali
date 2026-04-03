// Routes des commandes
// POST /commandes                      → créer une commande
// GET  /commandes/mes-commandes        → mes commandes (acheteur ou vendeur)
// POST /commandes/:id/payer            → initier paiement escrow Flutterwave
// POST /commandes/:id/confirmer        → confirmer livraison et débloquer le paiement
// POST /commandes/:id/annuler          → annuler
// POST /commandes/webhooks/flutterwave → webhook de notification Flutterwave
import { Router } from "express";
import {
  creerCommande,
  getMesCommandes,
  getStatutCommande,
  payerCommande,
  confirmerLivraison,
  annulerCommande,
  webhookFlutterwave,
} from "../controllers/commandes.controller";
import { authentifier } from "../middleware/auth.middleware";
import { valider } from "../middleware/validate.middleware";
import { z } from "zod";

const router = Router();

const schemaCommande = z.object({
  produitId: z.string().cuid(),
  quantiteKg: z.number().positive(),
});

// Webhook Flutterwave — pas d'auth JWT (appel serveur→serveur)
// Doit être AVANT /:id pour éviter le conflit de route
router.post("/webhooks/flutterwave", webhookFlutterwave);

router.post("/", authentifier, valider(schemaCommande), creerCommande);
router.get("/mes-commandes", authentifier, getMesCommandes);
router.get("/:id/statut", authentifier, getStatutCommande);
router.post("/:id/payer", authentifier, payerCommande);
router.post("/:id/confirmer", authentifier, confirmerLivraison);
router.post("/:id/annuler", authentifier, annulerCommande);

export default router;
