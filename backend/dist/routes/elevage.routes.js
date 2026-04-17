"use strict";
// Routes de l'élevage (achat/vente d'animaux)
// GET  /elevage       → liste animaux à vendre
// GET  /elevage/:id   → détail
// POST /elevage       → publier annonce animal (auth)
// PUT  /elevage/:id   → modifier (auth + propriétaire)
// DELETE /elevage/:id → supprimer
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const elevage_controller_1 = require("../controllers/elevage.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const schemaAnimal = zod_1.z.object({
    type: zod_1.z.enum(['BOEUF', 'MOUTON', 'CHEVRE', 'VOLAILLE', 'PORC', 'ANE', 'CHEVAL', 'CHAMEAU']),
    race: zod_1.z.string().max(100).optional(),
    age: zod_1.z.number().int().positive().optional(), // en mois
    poidsKg: zod_1.z.number().positive().optional(),
    prixFcfa: zod_1.z.number().int().positive(),
    description: zod_1.z.string().max(500).optional(),
    commune: zod_1.z.string().min(2),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
});
router.get('/', elevage_controller_1.listerAnimaux);
router.get('/:id', elevage_controller_1.getAnimal);
router.post('/', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR', 'ELEVEUR'), (0, validate_middleware_1.valider)(schemaAnimal), elevage_controller_1.creerAnimal);
router.put('/:id', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR', 'ELEVEUR'), (0, validate_middleware_1.valider)(schemaAnimal.partial()), elevage_controller_1.modifierAnimal);
router.delete('/:id', auth_middleware_1.authentifier, elevage_controller_1.supprimerAnimal);
exports.default = router;
//# sourceMappingURL=elevage.routes.js.map