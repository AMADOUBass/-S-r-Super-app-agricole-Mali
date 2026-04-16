// Contrôleur des commandes
// Gère la création, le paiement escrow Flutterwave et la confirmation de livraison

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { initierPaiement, verifierPaiement } from '../services/flutterwave.service';
import { envoyerSms } from '../services/sms.service';
import { portefeuilleService } from '../services/portefeuille.service';

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

    const nouvelleQuantite = produit.quantiteKg - quantiteKg;

    const [commande] = await prisma.$transaction([
      prisma.commande.create({
        data: {
          produitId,
          quantiteKg,
          montantFcfa,
          commission,
          acheteurId: req.user!.userId,
          vendeurId: produit.agriculteurId,
        },
      }),
      prisma.produit.update({
        where: { id: produitId },
        data: {
          quantiteKg: nouvelleQuantite,
          // Marquer indisponible si stock épuisé
          disponible: nouvelleQuantite > 0,
        },
      }),
    ]);

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
// GET /commandes/:id/statut — polling frontend pour vérifier le statut
// ─────────────────────────────────────────────────────────────
export const getStatutCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      select: { id: true, statut: true, paiementRef: true, acheteurId: true, vendeurId: true },
    });

    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }

    const estConcerne =
      commande.acheteurId === req.user!.userId ||
      commande.vendeurId === req.user!.userId;
    if (!estConcerne) {
      res.status(403).json({ success: false, error: 'Non autorisé' });
      return;
    }

    // Si en cours, vérifier auprès de Flutterwave si paiement passé
    if (commande.statut === 'PAIEMENT_INITIE' && commande.paiementRef) {
      try {
        const paiement = await verifierPaiement(commande.paiementRef);
        if (paiement.status === 'succeeded') {
          await prisma.commande.update({
            where: { id: commande.id },
            data: { statut: 'PAYE' },
          });

          // Notifier le vendeur que le paiement est reçu
          try {
            const vendeur = await prisma.utilisateur.findUnique({ where: { id: commande.vendeurId } });
            if (vendeur) {
              await envoyerSms({
                to: vendeur.telephone,
                message: `Sɔrɔ: Paiement reçu pour la commande #${commande.id.slice(-8)}. Vous pouvez maintenant procéder à la livraison.`,
              });
            }
          } catch (smsErr) {
            console.error('[commandes/statut] SMS vendeur échoué:', smsErr);
          }

          res.json({ success: true, statut: 'PAYE' });
          return;
        }
      } catch {
        // Flutterwave ne connaît pas encore ce paiement — pas grave
      }
    }

    res.json({ success: true, statut: commande.statut });
  } catch (err) {
    console.error('[commandes/statut]', err);
    res.status(500).json({ success: false, error: 'Erreur' });
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
      data: { statut: 'PAIEMENT_INITIE', paiementRef: paiement.charge_id },
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
// POST /commandes/:id/preparer — le vendeur marque comme prêt
// ─────────────────────────────────────────────────────────────
export const preparerCommande = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: req.params.id },
      include: {
        acheteur: { select: { nom: true, telephone: true } },
        produit: { select: { type: true } },
      },
    });

    if (!commande) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }

    if (commande.vendeurId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Seul le vendeur peut marquer la commande comme prête' });
      return;
    }

    if (commande.statut !== 'PAYE') {
      res.status(400).json({ success: false, error: `La commande doit être PAYE pour être préparée (Statut actuel: ${commande.statut})` });
      return;
    }

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'EN_COURS' },
    });

    // Notifier l'acheteur par SMS
    try {
      await envoyerSms({
        to: commande.acheteur.telephone,
        message: `Sɔrɔ: Votre commande de ${commande.quantiteKg} kg de ${commande.produit.type.toLowerCase()} est prête ! Contactez le vendeur pour organiser la livraison.`,
      });
    } catch (smsErr) {
      console.error('[commandes/preparer] SMS acheteur échoué:', smsErr);
    }

    res.json({ success: true, message: 'Commande marquée comme prête — acheteur notifié' });
  } catch (err) {
    console.error('[commandes/preparer]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la préparation' });
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

    if (!['PAYE', 'EN_COURS'].includes(commande.statut)) {
      res.status(400).json({ success: false, error: 'La commande n\'est pas dans un état permettant la confirmation' });
      return;
    }

    await prisma.$transaction([
      prisma.commande.update({
        where: { id: commande.id },
        data: { statut: 'LIVRE' },
      }),
      // Créditer le solde du vendeur
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

    // Restaurer le stock et remettre disponible
    await prisma.$transaction([
      prisma.produit.update({
        where: { id: commande.produitId },
        data: {
          quantiteKg: { increment: commande.quantiteKg },
          disponible: true,
        },
      }),
    ]);

    // Notification SMS Annulation
    try {
      const destinataireId = req.user!.userId === commande.acheteurId ? commande.vendeurId : commande.acheteurId;
      const user = await prisma.utilisateur.findUnique({ where: { id: destinataireId } });
      if (user) {
        await envoyerSms({
          to: user.telephone,
          message: `Sɔrɔ: La commande #${commande.id.slice(-8)} a été annulée.`,
        });
      }
    } catch (smsErr) {
      console.error('[commandes/annuler] SMS annulation échoué:', smsErr);
    }

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

      // Notifier le vendeur
      try {
        const vendeur = await prisma.utilisateur.findUnique({ where: { id: commande.vendeurId } });
        if (vendeur) {
          await envoyerSms({
            to: vendeur.telephone,
            message: `Sɔrɔ: Paiement reçu pour la commande #${commande.id.slice(-8)}. Vous pouvez maintenant procéder à la livraison.`,
          });
        }
      } catch (smsErr) {
        console.error('[webhook/flutterwave] SMS vendeur échoué:', smsErr);
      }
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
