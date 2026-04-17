"use strict";
// Contrôleur des produits (récoltes agricoles)
// CRUD complet + liste paginée avec filtres par type, région, commune
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supprimerProduit = exports.modifierProduit = exports.creerProduit = exports.getProduit = exports.getMesAnnonces = exports.listerProduits = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─────────────────────────────────────────────────────────────
// GET /produits
// ─────────────────────────────────────────────────────────────
const listerProduits = async (req, res) => {
    try {
        const { type, region, commune, search, page = '1', limit = '20', minPrix, maxPrix } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = { disponible: true };
        if (type)
            where.type = type;
        if (region)
            where.region = region;
        if (commune)
            where.commune = { contains: commune, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { commune: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (minPrix || maxPrix) {
            where.prixFcfa = {};
            if (minPrix)
                where.prixFcfa.gte = parseInt(minPrix);
            if (maxPrix)
                where.prixFcfa.lte = parseInt(maxPrix);
        }
        const [produits, total] = await Promise.all([
            prisma_1.default.produit.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    agriculteur: { select: { id: true, nom: true, commune: true, telephone: true } },
                },
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
        console.error('[produits/lister]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerProduits = listerProduits;
// ─────────────────────────────────────────────────────────────
// GET /produits/mes-annonces
// ─────────────────────────────────────────────────────────────
const getMesAnnonces = async (req, res) => {
    try {
        const produits = await prisma_1.default.produit.findMany({
            where: { agriculteurId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: produits });
    }
    catch (err) {
        console.error('[produits/mes-annonces]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.getMesAnnonces = getMesAnnonces;
// ─────────────────────────────────────────────────────────────
// GET /produits/:id
// ─────────────────────────────────────────────────────────────
const getProduit = async (req, res) => {
    try {
        const produit = await prisma_1.default.produit.findUnique({
            where: { id: req.params.id },
            include: {
                agriculteur: {
                    select: {
                        id: true,
                        nom: true,
                        commune: true,
                        region: true,
                        telephone: true,
                        photoUrl: true,
                        avisRecus: {
                            select: { note: true }
                        }
                    }
                },
            },
        });
        if (!produit) {
            res.status(404).json({ success: false, error: 'Annonce introuvable' });
            return;
        }
        res.json({ success: true, data: produit });
    }
    catch (err) {
        console.error('[produits/get]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.getProduit = getProduit;
// ─────────────────────────────────────────────────────────────
// POST /produits
// ─────────────────────────────────────────────────────────────
const creerProduit = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.latitude)
            data.latitude = parseFloat(data.latitude);
        if (data.longitude)
            data.longitude = parseFloat(data.longitude);
        if (data.prixFcfa)
            data.prixFcfa = parseInt(data.prixFcfa);
        if (data.quantiteKg)
            data.quantiteKg = parseFloat(data.quantiteKg);
        const produit = await prisma_1.default.produit.create({
            data: {
                ...data,
                agriculteurId: req.user.userId,
                ...(req.file?.path && { photoUrl: req.file.path }),
            },
        });
        res.status(201).json({ success: true, data: produit, message: 'Annonce publiée avec succès' });
    }
    catch (err) {
        console.error('[produits/creer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la création' });
    }
};
exports.creerProduit = creerProduit;
// ─────────────────────────────────────────────────────────────
// PUT /produits/:id
// ─────────────────────────────────────────────────────────────
const modifierProduit = async (req, res) => {
    try {
        const produit = await prisma_1.default.produit.findUnique({ where: { id: req.params.id } });
        if (!produit) {
            res.status(404).json({ success: false, error: 'Annonce introuvable' });
            return;
        }
        if (produit.agriculteurId !== req.user.userId) {
            res.status(403).json({ success: false, error: 'Vous ne pouvez modifier que vos propres annonces' });
            return;
        }
        const produitMaj = await prisma_1.default.produit.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ success: true, data: produitMaj });
    }
    catch (err) {
        console.error('[produits/modifier]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
    }
};
exports.modifierProduit = modifierProduit;
// ─────────────────────────────────────────────────────────────
// DELETE /produits/:id
// ─────────────────────────────────────────────────────────────
const supprimerProduit = async (req, res) => {
    try {
        const produit = await prisma_1.default.produit.findUnique({ where: { id: req.params.id } });
        if (!produit) {
            res.status(404).json({ success: false, error: 'Annonce introuvable' });
            return;
        }
        if (produit.agriculteurId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, error: 'Action non autorisée' });
            return;
        }
        await prisma_1.default.produit.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Annonce supprimée' });
    }
    catch (err) {
        console.error('[produits/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
exports.supprimerProduit = supprimerProduit;
//# sourceMappingURL=produits.controller.js.map