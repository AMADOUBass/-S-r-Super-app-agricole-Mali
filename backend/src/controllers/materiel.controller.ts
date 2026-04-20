// Contrôleur du matériel agricole (location)
// CRUD + logique de location avec caution escrow

import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, MaterielQuery } from '../types';
import { initierPaiement, verifierPaiement } from '../services/flutterwave.service';
import { envoyerSms } from '../services/sms.service';
import { Prisma } from '@prisma/client';

const COMMISSION_LOCATION = 0.05; // 5%

// ─────────────────────────────────────────────────────────────
// GET /materiel
// ─────────────────────────────────────────────────────────────
export const listerMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, region, search, page = '1', limit = '20' } = req.query as MaterielQuery;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { disponible: true };
    if (type) where.type = type;
    if (region) where.region = region;
    if (search) {
      where.OR = [
        { commune: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

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
        proprietaire: { 
          select: { 
            id: true, 
            nom: true, 
            commune: true, 
            region: true, 
            telephone: true,
            photoUrl: true,
            avisRecus: { select: { note: true } }
          } 
        },
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
    const data = { ...req.body };
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);
    if (data.prixJour) data.prixJour = parseInt(data.prixJour);
    if (data.caution) data.caution = parseInt(data.caution);

    const materiel = await prisma.materiel.create({
      data: { ...data, proprietaireId: req.user!.userId },
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

// ─────────────────────────────────────────────────────────────
// POST /locations/:id/payer
// ─────────────────────────────────────────────────────────────
export const payerLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { locataire: true, materiel: true },
    });
    if (!location || location.locataireId !== req.user!.userId || location.statut !== 'EN_ATTENTE') {
      res.status(400).json({ success: false, error: 'Action impossible' });
      return;
    }
    const montantTotal = location.montantFcfa + location.commission + location.caution;
    const paiement = await initierPaiement({
      transaction_id: `loc_${location.id}`,
      amount: montantTotal,
      currency: 'XOF',
      customer_name: location.locataire.nom,
      customer_phone_number: req.body.phoneNumber || location.locataire.telephone || '',
      network: req.body.network || 'orange',
      description: `Location ${location.materiel.type} — #${location.id.slice(-8)}`,
      return_url: `${process.env.FRONTEND_PUBLIC_URL || 'https://soro.vercel.app'}/locations/${location.id}/statut`,
    });
    await prisma.location.update({
      where: { id: location.id },
      data: { paiementRef: paiement.charge_id },
    });
    res.json({ success: true, payment_url: paiement.payment_url });
  } catch (err) {
    console.error('[location/payer]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /locations/:id/statut
// ─────────────────────────────────────────────────────────────
export const getStatutLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { materiel: { include: { proprietaire: { select: { nom: true, telephone: true } } } } },
    });
    if (!location) {
      res.status(404).json({ success: false, error: 'Location introuvable' });
      return;
    }
    if (location.locataireId !== req.user!.userId && location.materiel.proprietaireId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }
    // Vérification active si paiement initié mais statut pas encore mis à jour
    if (location.statut === 'EN_ATTENTE' && location.paiementRef) {
      const paiement = await verifierPaiement(location.paiementRef);
      if (paiement.status === 'succeeded') {
        await prisma.$transaction([
          prisma.location.update({ where: { id: location.id }, data: { statut: 'CAUTION_BLOQUEE' } }),
          prisma.materiel.update({ where: { id: location.materielId }, data: { disponible: false } }),
        ]);
        location.statut = 'CAUTION_BLOQUEE';
      }
    }
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /locations/:id/confirmer-remise  (propriétaire → matériel remis)
// ─────────────────────────────────────────────────────────────
export const confirmerRemiseMateriel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { materiel: true },
    });
    if (!location || location.materiel.proprietaireId !== req.user!.userId || location.statut !== 'CAUTION_BLOQUEE') {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }
    await prisma.location.update({ where: { id: location.id }, data: { statut: 'EN_COURS' } });
    res.json({ success: true, message: 'Matériel remis au locataire' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /locations/:id/confirmer-retour  (locataire → matériel rendu, fonds libérés)
// ─────────────────────────────────────────────────────────────
export const confirmerRetourLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { materiel: { include: { proprietaire: true } }, locataire: true },
    });
    if (
      !location ||
      location.locataireId !== req.user!.userId ||
      !['CAUTION_BLOQUEE', 'EN_COURS'].includes(location.statut)
    ) {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }

    const montantProprietaire = location.montantFcfa - location.commission;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.location.update({ where: { id: location.id }, data: { statut: 'TERMINE' } });
      await tx.materiel.update({ where: { id: location.materielId }, data: { disponible: true } });

      const portefeuille = await tx.portefeuille.upsert({
        where: { utilisateurId: location.materiel.proprietaireId },
        update: { solde: { increment: montantProprietaire } },
        create: { utilisateurId: location.materiel.proprietaireId, solde: montantProprietaire },
      });

      await tx.transactionPortefeuille.create({
        data: {
          portefeuilleId: portefeuille.id,
          montant: montantProprietaire,
          type: 'LOCATION',
          referenceId: location.id,
        },
      });
    });

    try {
      await envoyerSms({
        to: location.materiel.proprietaire.telephone || '',
        message: `Sɔrô: Retour confirmé. ${montantProprietaire} FCFA crédités sur votre portefeuille.`,
      });
    } catch {}

    res.json({ success: true, message: 'Retour confirmé, fonds libérés au propriétaire' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /locations/:id/annuler
// ─────────────────────────────────────────────────────────────
export const annulerLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { materiel: true },
    });
    if (!location) {
      res.status(404).json({ success: false, error: 'Location introuvable' });
      return;
    }
    const isLocataire = location.locataireId === req.user!.userId;
    const isProprietaire = location.materiel.proprietaireId === req.user!.userId;
    if (!isLocataire && !isProprietaire && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }
    if (['TERMINE', 'ANNULE', 'EN_COURS'].includes(location.statut)) {
      res.status(400).json({ success: false, error: 'Annulation impossible à ce stade' });
      return;
    }
    await prisma.$transaction([
      prisma.location.update({ where: { id: location.id }, data: { statut: 'ANNULE' } }),
      prisma.materiel.update({ where: { id: location.materielId }, data: { disponible: true } }),
    ]);
    res.json({ success: true, message: 'Location annulée' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
