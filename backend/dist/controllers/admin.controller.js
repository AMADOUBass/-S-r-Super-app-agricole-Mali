"use strict";
// Contrôleur admin — réservé au rôle ADMIN
// Stats globales, gestion des annonces, commandes et utilisateurs
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traiterRetrait = exports.listerRetraits = exports.supprimerAnimal = exports.listerAnimauxAdmin = exports.supprimerMateriel = exports.toggleMateriel = exports.listerMaterielAdmin = exports.toggleUtilisateur = exports.listerUtilisateurs = exports.listerCommandes = exports.toggleAnnonce = exports.supprimerAnnonce = exports.listerAnnonces = exports.getStats = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const portefeuille_service_1 = require("../services/portefeuille.service");
// ─────────────────────────────────────────────────────────────
// GET /admin/stats
// ─────────────────────────────────────────────────────────────
const getStats = async (_req, res) => {
    try {
        const [totalUtilisateurs, totalProduits, produitsDisponibles, totalAnimaux, totalMateriel, totalCommandes, commandesEnAttente, retraitsEnAttente, commandesPayees, commandesLivrees, revenueCommissions,] = await Promise.all([
            prisma_1.default.utilisateur.count(),
            prisma_1.default.produit.count(),
            prisma_1.default.produit.count({ where: { disponible: true } }),
            prisma_1.default.animal.count({ where: { vendu: false } }),
            prisma_1.default.materiel.count({ where: { disponible: true } }),
            prisma_1.default.commande.count(),
            prisma_1.default.commande.count({ where: { statut: 'EN_ATTENTE' } }),
            prisma_1.default.retrait.count({ where: { statut: 'EN_ATTENTE' } }),
            prisma_1.default.commande.count({ where: { statut: 'PAYE' } }),
            prisma_1.default.commande.count({ where: { statut: 'LIVRE' } }),
            prisma_1.default.commande.aggregate({ _sum: { commission: true }, where: { statut: { in: ['PAYE', 'LIVRE'] } } }),
        ]);
        res.json({
            success: true,
            data: {
                utilisateurs: totalUtilisateurs,
                produits: { total: totalProduits, disponibles: produitsDisponibles },
                animaux: totalAnimaux,
                materiel: totalMateriel,
                commandes: {
                    total: totalCommandes,
                    enAttente: commandesEnAttente,
                    payees: commandesPayees,
                    livrees: commandesLivrees,
                },
                retraitsEnAttente,
                commissions: revenueCommissions._sum.commission ?? 0,
            },
        });
    }
    catch (err) {
        console.error('[admin/stats]', err);
        res.status(500).json({ success: false, error: 'Erreur stats' });
    }
};
exports.getStats = getStats;
// ─────────────────────────────────────────────────────────────
// GET /admin/annonces
// ─────────────────────────────────────────────────────────────
const listerAnnonces = async (req, res) => {
    try {
        const { page = '1', limit = '30', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = search ? {
            OR: [
                { commune: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [produits, total] = await Promise.all([
            prisma_1.default.produit.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: { agriculteur: { select: { id: true, nom: true, telephone: true, commune: true } } },
            }),
            prisma_1.default.produit.count({ where }),
        ]);
        res.json({
            success: true,
            data: produits,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[admin/annonces]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerAnnonces = listerAnnonces;
// ─────────────────────────────────────────────────────────────
// DELETE /admin/annonces/:id
// ─────────────────────────────────────────────────────────────
const supprimerAnnonce = async (req, res) => {
    try {
        await prisma_1.default.produit.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Annonce supprimée' });
    }
    catch (err) {
        console.error('[admin/annonces/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
exports.supprimerAnnonce = supprimerAnnonce;
// ─────────────────────────────────────────────────────────────
// PATCH /admin/annonces/:id/toggle
// ─────────────────────────────────────────────────────────────
const toggleAnnonce = async (req, res) => {
    try {
        const produit = await prisma_1.default.produit.findUnique({ where: { id: req.params.id } });
        if (!produit) {
            res.status(404).json({ success: false, error: 'Introuvable' });
            return;
        }
        const updated = await prisma_1.default.produit.update({
            where: { id: req.params.id },
            data: { disponible: !produit.disponible },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('[admin/annonces/toggle]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.toggleAnnonce = toggleAnnonce;
// ─────────────────────────────────────────────────────────────
// GET /admin/commandes
// ─────────────────────────────────────────────────────────────
const listerCommandes = async (req, res) => {
    try {
        const { page = '1', limit = '30', statut } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = statut ? { statut: statut } : {};
        const [commandes, total] = await Promise.all([
            prisma_1.default.commande.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    produit: { select: { type: true, commune: true } },
                    acheteur: { select: { nom: true, telephone: true } },
                    vendeur: { select: { nom: true, telephone: true } },
                },
            }),
            prisma_1.default.commande.count({ where }),
        ]);
        res.json({
            success: true,
            data: commandes,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[admin/commandes]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerCommandes = listerCommandes;
// ─────────────────────────────────────────────────────────────
// GET /admin/utilisateurs
// ─────────────────────────────────────────────────────────────
const listerUtilisateurs = async (req, res) => {
    try {
        const { page = '1', limit = '30', search, role } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (role)
            where.role = role;
        if (search) {
            where.OR = [
                { nom: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } },
                { commune: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [utilisateurs, total] = await Promise.all([
            prisma_1.default.utilisateur.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, nom: true, telephone: true, role: true,
                    commune: true, region: true, actif: true, createdAt: true,
                    _count: { select: { produits: true, achats: true } },
                },
            }),
            prisma_1.default.utilisateur.count({ where }),
        ]);
        res.json({
            success: true,
            data: utilisateurs,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[admin/utilisateurs]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerUtilisateurs = listerUtilisateurs;
// ─────────────────────────────────────────────────────────────
// PATCH /admin/utilisateurs/:id/toggle
// ─────────────────────────────────────────────────────────────
const toggleUtilisateur = async (req, res) => {
    try {
        const user = await prisma_1.default.utilisateur.findUnique({ where: { id: req.params.id } });
        if (!user) {
            res.status(404).json({ success: false, error: 'Introuvable' });
            return;
        }
        const updated = await prisma_1.default.utilisateur.update({
            where: { id: req.params.id },
            data: { actif: !user.actif },
            select: { id: true, actif: true },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('[admin/utilisateurs/toggle]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.toggleUtilisateur = toggleUtilisateur;
// ─────────────────────────────────────────────────────────────
// GET /admin/materiel
// ─────────────────────────────────────────────────────────────
const listerMaterielAdmin = async (req, res) => {
    try {
        const { page = '1', limit = '30' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const [materiels, total] = await Promise.all([
            prisma_1.default.materiel.findMany({
                skip, take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: { proprietaire: { select: { id: true, nom: true, telephone: true, commune: true } } },
            }),
            prisma_1.default.materiel.count(),
        ]);
        res.json({ success: true, data: materiels, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
    }
    catch (err) {
        console.error('[admin/materiel]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.listerMaterielAdmin = listerMaterielAdmin;
// ─────────────────────────────────────────────────────────────
// PATCH /admin/materiel/:id/toggle
// ─────────────────────────────────────────────────────────────
const toggleMateriel = async (req, res) => {
    try {
        const m = await prisma_1.default.materiel.findUnique({ where: { id: req.params.id } });
        if (!m) {
            res.status(404).json({ success: false, error: 'Introuvable' });
            return;
        }
        const updated = await prisma_1.default.materiel.update({ where: { id: req.params.id }, data: { disponible: !m.disponible } });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('[admin/materiel/toggle]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.toggleMateriel = toggleMateriel;
// ─────────────────────────────────────────────────────────────
// DELETE /admin/materiel/:id
// ─────────────────────────────────────────────────────────────
const supprimerMateriel = async (req, res) => {
    try {
        await prisma_1.default.materiel.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Matériel supprimé' });
    }
    catch (err) {
        console.error('[admin/materiel/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.supprimerMateriel = supprimerMateriel;
// ─────────────────────────────────────────────────────────────
// GET /admin/animaux
// ─────────────────────────────────────────────────────────────
const listerAnimauxAdmin = async (req, res) => {
    try {
        const { page = '1', limit = '30' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const [animaux, total] = await Promise.all([
            prisma_1.default.animal.findMany({
                skip, take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: { vendeur: { select: { id: true, nom: true, telephone: true, commune: true } } },
            }),
            prisma_1.default.animal.count(),
        ]);
        res.json({ success: true, data: animaux, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
    }
    catch (err) {
        console.error('[admin/animaux]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.listerAnimauxAdmin = listerAnimauxAdmin;
// ─────────────────────────────────────────────────────────────
// DELETE /admin/animaux/:id
// ─────────────────────────────────────────────────────────────
const supprimerAnimal = async (req, res) => {
    try {
        await prisma_1.default.animal.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Animal supprimé' });
    }
    catch (err) {
        console.error('[admin/animaux/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur' });
    }
};
exports.supprimerAnimal = supprimerAnimal;
// ─────────────────────────────────────────────────────────────
// GET /admin/retraits
// ─────────────────────────────────────────────────────────────
const listerRetraits = async (req, res) => {
    try {
        const { page = '1', limit = '30', statut } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = statut ? { statut: statut } : {};
        const [retraits, total] = await Promise.all([
            prisma_1.default.retrait.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: { utilisateur: { select: { nom: true, telephone: true } } },
            }),
            prisma_1.default.retrait.count({ where }),
        ]);
        res.json({
            success: true,
            data: retraits,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[admin/retraits]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des retraits' });
    }
};
exports.listerRetraits = listerRetraits;
// ─────────────────────────────────────────────────────────────
// PATCH /admin/retraits/:id
// ─────────────────────────────────────────────────────────────
const traiterRetrait = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        if (!['VALIDE', 'REJETE'].includes(statut)) {
            res.status(400).json({ success: false, error: 'Statut invalide' });
            return;
        }
        const result = await portefeuille_service_1.portefeuilleService.traiterRetrait(id, statut);
        res.json({ success: true, data: result });
    }
    catch (err) {
        const error = err;
        console.error('[admin/retraits/traiter]', err);
        res.status(400).json({ success: false, error: error.message || 'Erreur lors du traitement du retrait' });
    }
};
exports.traiterRetrait = traiterRetrait;
//# sourceMappingURL=admin.controller.js.map