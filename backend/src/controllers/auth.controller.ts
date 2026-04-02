// Contrôleur d'authentification
// Gère l'inscription par téléphone, la vérification OTP et la délivrance de tokens JWT

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { envoyerSms } from '../services/sms.service';


// Génère un code OTP à 6 chiffres
const genererOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────
export const inscrire = async (req: Request, res: Response): Promise<void> => {
  try {
    const { telephone, nom, role, commune, region } = req.body;

    // Créer ou mettre à jour l'utilisateur (upsert)
    await prisma.utilisateur.upsert({
      where: { telephone },
      create: { telephone, nom, role, commune, region },
      update: { nom, commune, region },
    });

    // Invalider les anciens OTP pour ce numéro
    await prisma.otp.updateMany({
      where: { telephone, utilise: false },
      data: { utilise: true },
    });

    // Créer nouvel OTP valable 10 minutes
    const code = genererOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otp.create({ data: { telephone, code, expiresAt } });

    // Envoyer l'OTP par SMS
    await envoyerSms({
      to: telephone,
      message: `Sɔrɔ: Votre code de vérification est ${code}. Valable 10 minutes.`,
    });

    res.status(201).json({
      success: true,
      message: 'Code OTP envoyé par SMS',
      // En développement uniquement — retirer en production
      ...(process.env.NODE_ENV === 'development' && { _devOtp: code }),
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'inscription' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /auth/verify
// ─────────────────────────────────────────────────────────────
export const verifierOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { telephone, code } = req.body;

    // Chercher l'OTP valide
    const otp = await prisma.otp.findFirst({
      where: {
        telephone,
        code,
        utilise: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      res.status(400).json({ success: false, error: 'Code incorrect ou expiré' });
      return;
    }

    // Marquer l'OTP comme utilisé
    await prisma.otp.update({ where: { id: otp.id }, data: { utilise: true } });

    // Récupérer l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({ where: { telephone } });
    if (!utilisateur) {
      res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
      return;
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: utilisateur.id, telephone: utilisateur.telephone, role: utilisateur.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as never }
    );

    res.json({
      success: true,
      data: {
        token,
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          telephone: utilisateur.telephone,
          role: utilisateur.role,
          region: utilisateur.region,
          commune: utilisateur.commune,
        },
      },
    });
  } catch (err) {
    console.error('[auth/verify]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /auth/resend
// ─────────────────────────────────────────────────────────────
export const renvoyerOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { telephone } = req.body;

    const utilisateur = await prisma.utilisateur.findUnique({ where: { telephone } });
    if (!utilisateur) {
      res.status(404).json({ success: false, error: 'Numéro non enregistré' });
      return;
    }

    // Invalider les anciens OTP
    await prisma.otp.updateMany({
      where: { telephone, utilise: false },
      data: { utilise: true },
    });

    const code = genererOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otp.create({ data: { telephone, code, expiresAt } });

    await envoyerSms({
      to: telephone,
      message: `Sɔrɔ: Nouveau code: ${code}. Valable 10 minutes.`,
    });

    res.json({ success: true, message: 'Nouveau code envoyé' });
  } catch (err) {
    console.error('[auth/resend]', err);
    res.status(500).json({ success: false, error: 'Erreur lors du renvoi' });
  }
};
