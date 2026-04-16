import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';
import { portefeuilleService } from '../services/portefeuille.service';
import { envoyerSms } from '../services/sms.service';

/**
 * GET /portefeuille
 * Récupère le solde et les 20 dernières transactions
 */
export const getPortefeuille = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const portefeuille = await portefeuilleService.getOrCreatePortefeuille(userId);

    const transactions = await prisma.transactionPortefeuille.findMany({
      where: { portefeuilleId: portefeuille.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const retraits = await prisma.retrait.findMany({
      where: { utilisateurId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: {
        solde: portefeuille.solde,
        transactions,
        retraits,
      },
    });
  } catch (err) {
    console.error('[portefeuille/get]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du portefeuille' });
  }
};

/**
 * POST /portefeuille/retrait
 * Initie une demande de retrait vers un numéro Orange Money / Wave
 */
export const demanderRetrait = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { montant, numeroPhone } = req.body;
    const userId = req.user!.userId;

    if (!montant || montant < 2000) {
      res.status(400).json({ success: false, error: 'Le montant minimum de retrait est de 2 000 FCFA' });
      return;
    }

    if (!numeroPhone) {
      res.status(400).json({ success: false, error: 'Le numéro de téléphone est requis' });
      return;
    }

    await portefeuilleService.initierRetrait(userId, montant, numeroPhone);

    // Notification SMS de prise en compte
    try {
      const utilisateur = await prisma.utilisateur.findUnique({ where: { id: userId } });
      if (utilisateur) {
        await envoyerSms({
          to: utilisateur.telephone,
          message: `Sɔrɔ: Votre demande de retrait de ${montant.toLocaleString('fr')} FCFA a été reçue. Elle sera traitée sous 24h à 48h.`,
        });
      }
    } catch (smsErr) {
      console.error('[portefeuille/retrait] SMS notification échoué:', smsErr);
    }

    res.json({
      success: true,
      message: 'Votre demande de retrait a été enregistrée. Elle sera traitée sous 24h à 48h.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[portefeuille/retrait]', err);
    res.status(400).json({ success: false, error: error.message || 'Erreur lors de la demande de retrait' });
  }
};
