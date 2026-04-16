import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';

/**
 * POST /conversations
 * Démarre ou récupère une discussion pour un produit/animal/matériel spécifique
 */
export const demarrerConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { produitId, animalId, materielId } = req.body;
    const acheteurId = req.user!.userId;

    let vendeurId = '';
    let contextWhere: any = {};

    if (produitId) {
      const p = await prisma.produit.findUnique({ where: { id: produitId } });
      if (!p) { res.status(404).json({ success: false, error: 'Produit introuvable' }); return; }
      vendeurId = p.agriculteurId;
      contextWhere = { produitId };
    } else if (animalId) {
      const a = await prisma.animal.findUnique({ where: { id: animalId } });
      if (!a) { res.status(404).json({ success: false, error: 'Animal introuvable' }); return; }
      vendeurId = a.vendeurId;
      contextWhere = { animalId };
    } else if (materielId) {
      const m = await prisma.materiel.findUnique({ where: { id: materielId } });
      if (!m) { res.status(404).json({ success: false, error: 'Matériel introuvable' }); return; }
      vendeurId = m.proprietaireId;
      contextWhere = { materielId };
    } else {
      res.status(400).json({ success: false, error: 'Un contexte (produit, animal ou matériel) est requis' });
      return;
    }

    if (vendeurId === acheteurId) {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas négocier avec vous-même' });
      return;
    }

    // Chercher conversation existante
    let conversation = await prisma.conversation.findFirst({
      where: {
        acheteurId,
        vendeurId,
        ...contextWhere,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          acheteurId,
          vendeurId,
          ...contextWhere,
        },
      });
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    console.error('[messages/conversations/start]', err);
    res.status(500).json({ success: false, error: 'Erreur lors du démarrage de la discussion' });
  }
};

/**
 * GET /conversations
 * Liste les discussions de l'utilisateur
 */
export const getMesConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { acheteurId: userId },
          { vendeurId: userId },
        ],
      },
      include: {
        acheteur: { select: { nom: true, photoUrl: true } },
        vendeur: { select: { nom: true, photoUrl: true } },
        produit: { select: { type: true } },
        animal: { select: { type: true } },
        materiel: { select: { type: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('[messages/conversations/list]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

/**
 * GET /conversations/:id
 * Messages d'une conversation
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        acheteur: { select: { id: true, nom: true } },
        vendeur: { select: { id: true, nom: true } },
        produit: { select: { type: true, prixFcfa: true, photoUrl: true } },
        animal: { select: { type: true, prixFcfa: true, photoUrl: true } },
        materiel: { select: { type: true, prixJour: true, photoUrl: true } },
      },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation introuvable' });
      return;
    }

    if (conversation.acheteurId !== userId && conversation.vendeurId !== userId) {
      res.status(403).json({ success: false, error: 'Non autorisé' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Marquer comme lus les messages reçus
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        expediteurId: { not: userId },
        lu: false,
      },
      data: { lu: true },
    });

    res.json({ success: true, data: { conversation, messages } });
  } catch (err) {
    console.error('[messages/conversations/get]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
  }
};

/**
 * POST /conversations/:id/messages
 * Envoyer un message
 */
export const envoyerMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contenu, type } = req.body; // type peut être 'VOCAL' ou 'TEXTE'
    const userId = req.user!.userId;
    const audioUrl = (req.file as any)?.path; // Path Cloudinary si présent

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation || (conversation.acheteurId !== userId && conversation.vendeurId !== userId)) {
      res.status(404).json({ success: false, error: 'Conversation introuvable ou non autorisée' });
      return;
    }

    const message = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          expediteurId: userId,
          type: audioUrl ? 'VOCAL' : (type || 'TEXTE'),
          contenu: audioUrl ? null : contenu,
          audioUrl: audioUrl || null,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    res.status(201).json({ success: true, data: message[0] });
  } catch (err) {
    console.error('[messages/send]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’envoi' });
  }
};
