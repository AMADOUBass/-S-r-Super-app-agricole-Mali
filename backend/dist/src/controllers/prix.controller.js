"use strict";
// Contrôleur des prix du marché
// Retourne les prix du jour et l'historique par produit et région
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mettreAJourPrix = exports.getHistoriquePrix = exports.getPrixDuJour = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─────────────────────────────────────────────────────────────
// GET /prix — prix du jour
// ─────────────────────────────────────────────────────────────
const getPrixDuJour = async (req, res) => {
    try {
        const { produit, region } = req.query;
        const debutJournee = new Date();
        debutJournee.setHours(0, 0, 0, 0);
        const where = { date: { gte: debutJournee } };
        if (produit)
            where.produit = produit;
        if (region)
            where.region = region;
        // Récupérer les prix les plus récents par produit
        // On récupère tout sur la période, puis on filtre en JS pour être sûr d'avoir le dernier de chaque
        const prixData = await prisma_1.default.prixMarche.findMany({
            where,
            orderBy: { date: 'desc' },
        });
        // Fallback si rien aujourd'hui
        let finalPrix = prixData;
        if (finalPrix.length === 0) {
            const semaineDerniere = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            finalPrix = await prisma_1.default.prixMarche.findMany({
                where: { ...where, date: { gte: semaineDerniere } },
                orderBy: { date: 'desc' },
            });
        }
        // Filtrage pour ne garder que le dernier prix par produit unique
        const uniqueMap = new Map();
        finalPrix.forEach((p) => {
            if (!uniqueMap.has(p.produit)) {
                uniqueMap.set(p.produit, p);
            }
        });
        res.json({ success: true, data: Array.from(uniqueMap.values()) });
    }
    catch (err) {
        console.error('[prix/jour]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des prix' });
    }
};
exports.getPrixDuJour = getPrixDuJour;
// ─────────────────────────────────────────────────────────────
// GET /prix/historique — 30 derniers jours
// ─────────────────────────────────────────────────────────────
const getHistoriquePrix = async (req, res) => {
    try {
        const { produit, region } = req.query;
        if (!produit || !region) {
            res.status(400).json({ success: false, error: 'Paramètres produit et region requis' });
            return;
        }
        const il_y_a_30_jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const historique = await prisma_1.default.prixMarche.findMany({
            where: {
                produit: produit,
                region: region,
                date: { gte: il_y_a_30_jours },
            },
            orderBy: { date: 'asc' },
        });
        res.json({ success: true, data: historique });
    }
    catch (err) {
        console.error('[prix/historique]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
};
exports.getHistoriquePrix = getHistoriquePrix;
// ─────────────────────────────────────────────────────────────
// POST /prix — mise à jour manuelle (admin ou cron)
// ─────────────────────────────────────────────────────────────
const mettreAJourPrix = async (req, res) => {
    try {
        const { produit, region, prixKg, source } = req.body;
        const prix = await prisma_1.default.prixMarche.upsert({
            where: {
                produit_region_date: {
                    produit,
                    region,
                    date: new Date(new Date().toDateString()), // date du jour sans l'heure
                },
            },
            create: { produit, region, prixKg, source },
            update: { prixKg, source },
        });
        res.json({ success: true, data: prix });
    }
    catch (err) {
        console.error('[prix/maj]', err);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
};
exports.mettreAJourPrix = mettreAJourPrix;
//# sourceMappingURL=prix.controller.js.map