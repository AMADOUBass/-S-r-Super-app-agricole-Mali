"use strict";
// Contrôleur de l'élevage (achat/vente d'animaux)
// CRUD avec filtres par type, région
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supprimerAnimal = exports.modifierAnimal = exports.creerAnimal = exports.getAnimal = exports.listerAnimaux = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─────────────────────────────────────────────────────────────
// GET /elevage
// ─────────────────────────────────────────────────────────────
const listerAnimaux = async (req, res) => {
    try {
        const { type, region, search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = { vendu: false };
        if (type)
            where.type = type;
        if (region)
            where.region = region;
        if (search) {
            where.OR = [
                { commune: { contains: search, mode: 'insensitive' } },
                { race: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [animaux, total] = await Promise.all([
            prisma_1.default.animal.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    vendeur: { select: { id: true, nom: true, commune: true, telephone: true } },
                },
            }),
            prisma_1.default.animal.count({ where }),
        ]);
        res.json({
            success: true,
            data: animaux,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[elevage/lister]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerAnimaux = listerAnimaux;
// ─────────────────────────────────────────────────────────────
// GET /elevage/:id
// ─────────────────────────────────────────────────────────────
const getAnimal = async (req, res) => {
    try {
        const animal = await prisma_1.default.animal.findUnique({
            where: { id: req.params.id },
            include: {
                vendeur: {
                    select: {
                        id: true,
                        nom: true,
                        commune: true,
                        region: true,
                        telephone: true,
                        photoUrl: true,
                        avisRecus: { select: { note: true } }
                    }
                },
            },
        });
        if (!animal) {
            res.status(404).json({ success: false, error: 'Animal introuvable' });
            return;
        }
        res.json({ success: true, data: animal });
    }
    catch (err) {
        console.error('[elevage/get]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.getAnimal = getAnimal;
// ─────────────────────────────────────────────────────────────
// POST /elevage
// ─────────────────────────────────────────────────────────────
const creerAnimal = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.latitude)
            data.latitude = parseFloat(data.latitude);
        if (data.longitude)
            data.longitude = parseFloat(data.longitude);
        if (data.prixFcfa)
            data.prixFcfa = parseInt(data.prixFcfa);
        if (data.age)
            data.age = parseInt(data.age);
        if (data.poidsKg)
            data.poidsKg = parseFloat(data.poidsKg);
        const animal = await prisma_1.default.animal.create({
            data: { ...data, vendeurId: req.user.userId },
        });
        res.status(201).json({ success: true, data: animal });
    }
    catch (err) {
        console.error('[elevage/creer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la création' });
    }
};
exports.creerAnimal = creerAnimal;
// ─────────────────────────────────────────────────────────────
// PUT /elevage/:id
// ─────────────────────────────────────────────────────────────
const modifierAnimal = async (req, res) => {
    try {
        const animal = await prisma_1.default.animal.findUnique({ where: { id: req.params.id } });
        if (!animal) {
            res.status(404).json({ success: false, error: 'Animal introuvable' });
            return;
        }
        if (animal.vendeurId !== req.user.userId) {
            res.status(403).json({ success: false, error: 'Action non autorisée' });
            return;
        }
        const maj = await prisma_1.default.animal.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: maj });
    }
    catch (err) {
        console.error('[elevage/modifier]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
    }
};
exports.modifierAnimal = modifierAnimal;
// ─────────────────────────────────────────────────────────────
// DELETE /elevage/:id
// ─────────────────────────────────────────────────────────────
const supprimerAnimal = async (req, res) => {
    try {
        const animal = await prisma_1.default.animal.findUnique({ where: { id: req.params.id } });
        if (!animal) {
            res.status(404).json({ success: false, error: 'Animal introuvable' });
            return;
        }
        if (animal.vendeurId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, error: 'Action non autorisée' });
            return;
        }
        await prisma_1.default.animal.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Annonce supprimée' });
    }
    catch (err) {
        console.error('[elevage/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
exports.supprimerAnimal = supprimerAnimal;
//# sourceMappingURL=elevage.controller.js.map