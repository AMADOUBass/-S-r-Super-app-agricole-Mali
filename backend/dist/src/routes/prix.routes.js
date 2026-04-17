"use strict";
// Routes des prix du marché
// GET  /prix           → prix du jour par produit et région
// GET  /prix/historique → historique des 30 derniers jours
// POST /prix           → mettre à jour prix (admin uniquement)
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prix_controller_1 = require("../controllers/prix.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const schemaPrix = zod_1.z.object({
    produit: zod_1.z.enum([
        'MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'SESAME',
        'COTON', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'GOMBO',
        'PATATE_DOUCE', 'IGNAME'
    ]),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
    prixKg: zod_1.z.number().int().positive(),
    source: zod_1.z.string().optional(),
});
router.get('/', prix_controller_1.getPrixDuJour);
router.get('/historique', prix_controller_1.getHistoriquePrix);
router.post('/', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('ADMIN'), (0, validate_middleware_1.valider)(schemaPrix), prix_controller_1.mettreAJourPrix);
exports.default = router;
//# sourceMappingURL=prix.routes.js.map