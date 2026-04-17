// Routes d'authentification
// POST /auth/register → inscription par numéro de téléphone + envoi OTP SMS
// POST /auth/verify   → vérification OTP → retourne token JWT

import { Router } from 'express';
import {
  inscrire,
  verifierOtp,
  renvoyerOtp,
  modifierProfil,
  connexionAdmin,
  inscrireEmail,
  connexionEmail
} from '../controllers/auth.controller';
import { valider } from '../middleware/validate.middleware';
import { authentifier } from '../middleware/auth.middleware';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Limiteur de requêtes spécifique aux OTP (ex: max 5 requêtes par 15 minutes)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Plus souple pour le développement et les tests (20 par 15min)
  message: { success: false, error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
  standardHeaders: true, // Retourne l'info de rate limit dans les headers
  legacyHeaders: false,
});

const schemaInscription = z.object({
  telephone: z.string().regex(/^\+\d{6,15}$/, 'Format international requis (+...)'),
  nom: z.string().min(2).max(100),
  role: z.enum(['AGRICULTEUR', 'ACHETEUR', 'BOUTIQUE']).default('AGRICULTEUR'),
  commune: z.string().min(2).max(100),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
});

const schemaVerification = z.object({
  telephone: z.string().regex(/^\+\d{6,15}$/),
  code: z.string().length(6),
});

const schemaEmailInscription = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8),
  nom: z.string().min(2).max(100),
  role: z.enum(['AGRICULTEUR', 'ACHETEUR', 'BOUTIQUE']).optional(),
  commune: z.string().min(2).max(100),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
  telephone: z.string().regex(/^\+\d{6,15}$/).optional(),
});

// POST /auth/register
router.post('/register', otpLimiter, valider(schemaInscription), inscrire);

// POST /auth/verify
router.post('/verify', otpLimiter, valider(schemaVerification), verifierOtp);

// POST /auth/resend — renvoie un OTP (limite de débit à implémenter)
router.post('/resend', otpLimiter, valider(z.object({ telephone: z.string() })), renvoyerOtp);

// POST /auth/admin-login — connexion admin par email + mot de passe
router.post('/admin-login', valider(z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8),
})), connexionAdmin);

// POST /auth/register-email
router.post('/register-email', valider(schemaEmailInscription), inscrireEmail);

// POST /auth/login-email
router.post('/login-email', valider(z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8),
})), connexionEmail);

// PUT /auth/profil — modifier nom, commune, région
router.put('/profil', authentifier, valider(z.object({
  nom: z.string().min(2).max(100),
  commune: z.string().min(2).max(100),
  region: z.enum(['BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO', 'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT']),
})), modifierProfil);

export default router;
