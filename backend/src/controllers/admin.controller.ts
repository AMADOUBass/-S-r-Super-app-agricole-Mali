// Contrôleur admin — réservé au rôle ADMIN
// Stats globales, gestion des annonces, commandes et utilisateurs

import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

// ─────────────────────────────────────────────────────────────
// GET /admin/stats
// ─────────────────────────────────────────────────────────────
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUtilisateurs,
      totalProduits,
      produitsDisponibles,
      totalAnimaux,
      totalMateriel,
      totalCommandes,
      commandesEnAttente,
      commandesPayees,
      commandesLivrees,
      revenueCommissions,
    ] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.produit.count(),
      prisma.produit.count({ where: { disponible: true } }),
      prisma.animal.count({ where: { vendu: false } }),
      prisma.materiel.count({ where: { disponible: true } }),
      prisma.commande.count(),
      prisma.commande.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.commande.count({ where: { statut: 'PAYE' } }),
      prisma.commande.count({ where: { statut: 'LIVRE' } }),
      prisma.commande.aggregate({ _sum: { commission: true }, where: { statut: { in: ['PAYE', 'LIVRE'] } } }),
    ]);

    res.json({
      success: true,
      data: {
        utilisateurs: totalUtilisateurs,
        produits: { total: totalProduits, disponibles: produitsDisponibles },
        animaux: totalAnimaux,
        materiel: totalMateriel,
        commandes: {
          total: totalCommandes,
          enAttente: commandesEnAttente,
          payees: commandesPayees,
          livrees: commandesLivrees,
        },
        commissions: revenueCommissions._sum.commission ?? 0,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: 'Erreur stats' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/annonces
// ─────────────────────────────────────────────────────────────
export const listerAnnonces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30', search } = req.query as { page?: string; limit?: string; search?: string };
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = search ? {
      OR: [
        { commune: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { agriculteur: { select: { id: true, nom: true, telephone: true, commune: true } } },
      }),
      prisma.produit.count({ where }),
    ]);

    res.json({
      success: true,
      data: produits,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[admin/annonces]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/annonces/:id
// ─────────────────────────────────────────────────────────────
export const supprimerAnnonce = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.produit.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Annonce supprimée' });
  } catch (err) {
    console.error('[admin/annonces/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/annonces/:id/toggle
// ─────────────────────────────────────────────────────────────
export const toggleAnnonce = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const produit = await prisma.produit.findUnique({ where: { id: req.params.id } });
    if (!produit) { res.status(404).json({ success: false, error: 'Introuvable' }); return; }

    const updated = await prisma.produit.update({
      where: { id: req.params.id },
      data: { disponible: !produit.disponible },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/annonces/toggle]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/commandes
// ─────────────────────────────────────────────────────────────
export const listerCommandes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30', statut } = req.query as { page?: string; limit?: string; statut?: string };
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = statut ? { statut: statut as never } : {};

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          produit: { select: { type: true, commune: true } },
          acheteur: { select: { nom: true, telephone: true } },
          vendeur: { select: { nom: true, telephone: true } },
        },
      }),
      prisma.commande.count({ where }),
    ]);

    res.json({
      success: true,
      data: commandes,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[admin/commandes]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/utilisateurs
// ─────────────────────────────────────────────────────────────
export const listerUtilisateurs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30', search, role } = req.query as {
      page?: string; limit?: string; search?: string; role?: string;
    };
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
        { commune: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [utilisateurs, total] = await Promise.all([
      prisma.utilisateur.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nom: true, telephone: true, role: true,
          commune: true, region: true, actif: true, createdAt: true,
          _count: { select: { produits: true, achats: true } },
        },
      }),
      prisma.utilisateur.count({ where }),
    ]);

    res.json({
      success: true,
      data: utilisateurs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[admin/utilisateurs]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/utilisateurs/:id/toggle
// ─────────────────────────────────────────────────────────────
export const toggleUtilisateur = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.utilisateur.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ success: false, error: 'Introuvable' }); return; }

    const updated = await prisma.utilisateur.update({
      where: { id: req.params.id },
      data: { actif: !user.actif },
      select: { id: true, actif: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/utilisateurs/toggle]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/materiel
// ─────────────────────────────────────────────────────────────
export const listerMaterielAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30' } = req.query as { page?: string; limit?: string };
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        skip, take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { proprietaire: { select: { id: true, nom: true, telephone: true, commune: true } } },
      }),
      prisma.materiel.count(),
    ]);

    res.json({ success: true, data: materiels, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error('[admin/materiel]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/materiel/:id/toggle
// ─────────────────────────────────────────────────────────────
export const toggleMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const m = await prisma.materiel.findUnique({ where: { id: req.params.id } });
    if (!m) { res.status(404).json({ success: false, error: 'Introuvable' }); return; }
    const updated = await prisma.materiel.update({ where: { id: req.params.id }, data: { disponible: !m.disponible } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/materiel/toggle]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/materiel/:id
// ─────────────────────────────────────────────────────────────
export const supprimerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.materiel.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Matériel supprimé' });
  } catch (err) {
    console.error('[admin/materiel/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/animaux
// ─────────────────────────────────────────────────────────────
export const listerAnimauxAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30' } = req.query as { page?: string; limit?: string };
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [animaux, total] = await Promise.all([
      prisma.animal.findMany({
        skip, take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { vendeur: { select: { id: true, nom: true, telephone: true, commune: true } } },
      }),
      prisma.animal.count(),
    ]);

    res.json({ success: true, data: animaux, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error('[admin/animaux]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/animaux/:id
// ─────────────────────────────────────────────────────────────
export const supprimerAnimal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.animal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Animal supprimé' });
  } catch (err) {
    console.error('[admin/animaux/supprimer]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};
