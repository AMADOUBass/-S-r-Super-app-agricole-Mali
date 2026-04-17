import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { initierPaiement, verifierPaiement } from '../services/flutterwave.service';
import { envoyerSms } from '../services/sms.service';
import { portefeuilleService } from '../services/portefeuille.service';

const COMMISSION_ACHETEUR = 0.03; // 3%
const COMMISSION_LOCATION = 0.05; // 5%

export const creerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { produitId, quantiteKg, animalId, materielId, dateDebut, dateFin } = req.body;

    const acheteur = await prisma.utilisateur.findUnique({ where: { id: req.user!.userId } });
    if (!acheteur) {
      res.status(404).json({ success: false, error: 'Acheteur introuvable' });
      return;
    }

    let montantFcfa = 0;
    let commission = 0;
    let caution: number | undefined = undefined;
    let vendeurId = '';
    let notificationMsg = '';
    let itemType = '';

    if (materielId) {
      const materiel = await prisma.materiel.findUnique({
        where: { id: materielId },
        include: { proprietaire: true },
      });
      if (!materiel || !materiel.disponible) {
        res.status(404).json({ success: false, error: 'Matériel indisponible' });
        return;
      }
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      const nbJours = Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)));
      
      montantFcfa = nbJours * materiel.prixJour;
      caution = materiel.caution;
      commission = Math.round(montantFcfa * COMMISSION_LOCATION);
      vendeurId = materiel.proprietaireId;
      itemType = materiel.type.toLowerCase();
      notificationMsg = `Sɔrô: Nouvelle location de ${itemType} par ${acheteur.nom}.`;

    } else if (animalId) {
      const animal = await prisma.animal.findUnique({
        where: { id: animalId },
        include: { vendeur: true },
      });
      if (!animal || animal.vendu) {
        res.status(404).json({ success: false, error: 'Animal vendu ou introuvable' });
        return;
      }
      montantFcfa = animal.prixFcfa;
      commission = Math.round(montantFcfa * COMMISSION_ACHETEUR);
      vendeurId = animal.vendeurId;
      itemType = animal.type.toLowerCase();
      notificationMsg = `Sɔrô: Achat de votre ${itemType} initié par ${acheteur.nom}.`;

    } else if (produitId) {
      const produit = await prisma.produit.findUnique({
        where: { id: produitId },
        include: { agriculteur: true },
      });
      if (!produit || !produit.disponible) {
        res.status(404).json({ success: false, error: 'Produit indisponible' });
        return;
      }
      montantFcfa = Math.round(produit.prixFcfa * quantiteKg);
      commission = Math.round(montantFcfa * COMMISSION_ACHETEUR);
      vendeurId = produit.agriculteurId;
      itemType = produit.type.toLowerCase();
      notificationMsg = `Sɔrô: Commande de ${quantiteKg}kg de ${itemType} par ${acheteur.nom}.`;
    }

    const commande = await prisma.commande.create({
      data: {
        acheteurId: req.user!.userId,
        vendeurId,
        produitId,
        animalId,
        materielId,
        quantiteKg: (animalId || materielId) ? null : quantiteKg,
        dateDebut: materielId ? new Date(dateDebut) : null,
        dateFin: materielId ? new Date(dateFin) : null,
        montantFcfa,
        commission,
        caution,
        statut: 'EN_ATTENTE',
      },
      include: {
        vendeur: { select: { telephone: true } }
      }
    });

    if (animalId) {
      await prisma.animal.update({ where: { id: animalId }, data: { vendu: true } });
    } else if (materielId) {
      await prisma.materiel.update({ where: { id: materielId }, data: { disponible: false } });
    } else if (produitId) {
      await prisma.produit.update({
        where: { id: produitId },
        data: { quantiteKg: { decrement: quantiteKg } }
      });
    }

    try {
      await envoyerSms({ to: commande.vendeur.telephone, message: notificationMsg });
    } catch (smsErr) {
      console.error('[commandes/creer] SMS failed', smsErr);
    }

    res.status(201).json({ success: true, data: commande });
  } catch (err) {
    console.error('[commandes/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getMesCommandes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        OR: [
          { acheteurId: req.user!.userId },
          { vendeurId: req.user!.userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        produit: { select: { id: true, type: true, commune: true, region: true } },
        animal: { select: { id: true, type: true, race: true, commune: true, region: true } },
        materiel: { select: { id: true, type: true, commune: true, region: true } },
        acheteur: { select: { nom: true, telephone: true } },
        vendeur: { select: { nom: true, telephone: true } },
      },
    });
    res.json({ success: true, data: commandes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getStatutCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      include: { produit: true, animal: true, materiel: true, vendeur: true },
    });
    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }
    if (commande.statut === 'PAIEMENT_INITIE' && commande.paiementRef) {
      const paiement = await verifierPaiement(commande.paiementRef);
      if (paiement.status === 'succeeded') {
        await prisma.commande.update({ where: { id: commande.id }, data: { statut: 'PAYE' } });
        commande.statut = 'PAYE';
      }
    }
    res.json({ success: true, data: commande });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const payerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      include: { acheteur: true },
    });
    if (!commande || commande.acheteurId !== req.user!.userId || commande.statut !== 'EN_ATTENTE') {
      res.status(400).json({ success: false, error: 'Action impossible' });
      return;
    }
    const montantTotal = commande.montantFcfa + commande.commission + (commande.caution || 0);
    const paiement = await initierPaiement({
      transaction_id: commande.id,
      amount: montantTotal,
      currency: 'XOF',
      customer_name: commande.acheteur.nom,
      customer_phone_number: req.body.phoneNumber || commande.acheteur.telephone,
      network: req.body.network || 'orange',
      description: `Commande Sɔrô #${commande.id.slice(-8)}`,
      return_url: `${process.env.FRONTEND_URL || 'https://soro.vercel.app'}/commandes/${commande.id}/statut`,
    });
    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'PAIEMENT_INITIE', paiementRef: paiement.charge_id },
    });
    res.json({ success: true, payment_url: paiement.payment_url });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const preparerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({ where: { id: req.params.id } });
    if (!commande || commande.vendeurId !== req.user!.userId || commande.statut !== 'PAYE') {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }
    await prisma.commande.update({ where: { id: req.params.id }, data: { statut: 'EN_COURS' } });
    res.json({ success: true, message: 'En cours' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const confirmerLivraison = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      include: { vendeur: true, acheteur: true },
    });
    if (!commande || commande.acheteurId !== req.user!.userId || !['PAYE', 'EN_COURS'].includes(commande.statut)) {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }
    await prisma.$transaction([
      prisma.commande.update({ where: { id: commande.id }, data: { statut: 'LIVRE' } }),
      prisma.portefeuille.upsert({
        where: { utilisateurId: commande.vendeurId },
        update: { solde: { increment: commande.montantFcfa } },
        create: { utilisateurId: commande.vendeurId, solde: commande.montantFcfa },
      }),
      prisma.transactionPortefeuille.create({
        data: {
          portefeuilleId: (await portefeuilleService.getOrCreatePortefeuille(commande.vendeurId)).id,
          montant: commande.montantFcfa,
          type: 'VENTE',
          referenceId: commande.id,
        },
      }),
    ]);
    await envoyerSms({ to: commande.vendeur.telephone, message: `Sɔrô: Livraison confirmée par ${commande.acheteur.nom}.` });
    res.json({ success: true, message: 'Livraison confirmée' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const annulerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({ where: { id: req.params.id } });
    if (!commande || (commande.acheteurId !== req.user!.userId && commande.vendeurId !== req.user!.userId && req.user!.role !== 'ADMIN')) {
      res.status(403).json({ success: false, error: 'Action interdite' });
      return;
    }
    if (['LIVRE', 'ANNULE'].includes(commande.statut)) {
      res.status(400).json({ success: false, error: 'Annulation impossible' });
      return;
    }
    await prisma.$transaction([
      prisma.commande.update({ where: { id: commande.id }, data: { statut: 'ANNULE' } }),
      commande.animalId
        ? prisma.animal.update({ where: { id: commande.animalId }, data: { vendu: false } })
        : commande.materielId
        ? prisma.materiel.update({ where: { id: commande.materielId }, data: { disponible: true } })
        : prisma.produit.update({
            where: { id: commande.produitId! },
            data: { quantiteKg: { increment: commande.quantiteKg! }, disponible: true },
          }),
    ]);
    res.json({ success: true, message: 'Commande annulée' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const webhookFlutterwave = async (req: Request, res: Response): Promise<void> => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (!secretHash || req.headers['verif-hash'] !== secretHash) {
      res.status(401).json({ message: 'Invalid hash' });
      return;
    }
    const { type, data } = req.body;
    if (type !== 'charge.completed') {
      res.json({ message: 'Ignored' });
      return;
    }
    const { id: flwId, reference: tx_ref, status } = data;
    const paiementVerifie = await verifierPaiement(flwId);
    if (paiementVerifie.status === 'succeeded' && paiementVerifie.tx_ref === tx_ref) {
      const commande = await prisma.commande.findUnique({ where: { id: tx_ref } });
      if (commande) {
        await prisma.commande.update({ where: { id: tx_ref }, data: { statut: 'PAYE', paiementStatut: status } });
        const vendeur = await prisma.utilisateur.findUnique({ where: { id: commande.vendeurId } });
        if (vendeur) await envoyerSms({ to: vendeur.telephone, message: `Sɔrô: Paiement reçu commande #${commande.id.slice(-8)}.` });
      }
    }
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};
