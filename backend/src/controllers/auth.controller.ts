// Contrôleur d'authentification
// Gère l'inscription par téléphone, la vérification OTP et la délivrance de tokens JWT

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { envoyerSms } from '../services/sms.service';
import { AuthRequest } from '../types';
import { normaliserTelephone } from '../utils/auth.utils';


// Génère un code OTP à 6 chiffres
const genererOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────
export const inscrire = async (req: Request, res: Response): Promise<void> => {
  try {
    let { telephone, nom, role, commune, region } = req.body;

    // Normalisation du téléphone
    telephone = normaliserTelephone(telephone);

    // Créer ou récupérer l'utilisateur — ne jamais écraser les données existantes
    await prisma.utilisateur.upsert({
      where: { telephone },
      create: { telephone, nom: nom || 'Utilisateur', role: role || 'AGRICULTEUR', commune: commune || 'Bamako', region: region || 'BAMAKO' },
      update: {},
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
      // Temporaire pour les tests — retirer quand AfricasTalking live est activé
      _devOtp: code,
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
    let { telephone, code } = req.body;
    telephone = normaliserTelephone(telephone);

    // Vérification du code (Support du Master OTP "000000" pour les tests)
    const isMasterCode = code === '000000';
    let otpValide = false;
    let otpId: string | undefined;

    if (isMasterCode) {
      otpValide = true;
    } else {
      const otp = await prisma.otp.findFirst({
        where: {
          telephone,
          code,
          utilise: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (otp) {
        otpValide = true;
        otpId = otp.id;
      }
    }

    if (!otpValide) {
      res.status(400).json({ success: false, error: 'Code incorrect ou expiré' });
      return;
    }

    // Marquer l'OTP comme utilisé (si ce n'est pas le master code)
    if (otpId) {
      await prisma.otp.update({ where: { id: otpId }, data: { utilise: true } });
    }

    // Récupérer l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({ where: { telephone } });
    if (!utilisateur) {
      res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
      return;
    }

    if (!utilisateur.actif) {
      res.status(403).json({ success: false, error: 'Compte suspendu — contactez le support' });
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
    let { telephone } = req.body;
    telephone = normaliserTelephone(telephone);

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

// ─────────────────────────────────────────────────────────────
// POST /auth/admin-login
// ─────────────────────────────────────────────────────────────
export const connexionAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, motDePasse } = req.body;

    // 1. Essayer de trouver l'Admin dans la base de données (Priorité)
    const dbAdmin = await prisma.utilisateur.findFirst({
      where: { email, role: 'ADMIN' },
    });

    let isValid = false;
    let adminData = null;

    if (dbAdmin && dbAdmin.passwordHash) {
      isValid = await bcrypt.compare(motDePasse, dbAdmin.passwordHash);
      if (isValid) {
        adminData = dbAdmin;
      }
    }

    // 2. Fallback aux variables d'environnement si non trouvé ou invalide en DB
    if (!isValid) {
      const envAdminEmail = process.env.ADMIN_EMAIL;
      const envAdminPassword = process.env.ADMIN_PASSWORD;

      if (envAdminEmail && envAdminPassword && email === envAdminEmail && motDePasse === envAdminPassword) {
        isValid = true;
        adminData = {
          id: 'admin-env',
          nom: 'Administrateur (Env)',
          email: envAdminEmail,
          role: 'ADMIN',
          region: 'BAMAKO',
          commune: 'Bamako',
        };
      }
    }

    // Délai fixe anti-brute force
    await new Promise(r => setTimeout(r, 800));

    if (!isValid || !adminData) {
      res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      return;
    }

    const token = jwt.sign(
      { userId: adminData.id, email: (adminData as any).email, role: 'ADMIN' },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as never }
    );

    res.json({
      success: true,
      data: {
        token,
        utilisateur: {
          id: adminData.id,
          nom: adminData.nom,
          email: (adminData as any).email || (adminData as any).telephone,
          role: 'ADMIN',
          region: adminData.region,
          commune: adminData.commune,
        },
      },
    });
  } catch (err) {
    console.error('[auth/admin-login]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /auth/profil
// ─────────────────────────────────────────────────────────────
export const modifierProfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nom, commune, region } = req.body;

    const utilisateur = await prisma.utilisateur.update({
      where: { id: req.user!.userId },
      data: { nom, commune, region },
      select: { id: true, nom: true, telephone: true, role: true, region: true, commune: true },
    });

    res.json({ success: true, data: utilisateur });
  } catch (err) {
    console.error('[auth/profil]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /auth/register-email
// ─────────────────────────────────────────────────────────────
interface RegisterEmailBody {
  email: string;
  motDePasse: string;
  nom: string;
  role?: 'AGRICULTEUR' | 'ACHETEUR' | 'BOUTIQUE';
  commune: string;
  region: any;
  telephone?: string;
}

export const inscrireEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, motDePasse, nom, role, commune, region, telephone } = req.body as RegisterEmailBody;

    if (!email || !motDePasse || !nom) {
      res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
      return;
    }

    if (motDePasse.length < 8) {
      res.status(400).json({ success: false, error: 'Le mot de passe doit faire au moins 8 caractères' });
      return;
    }

    // Vérifier si l'email existe déjà
    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
      return;
    }

    // Hashage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(motDePasse, salt);

    // Création de l'utilisateur
    const utilisateur = await prisma.utilisateur.create({
      data: {
        email,
        passwordHash,
        nom,
        role: role || 'AGRICULTEUR',
        commune,
        region,
        telephone, // Optionnel lors de l'inscription email
      },
    });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as never }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          email: utilisateur.email,
          telephone: utilisateur.telephone,
          role: utilisateur.role,
          region: utilisateur.region,
          commune: utilisateur.commune,
        },
      },
    });
  } catch (err) {
    console.error('[auth/register-email]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'inscription par email' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /auth/login-email
// ─────────────────────────────────────────────────────────────
interface LoginEmailBody {
  email: string;
  motDePasse: string;
}

export const connexionEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, motDePasse } = req.body as LoginEmailBody;

    if (!email || !motDePasse) {
      res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
      return;
    }

    // Trouver l'utilisateur
    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur || !utilisateur.passwordHash) {
      res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      return;
    }

    // Vérifier le mot de passe
    const valide = await bcrypt.compare(motDePasse, utilisateur.passwordHash);
    if (!valide) {
      res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      return;
    }

    if (!utilisateur.actif) {
      res.status(403).json({ success: false, error: 'Compte suspendu' });
      return;
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
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
          email: utilisateur.email,
          telephone: utilisateur.telephone,
          role: utilisateur.role,
          region: utilisateur.region,
          commune: utilisateur.commune,
        },
      },
    });
  } catch (err) {
    console.error('[auth/login-email]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la connexion' });
  }
};
