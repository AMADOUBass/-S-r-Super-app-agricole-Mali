// Contrôleur des produits (récoltes agricoles)
// CRUD complet + liste paginée avec filtres par type, région, commune

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, ProduitsQuery } from '../types';


// ─────────────────────────────────────────────────────────────
// GET /produits
// ─────────────────────────────────────────────────────────────
export const listerProduits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, region, commune, page = '1', limit = '20', minPrix, maxPrix } = req.query as ProduitsQuery;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { disponible: true };
    if (type) where.type = type;
    if (region) where.region = region;
    if (commune) where.commune = { contains: commune, mode: 'insensitive' };
    if (minPrix || maxPrix) {
      where.prixFcfa = {};
      if (minPrix) (where.prixFcfa as Record<string, number>).gte = parseInt(minPrix);
      if (maxPrix) (where.prixFcfa as Record<string, number>).lte = parseInt(maxPrix);
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          agriculteur: { select: { id: true, nom: true, commune: true, telephone: true } },
        },
      }),
      prisma.produit.count({ where }),
    ]);

    res.json({
      success: true,
      data: produits,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[produits/lister]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /produits/mes-annonces
// ─────────────────────────────────────────────────────────────
export const getMesAnnonces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const produits = await prisma.produit.findMany({
      where: { agriculteurId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: produits });
  } catch (err) {
    console.error('[produits/mes-annonces]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /produits/:id
// ─────────────────────────────────────────────────────────────
export const getProduit = async (req: Request, res: Response): Promise<void> => {
  try {
    const produit = await prisma.produit.findUnique({
      where: { id: req.params.id },
      include: {
        agriculteur: { select: { id: true, nom: true, commune: true, region: true, telephone: true } },
      },
    });

    if (!produit) {
      res.status(404).json({ success: false, error: 'Annonce introuvable' });
      return;
    }

    res.json({ success: true, data: produit });
  } catch (err) {
    console.error('[produits/get]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /produits
// ─────────────────────────────────────────────────────────────
export const creerProduit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const produit = await prisma.produit.create({
      data: {
        ...req.body,
        agriculteurId: req.user!.userId,
        ...(req.file?.path && { photoUrl: req.file.path }),
      },
    });

    res.status(201).json({ success: true, data: produit, message: 'Annonce publiée avec succès' });
  } catch (err) {
    console.error('[produits/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /produits/:id
// ─────────────────────────────────────────────────────────────
export const modifierProduit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const produit = await prisma.produit.findUnique({ where: { id: req.params.id } });

    if (!produit) {
      res.status(404).json({ success: false, error: 'Annonce introuvable' });
      return;
    }

    if (produit.agriculteurId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Vous ne pouvez modifier que vos propres annonces' });
      return;
    }

    const produitMaj = await prisma.produit.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: produitMaj });
  } catch (err) {
    console.error('[produits/modifier]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /produits/:id
// ─────────────────────────────────────────────────────────────
export const supprimerProduit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const produit = await prisma.produit.findUnique({ where: { id: req.params.id } });

    if (!produit) {
      res.status(404).json({ success: false, error: 'Annonce introuvable' });
      return;
    }

    if (produit.agriculteurId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    await prisma.produit.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Annonce supprimée' });
  } catch (err) {
    console.error('[produits/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
};
