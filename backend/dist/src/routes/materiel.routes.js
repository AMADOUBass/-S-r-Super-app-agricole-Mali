"use strict";
// Routes du matériel agricole (location)
// GET  /materiel          → liste matériel disponible
// GET  /materiel/:id      → détail
// POST /materiel          → publier matériel (auth)
// PUT  /materiel/:id      → modifier (auth + propriétaire)
// DELETE /materiel/:id    → supprimer
// POST /materiel/:id/louer → créer une location avec caution escrow
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const materiel_controller_1 = require("../controllers/materiel.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const schemaMateriel = zod_1.z.object({
    type: zod_1.z.enum([
        'TRACTEUR', 'MOTOPOMPE', 'BATTEUSE', 'CHARRUE',
        'SEMOIR', 'SILO', 'REMORQUE', 'PULVERISATEUR', 'MOISSONNEUSE'
    ]),
    description: zod_1.z.string().max(500).optional(),
    prixJour: zod_1.z.number().int().positive(),
    caution: zod_1.z.number().int().positive(),
    commune: zod_1.z.string().min(2),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
});
const schemaLocation = zod_1.z.object({
    dateDebut: zod_1.z.string().datetime(),
    dateFin: zod_1.z.string().datetime(),
});
router.get('/', materiel_controller_1.listerMateriel);
router.get('/:id', materiel_controller_1.getMateriel);
router.post('/', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR'), (0, validate_middleware_1.valider)(schemaMateriel), materiel_controller_1.creerMateriel);
router.put('/:id', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR'), (0, validate_middleware_1.valider)(schemaMateriel.partial()), materiel_controller_1.modifierMateriel);
router.delete('/:id', auth_middleware_1.authentifier, materiel_controller_1.supprimerMateriel);
router.post('/:id/louer', auth_middleware_1.authentifier, (0, validate_middleware_1.valider)(schemaLocation), materiel_controller_1.louerMateriel);
exports.default = router;
//# sourceMappingURL=materiel.routes.js.map