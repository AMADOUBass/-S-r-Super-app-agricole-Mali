// Middleware d'authentification JWT
// Vérifie le token Bearer dans le header Authorization et injecte l'utilisateur dans req.user

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import prisma from '../lib/prisma';

export const authentifier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token manquant — veuillez vous connecter' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // L'admin n'a pas de ligne en base — on skip la vérification actif
    if (payload.userId !== 'admin') {
      const user = await prisma.utilisateur.findUnique({
        where: { id: payload.userId },
        select: { actif: true },
      });

      if (!user || !user.actif) {
        res.status(403).json({ success: false, error: 'Compte suspendu ou introuvable' });
        return;
      }
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
  }
};

// Middleware pour vérifier qu'un utilisateur a le rôle requis
export const autoriser = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Accès refusé — rôle insuffisant' });
      return;
    }

    next();
  };
};
