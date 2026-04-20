import prisma from '../lib/prisma';
import { TypeTransaction, StatutRetrait } from '@prisma/client';
import { envoyerSms } from './sms.service';

export const portefeuilleService = {
  /**
   * Récupère ou crée le portefeuille d'un utilisateur
   */
  async getOrCreatePortefeuille(utilisateurId: string) {
    let portefeuille = await prisma.portefeuille.findUnique({
      where: { utilisateurId },
    });

    if (!portefeuille) {
      portefeuille = await prisma.portefeuille.create({
        data: { utilisateurId, solde: 0 },
      });
    }

    return portefeuille;
  },

  /**
   * Crédite le solde d'un utilisateur suite à une vente ou location
   */
  async ajouterFonds(utilisateurId: string, montant: number, type: TypeTransaction, referenceId?: string) {
    const portefeuille = await this.getOrCreatePortefeuille(utilisateurId);

    return await prisma.$transaction([
      prisma.portefeuille.update({
        where: { id: portefeuille.id },
        data: { solde: { increment: montant } },
      }),
      prisma.transactionPortefeuille.create({
        data: {
          portefeuilleId: portefeuille.id,
          montant: montant,
          type,
          referenceId,
        },
      }),
    ]);
  },

  /**
   * Enregistre une demande de retrait (débit immédiat du solde "virtuel", en attente de virement réel)
   */
  async initierRetrait(utilisateurId: string, montant: number, numeroPhone: string) {
    return await prisma.$transaction(async (tx) => {
      // Lecture + validation à l'intérieur de la transaction pour éviter le double-retrait
      const portefeuille = await tx.portefeuille.findUnique({ where: { utilisateurId } });
      if (!portefeuille || portefeuille.solde < montant) {
        throw new Error('Solde insuffisant pour ce retrait');
      }

      await tx.portefeuille.update({
        where: { id: portefeuille.id },
        data: { solde: { decrement: montant } },
      });

      await tx.transactionPortefeuille.create({
        data: { portefeuilleId: portefeuille.id, montant: -montant, type: 'RETRAIT' },
      });

      return tx.retrait.create({
        data: { utilisateurId, montant, numeroPhone, statut: 'EN_ATTENTE' },
      });
    });
  },

  /**
   * Valide ou rejette une demande de retrait (Admin)
   */
  async traiterRetrait(retraitId: string, nouveauStatut: StatutRetrait) {
    const retrait = await prisma.retrait.findUnique({
      where: { id: retraitId },
      include: { utilisateur: true },
    });

    if (!retrait) throw new Error('Demande de retrait introuvable');
    if (retrait.statut !== 'EN_ATTENTE') throw new Error('Cette demande a déjà été traitée');

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Mettre à jour le statut du retrait
      const updatedRetrait = await tx.retrait.update({
        where: { id: retraitId },
        data: { statut: nouveauStatut },
      });

      // 2. Si rejeté, on rembourse le solde
      if (nouveauStatut === 'REJETE') {
        const portefeuille = await tx.portefeuille.findUnique({
          where: { utilisateurId: retrait.utilisateurId },
        });

        if (portefeuille) {
          await tx.portefeuille.update({
            where: { id: portefeuille.id },
            data: { solde: { increment: retrait.montant } },
          });

          await tx.transactionPortefeuille.create({
            data: {
              portefeuilleId: portefeuille.id,
              montant: retrait.montant,
              type: 'RETRAIT', // On peut garder RETRAIT mais positif = remboursement
              referenceId: retrait.id,
            },
          });
        }
      }

      return updatedRetrait;
    });

    // 3. Envoyer un SMS de notification
    const message = nouveauStatut === 'VALIDE'
      ? `Sɔrɔ: Votre retrait de ${retrait.montant} FCFA a été validé et envoyé sur votre numéro ${retrait.numeroPhone}.`
      : `Sɔrɔ: Votre retrait de ${retrait.montant} FCFA a été rejeté. Le montant a été reversé sur votre solde Sɔrɔ.`;

    try {
      await envoyerSms({
        to: retrait.utilisateur.telephone,
        message,
      });
    } catch (err) {
      console.error('[SMS/Retrait]', err);
      // On ne bloque pas si le SMS échoue
    }

    return result;
  },
};

