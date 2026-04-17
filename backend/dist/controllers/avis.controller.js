"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvisUtilisateur = exports.creerAvis = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─────────────────────────────────────────────────────────────
// POST /avis
// Créer un avis pour un vendeur (suite à une commande ou location)
// ─────────────────────────────────────────────────────────────
const creerAvis = async (req, res) => {
    try {
        const { note, commentaire, commandeId, locationId, destinataireId } = req.body;
        if (!note || note < 1 || note > 5) {
            res.status(400).json({ success: false, error: 'La note doit être comprise entre 1 et 5' });
            return;
        }
        const auteurId = req.user.userId;
        // Si lié à une commande, vérifier qu'elle est livrée et appartient à l'acheteur
        if (commandeId) {
            const commande = await prisma_1.default.commande.findUnique({
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
            const avisExistant = await prisma_1.default.avis.findUnique({ where: { commandeId } });
            if (avisExistant) {
                res.status(400).json({ success: false, error: 'Un avis a déjà été laissé pour cette commande' });
                return;
            }
        }
        // Si lié à une location
        if (locationId) {
            const location = await prisma_1.default.location.findUnique({
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
            const avisExistant = await prisma_1.default.avis.findUnique({ where: { locationId } });
            if (avisExistant) {
                res.status(400).json({ success: false, error: 'Un avis a déjà été laissé pour cette location' });
                return;
            }
        }
        const avis = await prisma_1.default.avis.create({
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
    }
    catch (err) {
        console.error('[avis/creer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'avis' });
    }
};
exports.creerAvis = creerAvis;
// ─────────────────────────────────────────────────────────────
// GET /avis/utilisateur/:id
// Récupérer les avis d'un utilisateur
// ─────────────────────────────────────────────────────────────
const getAvisUtilisateur = async (req, res) => {
    try {
        const { id } = req.params;
        const avis = await prisma_1.default.avis.findMany({
            where: { destinataireId: id },
            include: {
                auteur: {
                    select: { nom: true, photoUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: avis });
    }
    catch (err) {
        console.error('[avis/getUtilisateur]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des avis' });
    }
};
exports.getAvisUtilisateur = getAvisUtilisateur;
//# sourceMappingURL=avis.controller.js.map