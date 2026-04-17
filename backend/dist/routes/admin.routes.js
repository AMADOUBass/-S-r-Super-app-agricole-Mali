"use strict";
// Routes admin — accès réservé au rôle ADMIN
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Toutes les routes admin nécessitent authentification + rôle ADMIN
router.use(auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('ADMIN'));
router.get('/stats', admin_controller_1.getStats);
router.get('/annonces', admin_controller_1.listerAnnonces);
router.delete('/annonces/:id', admin_controller_1.supprimerAnnonce);
router.patch('/annonces/:id/toggle', admin_controller_1.toggleAnnonce);
router.get('/commandes', admin_controller_1.listerCommandes);
router.get('/utilisateurs', admin_controller_1.listerUtilisateurs);
router.patch('/utilisateurs/:id/toggle', admin_controller_1.toggleUtilisateur);
router.get('/materiel', admin_controller_1.listerMaterielAdmin);
router.patch('/materiel/:id/toggle', admin_controller_1.toggleMateriel);
router.delete('/materiel/:id', admin_controller_1.supprimerMateriel);
router.get('/animaux', admin_controller_1.listerAnimauxAdmin);
router.delete('/animaux/:id', admin_controller_1.supprimerAnimal);
router.get('/retraits', admin_controller_1.listerRetraits);
router.patch('/retraits/:id', admin_controller_1.traiterRetrait);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map