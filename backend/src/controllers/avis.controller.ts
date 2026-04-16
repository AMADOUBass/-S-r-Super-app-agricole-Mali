import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';

// ─────────────────────────────────────────────────────────────
// POST /avis
// Créer un avis pour un vendeur (suite à une commande ou location)
// ─────────────────────────────────────────────────────────────
export const creerAvis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { note, commentaire, commandeId, locationId, destinataireId } = req.body;

    if (!note || note < 1 || note > 5) {
      res.status(400).json({ success: false, error: 'La note doit être comprise entre 1 et 5' });
      return;
    }

    const auteurId = req.user!.userId;

    // Si lié à une commande, vérifier qu'elle est livrée et appartient à l'acheteur
    if (commandeId) {
      const commande = await prisma.commande.findUnique({
        where: { id: commandeId },
      });

      if (!commande || commande.acheteurId !== auteurId) {
        res.status(403).json({ success: false, error: 'Non autorisé' });
        return;
      }

      if (commande.statut !== 'LIVRE') {
        res.status(400).json({ success: false, error: 'Vous ne pouvez noter qu\'une commande livrée' });
        return;
      }

      // Vérifier si un avis existe déjà
      const avisExistant = await prisma.avis.findUnique({ where: { commandeId } });
      if (avisExistant) {
        res.status(400).json({ success: false, error: 'Un avis a déjà été laissé pour cette commande' });
        return;
      }
    }

    // Si lié à une location
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location || location.locataireId !== auteurId) {
        res.status(403).json({ success: false, error: 'Non autorisé' });
        return;
      }

      if (location.statut !== 'TERMINE' && location.statut !== 'EN_COURS') {
        res.status(400).json({ success: false, error: 'Vous ne pouvez noter qu\'une location en cours ou terminée' });
        return;
      }

      const avisExistant = await prisma.avis.findUnique({ where: { locationId } });
      if (avisExistant) {
        res.status(400).json({ success: false, error: 'Un avis a déjà été laissé pour cette location' });
        return;
      }
    }

    const avis = await prisma.avis.create({
      data: {
        note,
        commentaire,
        auteurId,
        destinataireId,
        commandeId,
        locationId,
      },
    });

    res.status(201).json({ success: true, data: avis });
  } catch (err) {
    console.error('[avis/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'avis' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /avis/utilisateur/:id
// Récupérer les avis d'un utilisateur
// ─────────────────────────────────────────────────────────────
export const getAvisUtilisateur = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const avis = await prisma.avis.findMany({
      where: { destinataireId: id },
      include: {
        auteur: {
          select: { nom: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: avis });
  } catch (err) {
    console.error('[avis/getUtilisateur]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des avis' });
  }
};
