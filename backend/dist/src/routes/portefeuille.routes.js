"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const portefeuille_controller_1 = require("../controllers/portefeuille.controller");
const router = (0, express_1.Router)();
// Toutes les routes de portefeuille nécessitent une authentification
router.use(auth_middleware_1.authentifier);
router.get('/', portefeuille_controller_1.getPortefeuille);
router.post('/retrait', portefeuille_controller_1.demanderRetrait);
exports.default = router;
//# sourceMappingURL=portefeuille.routes.js.map