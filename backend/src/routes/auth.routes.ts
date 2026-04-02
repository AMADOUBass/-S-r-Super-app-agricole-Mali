// Routes d'authentification
// POST /auth/register → inscription par numéro de téléphone + envoi OTP SMS
// POST /auth/verify   → vérification OTP → retourne token JWT

import { Router } from 'express';
import { inscrire, verifierOtp, renvoyerOtp } from '../controllers/auth.controller';
import { valider } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const schemaInscription = z.object({
  telephone: z.string().regex(/^\+223\d{8}$/, 'Numéro malien requis (+223XXXXXXXX)'),
  nom: z.string().min(2).max(100),
  role: z.enum(['AGRICULTEUR', 'ACHETEUR', 'BOUTIQUE']).default('AGRICULTEUR'),
  commune: z.string().min(2).max(100),
  region: z.enum([
    'BAMAKO', 'KAYES', 'KOULIKORO', 'SIKASSO',
    'SEGOU', 'MOPTI', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
  ]),
});

const schemaVerification = z.object({
  telephone: z.string().regex(/^\+223\d{8}$/),
  code: z.string().length(6),
});

// POST /auth/register
router.post('/register', valider(schemaInscription), inscrire);

// POST /auth/verify
router.post('/verify', valider(schemaVerification), verifierOtp);

// POST /auth/resend — renvoie un OTP (limite de débit à implémenter)
router.post('/resend', valider(z.object({ telephone: z.string() })), renvoyerOtp);

export default router;
