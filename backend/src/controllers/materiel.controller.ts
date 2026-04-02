// Contrôleur du matériel agricole (location)
// CRUD + logique de location avec caution escrow CinetPay

import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, MaterielQuery } from '../types';

const COMMISSION_LOCATION = 0.05; // 5%

// ─────────────────────────────────────────────────────────────
// GET /materiel
// ─────────────────────────────────────────────────────────────
export const listerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, region, page = '1', limit = '20' } = req.query as MaterielQuery;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { disponible: true };
    if (type) where.type = type;
    if (region) where.region = region;

    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          proprietaire: { select: { id: true, nom: true, commune: true, telephone: true } },
        },
      }),
      prisma.materiel.count({ where }),
    ]);

    res.json({
      success: true,
      data: materiels,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[materiel/lister]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /materiel/:id
// ─────────────────────────────────────────────────────────────
export const getMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materiel = await prisma.materiel.findUnique({
      where: { id: req.params.id },
      include: {
        proprietaire: { select: { id: true, nom: true, commune: true, region: true, telephone: true } },
      },
    });

    if (!materiel) {
      res.status(404).json({ success: false, error: 'Matériel introuvable' });
      return;
    }

    res.json({ success: true, data: materiel });
  } catch (err) {
    console.error('[materiel/get]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /materiel
// ─────────────────────────────────────────────────────────────
export const creerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materiel = await prisma.materiel.create({
      data: { ...req.body, proprietaireId: req.user!.userId },
    });
    res.status(201).json({ success: true, data: materiel });
  } catch (err) {
    console.error('[materiel/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /materiel/:id
// ─────────────────────────────────────────────────────────────
export const modifierMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materiel = await prisma.materiel.findUnique({ where: { id: req.params.id } });

    if (!materiel) {
      res.status(404).json({ success: false, error: 'Matériel introuvable' });
      return;
    }

    if (materiel.proprietaireId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    const maj = await prisma.materiel.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: maj });
  } catch (err) {
    console.error('[materiel/modifier]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /materiel/:id
// ─────────────────────────────────────────────────────────────
export const supprimerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materiel = await prisma.materiel.findUnique({ where: { id: req.params.id } });

    if (!materiel) {
      res.status(404).json({ success: false, error: 'Matériel introuvable' });
      return;
    }

    if (materiel.proprietaireId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    await prisma.materiel.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Matériel supprimé' });
  } catch (err) {
    console.error('[materiel/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /materiel/:id/louer
// ─────────────────────────────────────────────────────────────
export const louerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateDebut, dateFin } = req.body;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin <= debut) {
      res.status(400).json({ success: false, error: 'La date de fin doit être après la date de début' });
      return;
    }

    const materiel = await prisma.materiel.findUnique({ where: { id: req.params.id } });

    if (!materiel || !materiel.disponible) {
      res.status(404).json({ success: false, error: 'Matériel indisponible' });
      return;
    }

    if (materiel.proprietaireId === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas louer votre propre matériel' });
      return;
    }

    const nbJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
    const montantFcfa = nbJours * materiel.prixJour;
    const commission = Math.round(montantFcfa * COMMISSION_LOCATION);

    const location = await prisma.location.create({
      data: {
        materielId: materiel.id,
        locataireId: req.user!.userId,
        dateDebut: debut,
        dateFin: fin,
        montantFcfa,
        commission,
        caution: materiel.caution,
      },
    });

    res.status(201).json({
      success: true,
      data: location,
      message: `Location créée — ${nbJours} jour(s) × ${materiel.prixJour} FCFA = ${montantFcfa} FCFA + caution ${materiel.caution} FCFA`,
    });
  } catch (err) {
    console.error('[materiel/louer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la location' });
  }
};
