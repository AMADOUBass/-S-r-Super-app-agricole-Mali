"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Routes des commandes
// POST /commandes                      → créer une commande
// GET  /commandes/mes-commandes        → mes commandes (acheteur ou vendeur)
// POST /commandes/:id/payer            → initier paiement escrow Flutterwave
// POST /commandes/:id/confirmer        → confirmer livraison et débloquer le paiement
// POST /commandes/:id/annuler          → annuler
// POST /commandes/webhooks/flutterwave → webhook de notification Flutterwave
const express_1 = require("express");
const commandes_controller_1 = require("../controllers/commandes.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const schemaCommande = zod_1.z.object({
    produitId: zod_1.z.string().cuid(),
    quantiteKg: zod_1.z.number().positive(),
});
// Webhook Flutterwave — pas d'auth JWT (appel serveur→serveur)
// Doit être AVANT /:id pour éviter le conflit de route
router.post("/webhooks/flutterwave", commandes_controller_1.webhookFlutterwave);
router.post("/", auth_middleware_1.authentifier, (0, validate_middleware_1.valider)(schemaCommande), commandes_controller_1.creerCommande);
router.get("/mes-commandes", auth_middleware_1.authentifier, commandes_controller_1.getMesCommandes);
router.get("/:id/statut", auth_middleware_1.authentifier, commandes_controller_1.getStatutCommande);
router.post("/:id/payer", auth_middleware_1.authentifier, commandes_controller_1.payerCommande);
router.post("/:id/preparer", auth_middleware_1.authentifier, commandes_controller_1.preparerCommande);
router.post("/:id/confirmer", auth_middleware_1.authentifier, commandes_controller_1.confirmerLivraison);
router.post("/:id/annuler", auth_middleware_1.authentifier, commandes_controller_1.annulerCommande);
exports.default = router;
//# sourceMappingURL=commandes.routes.js.map