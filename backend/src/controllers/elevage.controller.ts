// Contrôleur de l'élevage (achat/vente d'animaux)
// CRUD avec filtres par type, région

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, ElevageQuery } from '../types';


// ─────────────────────────────────────────────────────────────
// GET /elevage
// ─────────────────────────────────────────────────────────────
export const listerAnimaux = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, region, search, page = '1', limit = '20' } = req.query as ElevageQuery;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { vendu: false };
    if (type) where.type = type;
    if (region) where.region = region;
    if (search) {
      where.OR = [
        { commune: { contains: search, mode: 'insensitive' } },
        { race: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [animaux, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          vendeur: { select: { id: true, nom: true, commune: true, telephone: true } },
        },
      }),
      prisma.animal.count({ where }),
    ]);

    res.json({
      success: true,
      data: animaux,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[elevage/lister]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /elevage/:id
// ─────────────────────────────────────────────────────────────
export const getAnimal = async (req: Request, res: Response): Promise<void> => {
  try {
    const animal = await prisma.animal.findUnique({
      where: { id: req.params.id },
      include: {
        vendeur: { select: { id: true, nom: true, commune: true, region: true, telephone: true } },
      },
    });

    if (!animal) {
      res.status(404).json({ success: false, error: 'Animal introuvable' });
      return;
    }

    res.json({ success: true, data: animal });
  } catch (err) {
    console.error('[elevage/get]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /elevage
// ─────────────────────────────────────────────────────────────
export const creerAnimal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const animal = await prisma.animal.create({
      data: { ...req.body, vendeurId: req.user!.userId },
    });
    res.status(201).json({ success: true, data: animal });
  } catch (err) {
    console.error('[elevage/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /elevage/:id
// ─────────────────────────────────────────────────────────────
export const modifierAnimal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const animal = await prisma.animal.findUnique({ where: { id: req.params.id } });

    if (!animal) {
      res.status(404).json({ success: false, error: 'Animal introuvable' });
      return;
    }

    if (animal.vendeurId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    const maj = await prisma.animal.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: maj });
  } catch (err) {
    console.error('[elevage/modifier]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /elevage/:id
// ─────────────────────────────────────────────────────────────
export const supprimerAnimal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const animal = await prisma.animal.findUnique({ where: { id: req.params.id } });

    if (!animal) {
      res.status(404).json({ success: false, error: 'Animal introuvable' });
      return;
    }

    if (animal.vendeurId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    await prisma.animal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Annonce supprimée' });
  } catch (err) {
    console.error('[elevage/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
};
