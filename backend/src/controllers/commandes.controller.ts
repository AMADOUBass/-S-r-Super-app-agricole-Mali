import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { initierPaiement, verifierPaiement } from '../services/flutterwave.service';
import { envoyerSms } from '../services/sms.service';
import { Prisma } from '@prisma/client';

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

    let notificationMsg = '';

    // Transaction atomique : validation + réservation + création en une seule opération
    const commande = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let montantFcfa = 0;
      let commission = 0;
      let caution: number | undefined = undefined;
      let vendeurId = '';

      if (materielId) {
        const materiel = await tx.materiel.findUnique({
          where: { id: materielId },
          include: { proprietaire: true },
        });
        if (!materiel || !materiel.disponible) throw new Error('MATERIEL_INDISPONIBLE');
        await tx.materiel.update({ where: { id: materielId }, data: { disponible: false } });

        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        const nbJours = Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)));
        montantFcfa = nbJours * materiel.prixJour;
        caution = materiel.caution;
        commission = Math.round(montantFcfa * COMMISSION_LOCATION);
        vendeurId = materiel.proprietaireId;
        notificationMsg = `Sɔrô: Nouvelle location de ${materiel.type.toLowerCase()} par ${acheteur.nom}.`;

      } else if (animalId) {
        const animal = await tx.animal.findUnique({
          where: { id: animalId },
          include: { vendeur: true },
        });
        if (!animal || animal.vendu) throw new Error('ANIMAL_VENDU');
        await tx.animal.update({ where: { id: animalId }, data: { vendu: true } });

        montantFcfa = animal.prixFcfa;
        commission = Math.round(montantFcfa * COMMISSION_ACHETEUR);
        vendeurId = animal.vendeurId;
        notificationMsg = `Sɔrô: Achat de votre ${animal.type.toLowerCase()} initié par ${acheteur.nom}.`;

      } else if (produitId) {
        const produit = await tx.produit.findUnique({
          where: { id: produitId },
          include: { agriculteur: true },
        });
        if (!produit || !produit.disponible) throw new Error('PRODUIT_INDISPONIBLE');
        if (produit.quantiteKg < quantiteKg) throw new Error('STOCK_INSUFFISANT');

        const nouvelleQuantite = produit.quantiteKg - quantiteKg;
        await tx.produit.update({
          where: { id: produitId },
          data: { quantiteKg: { decrement: quantiteKg }, disponible: nouvelleQuantite > 0 },
        });

        montantFcfa = Math.round(produit.prixFcfa * quantiteKg);
        commission = Math.round(montantFcfa * COMMISSION_ACHETEUR);
        vendeurId = produit.agriculteurId;
        notificationMsg = `Sɔrô: Commande de ${quantiteKg}kg de ${produit.type.toLowerCase()} par ${acheteur.nom}.`;
      }

      return tx.commande.create({
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
        include: { vendeur: { select: { telephone: true } } },
      });
    });

    try {
      await envoyerSms({ to: commande.vendeur.telephone, message: notificationMsg });
    } catch (smsErr) {
      console.error('[commandes/creer] SMS failed', smsErr);
    }

    res.status(201).json({ success: true, data: commande });
  } catch (err: any) {
    const errorsMap: Record<string, [number, string]> = {
      MATERIEL_INDISPONIBLE: [409, 'Matériel indisponible'],
      ANIMAL_VENDU: [409, 'Animal déjà vendu ou introuvable'],
      PRODUIT_INDISPONIBLE: [409, 'Produit indisponible'],
      STOCK_INSUFFISANT: [409, 'Stock insuffisant pour cette quantité'],
    };
    const mapped = errorsMap[err.message];
    if (mapped) {
      res.status(mapped[0]).json({ success: false, error: mapped[1] });
    } else {
      console.error('[commandes/creer]', err);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
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
    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }
    if (commande.acheteurId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }
    if (commande.statut === 'PAYE' || commande.statut === 'LIVRE') {
      res.status(409).json({ success: false, error: 'Cette commande a déjà été payée' });
      return;
    }
    if (commande.statut === 'ANNULE') {
      res.status(409).json({ success: false, error: 'Cette commande est annulée' });
      return;
    }
    // Autorise EN_ATTENTE et PAIEMENT_INITIE (retry si redirect Flutterwave abandonné)
    const montantTotal = commande.montantFcfa + commande.commission + (commande.caution || 0);
    const paiement = await initierPaiement({
      transaction_id: commande.id,
      amount: montantTotal,
      currency: 'XOF',
      customer_name: commande.acheteur.nom,
      customer_phone_number: req.body.phoneNumber || commande.acheteur.telephone,
      network: req.body.network || 'orange',
      description: `Commande Sɔrô #${commande.id.slice(-8)}`,
      return_url: `${process.env.FRONTEND_PUBLIC_URL || 'https://soro.vercel.app'}/commandes/${commande.id}/statut`,
    });
    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'PAIEMENT_INITIE', paiementRef: paiement.charge_id },
    });
    res.json({
      success: true,
      payment_url: paiement.payment_url,
      // Mobile Money : pas de redirect, l'utilisateur confirme sur son téléphone
      polling: !paiement.payment_url,
    });
  } catch (err) {
    console.error('[commandes/payer] Erreur détaillée:', err);
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
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.commande.update({ where: { id: commande.id }, data: { statut: 'LIVRE' } });
      const portefeuille = await tx.portefeuille.upsert({
        where: { utilisateurId: commande.vendeurId },
        update: { solde: { increment: commande.montantFcfa } },
        create: { utilisateurId: commande.vendeurId, solde: commande.montantFcfa },
      });
      await tx.transactionPortefeuille.create({
        data: {
          portefeuilleId: portefeuille.id,
          montant: commande.montantFcfa,
          type: 'VENTE',
          referenceId: commande.id,
        },
      });
    });
    try {
      await envoyerSms({ to: commande.vendeur.telephone, message: `Sɔrô: Livraison confirmée par ${commande.acheteur.nom}.` });
    } catch {}
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
      if (tx_ref.startsWith('loc_')) {
        // Paiement d'une location
        const locationId = tx_ref.slice(4);
        const location = await prisma.location.findUnique({ where: { id: locationId } });
        if (location && location.statut === 'EN_ATTENTE') {
          await prisma.$transaction([
            prisma.location.update({ where: { id: locationId }, data: { statut: 'CAUTION_BLOQUEE' } }),
            prisma.materiel.update({ where: { id: location.materielId }, data: { disponible: false } }),
          ]);
          const proprietaire = await prisma.utilisateur.findFirst({
            where: { materiels: { some: { id: location.materielId } } },
          });
          if (proprietaire?.telephone) {
            try {
              await envoyerSms({
                to: proprietaire.telephone,
                message: `Sɔrô: Paiement reçu — location #${locationId.slice(-8)}. Remettez le matériel au locataire.`,
              });
            } catch {}
          }
        }
      } else {
        // Paiement d'une commande
        const commande = await prisma.commande.findUnique({ where: { id: tx_ref } });
        if (commande && commande.statut === 'PAIEMENT_INITIE') {
          await prisma.commande.update({ where: { id: tx_ref }, data: { statut: 'PAYE', paiementStatut: status } });
          const vendeur = await prisma.utilisateur.findUnique({ where: { id: commande.vendeurId } });
          if (vendeur?.telephone) {
            try {
              await envoyerSms({ to: vendeur.telephone, message: `Sɔrô: Paiement reçu commande #${commande.id.slice(-8)}.` });
            } catch {}
          }
        }
      }
    }
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};
