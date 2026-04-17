"use strict";
// Routes d'authentification
// POST /auth/register → inscription par numéro de téléphone + envoi OTP SMS
// POST /auth/verify   → vérification OTP → retourne token JWT
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Limiteur de requêtes spécifique aux OTP (ex: max 5 requêtes par 15 minutes)
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Plus souple pour le développement et les tests (20 par 15min)
    message: { success: false, error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
    standardHeaders: true, // Retourne l'info de rate limit dans les headers
    legacyHeaders: false,
});
const schemaInscription = zod_1.z.object({
    telephone: zod_1.z.string().regex(/^\+\d{6,15}$/, 'Format international requis (+...)'),
    nom: zod_1.z.string().min(2).max(100),
    role: zod_1.z.enum(['AGRICULTEUR', 'ACHETEUR', 'BOUTIQUE']).default('AGRICULTEUR'),
    commune: zod_1.z.string().min(2).max(100),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
});
const schemaVerification = zod_1.z.object({
    telephone: zod_1.z.string().regex(/^\+\d{6,15}$/),
    code: zod_1.z.string().length(6),
});
const schemaEmailInscription = zod_1.z.object({
    email: zod_1.z.string().email(),
    motDePasse: zod_1.z.string().min(8),
    nom: zod_1.z.string().min(2).max(100),
    role: zod_1.z.enum(['AGRICULTEUR', 'ACHETEUR', 'BOUTIQUE']).optional(),
    commune: zod_1.z.string().min(2).max(100),
    region: zod_1.z.enum([
        'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
        'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ]),
    telephone: zod_1.z.string().regex(/^\+\d{6,15}$/).optional(),
});
// POST /auth/register
router.post('/register', otpLimiter, (0, validate_middleware_1.valider)(schemaInscription), auth_controller_1.inscrire);
// POST /auth/verify
router.post('/verify', otpLimiter, (0, validate_middleware_1.valider)(schemaVerification), auth_controller_1.verifierOtp);
// POST /auth/resend — renvoie un OTP (limite de débit à implémenter)
router.post('/resend', otpLimiter, (0, validate_middleware_1.valider)(zod_1.z.object({ telephone: zod_1.z.string() })), auth_controller_1.renvoyerOtp);
// POST /auth/admin-login — connexion admin par email + mot de passe
router.post('/admin-login', (0, validate_middleware_1.valider)(zod_1.z.object({
    email: zod_1.z.string().email(),
    motDePasse: zod_1.z.string().min(8),
})), auth_controller_1.connexionAdmin);
// POST /auth/register-email
router.post('/register-email', (0, validate_middleware_1.valider)(schemaEmailInscription), auth_controller_1.inscrireEmail);
// POST /auth/login-email
router.post('/login-email', (0, validate_middleware_1.valider)(zod_1.z.object({
    email: zod_1.z.string().email(),
    motDePasse: zod_1.z.string().min(8),
})), auth_controller_1.connexionEmail);
// PUT /auth/profil — modifier nom, commune, région
router.put('/profil', auth_middleware_1.authentifier, (0, validate_middleware_1.valider)(zod_1.z.object({
    nom: zod_1.z.string().min(2).max(100),
    commune: zod_1.z.string().min(2).max(100),
    region: zod_1.z.enum(['BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO', 'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT']),
})), auth_controller_1.modifierProfil);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map