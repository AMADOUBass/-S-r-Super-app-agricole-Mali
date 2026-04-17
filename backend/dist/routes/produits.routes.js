"use strict";
// Routes des produits (récoltes agricoles)
// GET    /produits        → liste avec filtres
// GET    /produits/:id    → détail
// POST   /produits        → publier récolte (auth agriculteur)
// PUT    /produits/:id    → modifier (auth + propriétaire)
// DELETE /produits/:id    → supprimer (auth + propriétaire)
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const produits_controller_1 = require("../controllers/produits.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const cloudinary_service_1 = require("../services/cloudinary.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const schemaProduit = zod_1.z.object({
    type: zod_1.z.enum([
        'MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'SESAME',
        'COTON', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'GOMBO',
        'PATATE_DOUCE', 'IGNAME'
    ]),
    quantiteKg: zod_1.z.coerce.number().positive(), // coerce : accepte string depuis FormData
    prixFcfa: zod_1.z.coerce.number().int().positive(),
    description: zod_1.z.string().max(500).optional(),
    commune: zod_1.z.string().min(2),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
});
router.get('/', produits_controller_1.listerProduits);
router.get('/mes-annonces', auth_middleware_1.authentifier, produits_controller_1.getMesAnnonces); // avant /:id
router.get('/:id', produits_controller_1.getProduit);
router.post('/', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR'), cloudinary_service_1.uploadPhoto, (0, validate_middleware_1.valider)(schemaProduit), produits_controller_1.creerProduit);
router.put('/:id', auth_middleware_1.authentifier, (0, auth_middleware_1.autoriser)('AGRICULTEUR'), (0, validate_middleware_1.valider)(schemaProduit.partial()), produits_controller_1.modifierProduit);
router.delete('/:id', auth_middleware_1.authentifier, produits_controller_1.supprimerProduit);
exports.default = router;
//# sourceMappingURL=produits.routes.js.map