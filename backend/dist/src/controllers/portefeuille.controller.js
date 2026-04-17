"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demanderRetrait = exports.getPortefeuille = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const portefeuille_service_1 = require("../services/portefeuille.service");
const sms_service_1 = require("../services/sms.service");
/**
 * GET /portefeuille
 * Récupère le solde et les 20 dernières transactions
 */
const getPortefeuille = async (req, res) => {
    try {
        const userId = req.user.userId;
        const portefeuille = await portefeuille_service_1.portefeuilleService.getOrCreatePortefeuille(userId);
        const transactions = await prisma_1.default.transactionPortefeuille.findMany({
            where: { portefeuilleId: portefeuille.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const retraits = await prisma_1.default.retrait.findMany({
            where: { utilisateurId: userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json({
            success: true,
            data: {
                solde: portefeuille.solde,
                transactions,
                retraits,
            },
        });
    }
    catch (err) {
        console.error('[portefeuille/get]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération du portefeuille' });
    }
};
exports.getPortefeuille = getPortefeuille;
/**
 * POST /portefeuille/retrait
 * Initie une demande de retrait vers un numéro Orange Money / Wave
 */
const demanderRetrait = async (req, res) => {
    try {
        const { montant, numeroPhone } = req.body;
        const userId = req.user.userId;
        if (!montant || montant < 2000) {
            res.status(400).json({ success: false, error: 'Le montant minimum de retrait est de 2 000 FCFA' });
            return;
        }
        if (!numeroPhone) {
            res.status(400).json({ success: false, error: 'Le numéro de téléphone est requis' });
            return;
        }
        await portefeuille_service_1.portefeuilleService.initierRetrait(userId, montant, numeroPhone);
        // Notification SMS de prise en compte
        try {
            const utilisateur = await prisma_1.default.utilisateur.findUnique({ where: { id: userId } });
            if (utilisateur) {
                await (0, sms_service_1.envoyerSms)({
                    to: utilisateur.telephone,
                    message: `Sɔrɔ: Votre demande de retrait de ${montant.toLocaleString('fr')} FCFA a été reçue. Elle sera traitée sous 24h à 48h.`,
                });
            }
        }
        catch (smsErr) {
            console.error('[portefeuille/retrait] SMS notification échoué:', smsErr);
        }
        res.json({
            success: true,
            message: 'Votre demande de retrait a été enregistrée. Elle sera traitée sous 24h à 48h.',
        });
    }
    catch (err) {
        const error = err;
        console.error('[portefeuille/retrait]', err);
        res.status(400).json({ success: false, error: error.message || 'Erreur lors de la demande de retrait' });
    }
};
exports.demanderRetrait = demanderRetrait;
//# sourceMappingURL=portefeuille.controller.js.map