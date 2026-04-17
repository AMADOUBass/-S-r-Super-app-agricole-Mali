"use strict";
// Contrôleur du matériel agricole (location)
// CRUD + logique de location avec caution escrow
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.louerMateriel = exports.supprimerMateriel = exports.modifierMateriel = exports.creerMateriel = exports.getMateriel = exports.listerMateriel = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const COMMISSION_LOCATION = 0.05; // 5%
// ─────────────────────────────────────────────────────────────
// GET /materiel
// ─────────────────────────────────────────────────────────────
const listerMateriel = async (req, res) => {
    try {
        const { type, region, search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const where = { disponible: true };
        if (type)
            where.type = type;
        if (region)
            where.region = region;
        if (search) {
            where.OR = [
                { commune: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [materiels, total] = await Promise.all([
            prisma_1.default.materiel.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    proprietaire: { select: { id: true, nom: true, commune: true, telephone: true } },
                },
            }),
            prisma_1.default.materiel.count({ where }),
        ]);
        res.json({
            success: true,
            data: materiels,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('[materiel/lister]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.listerMateriel = listerMateriel;
// ─────────────────────────────────────────────────────────────
// GET /materiel/:id
// ─────────────────────────────────────────────────────────────
const getMateriel = async (req, res) => {
    try {
        const materiel = await prisma_1.default.materiel.findUnique({
            where: { id: req.params.id },
            include: {
                proprietaire: {
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
        if (!materiel) {
            res.status(404).json({ success: false, error: 'Matériel introuvable' });
            return;
        }
        res.json({ success: true, data: materiel });
    }
    catch (err) {
        console.error('[materiel/get]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.getMateriel = getMateriel;
// ─────────────────────────────────────────────────────────────
// POST /materiel
// ─────────────────────────────────────────────────────────────
const creerMateriel = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.latitude)
            data.latitude = parseFloat(data.latitude);
        if (data.longitude)
            data.longitude = parseFloat(data.longitude);
        if (data.prixJour)
            data.prixJour = parseInt(data.prixJour);
        if (data.caution)
            data.caution = parseInt(data.caution);
        const materiel = await prisma_1.default.materiel.create({
            data: { ...data, proprietaireId: req.user.userId },
        });
        res.status(201).json({ success: true, data: materiel });
    }
    catch (err) {
        console.error('[materiel/creer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la création' });
    }
};
exports.creerMateriel = creerMateriel;
// ─────────────────────────────────────────────────────────────
// PUT /materiel/:id
// ─────────────────────────────────────────────────────────────
const modifierMateriel = async (req, res) => {
    try {
        const materiel = await prisma_1.default.materiel.findUnique({ where: { id: req.params.id } });
        if (!materiel) {
            res.status(404).json({ success: false, error: 'Matériel introuvable' });
            return;
        }
        if (materiel.proprietaireId !== req.user.userId) {
            res.status(403).json({ success: false, error: 'Action non autorisée' });
            return;
        }
        const maj = await prisma_1.default.materiel.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: maj });
    }
    catch (err) {
        console.error('[materiel/modifier]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
    }
};
exports.modifierMateriel = modifierMateriel;
// ─────────────────────────────────────────────────────────────
// DELETE /materiel/:id
// ─────────────────────────────────────────────────────────────
const supprimerMateriel = async (req, res) => {
    try {
        const materiel = await prisma_1.default.materiel.findUnique({ where: { id: req.params.id } });
        if (!materiel) {
            res.status(404).json({ success: false, error: 'Matériel introuvable' });
            return;
        }
        if (materiel.proprietaireId !== req.user.userId && req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, error: 'Action non autorisée' });
            return;
        }
        await prisma_1.default.materiel.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Matériel supprimé' });
    }
    catch (err) {
        console.error('[materiel/supprimer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
exports.supprimerMateriel = supprimerMateriel;
// ─────────────────────────────────────────────────────────────
// POST /materiel/:id/louer
// ─────────────────────────────────────────────────────────────
const louerMateriel = async (req, res) => {
    try {
        const { dateDebut, dateFin } = req.body;
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        if (fin <= debut) {
            res.status(400).json({ success: false, error: 'La date de fin doit être après la date de début' });
            return;
        }
        const materiel = await prisma_1.default.materiel.findUnique({ where: { id: req.params.id } });
        if (!materiel || !materiel.disponible) {
            res.status(404).json({ success: false, error: 'Matériel indisponible' });
            return;
        }
        if (materiel.proprietaireId === req.user.userId) {
            res.status(400).json({ success: false, error: 'Vous ne pouvez pas louer votre propre matériel' });
            return;
        }
        const nbJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
        const montantFcfa = nbJours * materiel.prixJour;
        const commission = Math.round(montantFcfa * COMMISSION_LOCATION);
        const location = await prisma_1.default.location.create({
            data: {
                materielId: materiel.id,
                locataireId: req.user.userId,
                dateDebut: debut,
                dateFin: fin,
                montantFcfa,
                commission,
                caution: materiel.caution,
            },
        });
        res.status(201).json({
            success: true,
            data: location,
            message: `Location créée — ${nbJours} jour(s) × ${materiel.prixJour} FCFA = ${montantFcfa} FCFA + caution ${materiel.caution} FCFA`,
        });
    }
    catch (err) {
        console.error('[materiel/louer]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la location' });
    }
};
exports.louerMateriel = louerMateriel;
//# sourceMappingURL=materiel.controller.js.map