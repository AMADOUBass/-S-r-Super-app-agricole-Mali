"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portefeuilleService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const sms_service_1 = require("./sms.service");
exports.portefeuilleService = {
    /**
     * Récupère ou crée le portefeuille d'un utilisateur
     */
    async getOrCreatePortefeuille(utilisateurId) {
        let portefeuille = await prisma_1.default.portefeuille.findUnique({
            where: { utilisateurId },
        });
        if (!portefeuille) {
            portefeuille = await prisma_1.default.portefeuille.create({
                data: { utilisateurId, solde: 0 },
            });
        }
        return portefeuille;
    },
    /**
     * Crédite le solde d'un utilisateur suite à une vente ou location
     */
    async ajouterFonds(utilisateurId, montant, type, referenceId) {
        const portefeuille = await this.getOrCreatePortefeuille(utilisateurId);
        return await prisma_1.default.$transaction([
            prisma_1.default.portefeuille.update({
                where: { id: portefeuille.id },
                data: { solde: { increment: montant } },
            }),
            prisma_1.default.transactionPortefeuille.create({
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
    async initierRetrait(utilisateurId, montant, numeroPhone) {
        const portefeuille = await this.getOrCreatePortefeuille(utilisateurId);
        if (portefeuille.solde < montant) {
            throw new Error('Solde insuffisant pour ce retrait');
        }
        return await prisma_1.default.$transaction([
            // 1. On déduit du solde
            prisma_1.default.portefeuille.update({
                where: { id: portefeuille.id },
                data: { solde: { decrement: montant } },
            }),
            // 2. On trace la transaction de débit
            prisma_1.default.transactionPortefeuille.create({
                data: {
                    portefeuilleId: portefeuille.id,
                    montant: -montant,
                    type: 'RETRAIT',
                },
            }),
            // 3. On crée la demande de retrait officielle
            prisma_1.default.retrait.create({
                data: {
                    utilisateurId,
                    montant,
                    numeroPhone,
                    statut: 'EN_ATTENTE',
                },
            }),
        ]);
    },
    /**
     * Valide ou rejette une demande de retrait (Admin)
     */
    async traiterRetrait(retraitId, nouveauStatut) {
        const retrait = await prisma_1.default.retrait.findUnique({
            where: { id: retraitId },
            include: { utilisateur: true },
        });
        if (!retrait)
            throw new Error('Demande de retrait introuvable');
        if (retrait.statut !== 'EN_ATTENTE')
            throw new Error('Cette demande a déjà été traitée');
        const result = await prisma_1.default.$transaction(async (tx) => {
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
            await (0, sms_service_1.envoyerSms)({
                to: retrait.utilisateur.telephone,
                message,
            });
        }
        catch (err) {
            console.error('[SMS/Retrait]', err);
            // On ne bloque pas si le SMS échoue
        }
        return result;
    },
};
//# sourceMappingURL=portefeuille.service.js.map