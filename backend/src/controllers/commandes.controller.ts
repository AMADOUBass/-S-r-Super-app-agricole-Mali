// Contrôleur des commandes
// Gère la création, le paiement escrow Flutterwave et la confirmation de livraison

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { initierPaiement, verifierPaiement } from '../services/flutterwave.service';
import { envoyerSms } from '../services/sms.service';

const COMMISSION_ACHETEUR = 0.03; // 3%

// ─────────────────────────────────────────────────────────────
// POST /commandes
// ─────────────────────────────────────────────────────────────
export const creerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { produitId, quantiteKg } = req.body;

    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      include: { agriculteur: true },
    });

    if (!produit || !produit.disponible) {
      res.status(404).json({ success: false, error: 'Produit indisponible ou introuvable' });
      return;
    }

    if (produit.agriculteurId === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Vous ne pouvez pas commander votre propre produit' });
      return;
    }

    if (quantiteKg > produit.quantiteKg) {
      res.status(400).json({ success: false, error: `Stock insuffisant (${produit.quantiteKg} kg disponibles)` });
      return;
    }

    const montantFcfa = Math.round(produit.prixFcfa * quantiteKg);
    const commission = Math.round(montantFcfa * COMMISSION_ACHETEUR);

    const commande = await prisma.commande.create({
      data: {
        produitId,
        quantiteKg,
        montantFcfa,
        commission,
        acheteurId: req.user!.userId,
        vendeurId: produit.agriculteurId,
      },
    });

    // Notifier le vendeur par SMS avec le numéro WhatsApp de l'acheteur
    try {
      const acheteur = await prisma.utilisateur.findUnique({
        where: { id: req.user!.userId },
        select: { nom: true, telephone: true },
      });
      await envoyerSms({
        to: produit.agriculteur.telephone,
        message: `Sɔrɔ: Nouvelle commande de ${quantiteKg} kg de ${produit.type.toLowerCase()} (${montantFcfa.toLocaleString('fr')} FCFA) par ${acheteur?.nom}. Contactez-le sur WhatsApp : ${acheteur?.telephone}`,
      });
    } catch (smsErr) {
      console.error('[commandes/creer] SMS vendeur échoué:', smsErr);
    }

    res.status(201).json({ success: true, data: commande });
  } catch (err) {
    console.error('[commandes/creer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la commande' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /commandes/mes-commandes
// ─────────────────────────────────────────────────────────────
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
        produit: { select: { type: true, commune: true } },
        acheteur: { select: { nom: true, telephone: true } },
        vendeur: { select: { nom: true, telephone: true } },
      },
    });

    res.json({ success: true, data: commandes });
  } catch (err) {
    console.error('[commandes/mes-commandes]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /commandes/:id/payer
// ─────────────────────────────────────────────────────────────
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
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    if (commande.statut !== 'EN_ATTENTE') {
      res.status(400).json({ success: false, error: `Statut actuel: ${commande.statut} — paiement non possible` });
      return;
    }

    // Initier le paiement via Flutterwave
    const montantTotal = commande.montantFcfa + commande.commission;
    const network = (req.body.network as string) || 'orange';
    const paiement = await initierPaiement({
      transaction_id: commande.id,
      amount: montantTotal,
      currency: 'XOF',
      customer_name: commande.acheteur.nom,
      customer_phone_number: commande.acheteur.telephone,
      network,
      description: `Commande Sɔrɔ #${commande.id.slice(-8)}`,
      return_url: `${process.env.FRONTEND_PUBLIC_URL || process.env.FRONTEND_URL}/commandes/${commande.id}/payer`,
    });

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'PAIEMENT_INITIE', paiementRef: paiement.transaction_id },
    });

    res.json({ success: true, data: { paymentUrl: paiement.payment_url } });
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown; status?: number }; message?: string };
    console.error('[commandes/payer] Erreur:', {
      status: axiosErr?.response?.status,
      data: JSON.stringify(axiosErr?.response?.data),
      message: axiosErr?.message,
    });
    res.status(500).json({ success: false, error: 'Erreur lors du paiement' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /commandes/:id/confirmer
// ─────────────────────────────────────────────────────────────
export const confirmerLivraison = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      include: {
        vendeur: { select: { nom: true, telephone: true } },
        acheteur: { select: { nom: true } },
      },
    });

    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }

    if (commande.acheteurId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Seul l\'acheteur peut confirmer la livraison' });
      return;
    }

    if (commande.statut !== 'PAYE') {
      res.status(400).json({ success: false, error: 'La commande n\'est pas encore payée' });
      return;
    }

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'LIVRE' },
    });

    // Notifier le vendeur par SMS
    await envoyerSms({
      to: commande.vendeur.telephone,
      message: `Sɔrɔ: ${commande.acheteur.nom} a confirmé la livraison. Votre paiement de ${commande.montantFcfa} FCFA sera transféré sous 24h.`,
    });

    res.json({ success: true, message: 'Livraison confirmée — paiement en cours de transfert' });
  } catch (err) {
    console.error('[commandes/confirmer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la confirmation' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /commandes/:id/annuler
// ─────────────────────────────────────────────────────────────
export const annulerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({ where: { id: req.params.id } });

    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }

    const estConcerne = commande.acheteurId === req.user!.userId || commande.vendeurId === req.user!.userId;
    if (!estConcerne && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Action non autorisée' });
      return;
    }

    if (['LIVRE', 'ANNULE'].includes(commande.statut)) {
      res.status(400).json({ success: false, error: 'Cette commande ne peut plus être annulée' });
      return;
    }

    await prisma.commande.update({ where: { id: commande.id }, data: { statut: 'ANNULE' } });
    res.json({ success: true, message: 'Commande annulée' });
  } catch (err) {
    console.error('[commandes/annuler]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'annulation' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /commandes/webhooks/flutterwave — callback serveur→serveur
// Flutterwave envoie le header "verif-hash" = FLUTTERWAVE_SECRET_HASH
// ─────────────────────────────────────────────────────────────
export const webhookFlutterwave = async (req: Request, res: Response): Promise<void> => {
  try {
    // Vérifier la signature du webhook
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const receivedHash = req.headers['verif-hash'];

    if (!secretHash || receivedHash !== secretHash) {
      res.status(401).json({ message: 'Signature invalide' });
      return;
    }

    const { type, data } = req.body;

    // On ne traite que les paiements complétés
    if (type !== 'charge.completed') {
      res.json({ message: 'Événement ignoré' });
      return;
    }

    const { id: flwId, reference: tx_ref, status } = data;

    if (!tx_ref) {
      res.status(400).json({ message: 'reference manquante' });
      return;
    }

    // Vérifier auprès de Flutterwave (anti-fraude — ne jamais faire confiance au seul webhook)
    const paiementVerifie = await verifierPaiement(flwId);

    // S'assurer que la reference correspond bien
    if (paiementVerifie.tx_ref !== tx_ref) {
      res.status(400).json({ message: 'tx_ref incohérent' });
      return;
    }

    const commande = await prisma.commande.findUnique({ where: { id: tx_ref } });
    if (!commande) {
      res.status(404).json({ message: 'Commande introuvable' });
      return;
    }

    if (paiementVerifie.status === 'succeeded') {
      await prisma.commande.update({
        where: { id: tx_ref },
        data: { statut: 'PAYE', paiementStatut: status },
      });
    } else {
      // Paiement échoué ou pending → remettre en attente
      await prisma.commande.update({
        where: { id: tx_ref },
        data: { statut: 'EN_ATTENTE', paiementStatut: status },
      });
    }

    res.json({ message: 'OK' });
  } catch (err) {
    console.error('[webhook/flutterwave]', err);
    res.status(500).json({ message: 'Erreur webhook' });
  }
};
