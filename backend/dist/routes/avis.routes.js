"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const avis_controller_1 = require("../controllers/avis.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Créer un avis (nécessite d'être connecté)
router.post('/', auth_middleware_1.authentifier, avis_controller_1.creerAvis);
// Récupérer les avis d'un utilisateur (public)
router.get('/utilisateur/:id', avis_controller_1.getAvisUtilisateur);
exports.default = router;
//# sourceMappingURL=avis.routes.js.map