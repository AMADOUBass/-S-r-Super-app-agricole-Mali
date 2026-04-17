"use strict";
// Cron job — exécuté chaque matin à 7h00 (heure de Bamako)
// 1. Met à jour les prix du marché (variation quotidienne ±5%)
// 2. Envoie un SMS récapitulatif aux agriculteurs inscrits
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demarrerCronPrix = exports.mettreAJourPrixDuJour = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const sms_service_1 = require("../services/sms.service");
// ─── Prix de base OMA Mali (FCFA/kg) ─────────────────────────
// Source : Observatoire du Marché Agricole Mali, bulletins 2025-2026
// Mis à jour manuellement si un bulletin OMA plus récent est disponible
const PRIX_BASE = {
    MIL: 320,
    SORGHO: 290,
    MAIS: 230,
    RIZ: 575,
    ARACHIDE: 600,
    NIEBE: 450,
    SESAME: 800,
    COTON: 275,
    MANGUE: 150,
    OIGNON: 200,
    TOMATE: 180,
    KARITE: 500,
    GOMBO: 250,
    PATATE_DOUCE: 175,
    IGNAME: 220,
};
// Coefficients régionaux (transport + disponibilité locale)
const COEFF = {
    BAMAKO: 1.00,
    KOULIKORO: 0.95,
    SIKASSO: 0.88, // zone de production
    SEGOU: 0.93,
    KAYES: 0.92,
    MOPTI: 1.12, // enclavé + insécurité
    TOMBOUCTOU: 1.28,
    GAO: 1.22,
    KIDAL: 1.40, // zone de conflit
    MENAKA: 1.35,
    TAOUDENIT: 1.45,
};
// Produits disponibles par région
const PRODUITS_PAR_REGION = {
    BAMAKO: ['MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'SESAME'],
    SIKASSO: ['MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'MANGUE', 'OIGNON', 'TOMATE', 'KARITE', 'IGNAME', 'PATATE_DOUCE'],
    SEGOU: ['MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'OIGNON', 'KARITE', 'COTON'],
    KAYES: ['MIL', 'SORGHO', 'ARACHIDE', 'NIEBE', 'SESAME', 'KARITE', 'MANGUE'],
    KOULIKORO: ['MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 'NIEBE', 'OIGNON', 'KARITE'],
    MOPTI: ['MIL', 'SORGHO', 'RIZ', 'NIEBE', 'OIGNON'],
    TOMBOUCTOU: ['MIL', 'SORGHO', 'RIZ', 'NIEBE'],
    GAO: ['MIL', 'SORGHO', 'RIZ', 'NIEBE', 'OIGNON'],
    KIDAL: ['MIL', 'SORGHO'],
    MENAKA: ['MIL', 'SORGHO', 'NIEBE'],
    TAOUDENIT: ['MIL', 'SORGHO'],
};
// ─────────────────────────────────────────────────────────────
// Met à jour les prix du jour avec une variation ±5%
// ─────────────────────────────────────────────────────────────
const mettreAJourPrixDuJour = async () => {
    console.log('[CRON] Mise à jour intelligente des prix du marché...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 1. Récupérer les moyennes de prix réelles sur le terrain (table produits)
    const moyennesTerrain = await prisma_1.default.produit.groupBy({
        by: ['region', 'type'],
        _avg: { prixFcfa: true },
    });
    const terrainMap = {};
    moyennesTerrain.forEach((m) => {
        if (m._avg.prixFcfa) {
            terrainMap[`${m.region}__${m.type}`] = m._avg.prixFcfa;
        }
    });
    // 2. Récupérer les prix d'hier pour la continuité
    const hier = new Date(today);
    hier.setDate(hier.getDate() - 1);
    const prixHier = await prisma_1.default.prixMarche.findMany({
        where: { date: { gte: hier, lt: today } },
    });
    const prixHierMap = {};
    prixHier.forEach((p) => {
        prixHierMap[`${p.region}__${p.produit}`] = p.prixKg;
    });
    let total = 0;
    for (const [region, produits] of Object.entries(PRODUITS_PAR_REGION)) {
        const coeff = COEFF[region] ?? 1.0;
        for (const produit of produits) {
            const baseOMA = PRIX_BASE[produit];
            if (!baseOMA)
                continue;
            const prixRefOMA = Math.round(baseOMA * coeff);
            const prixTerrain = terrainMap[`${region}__${produit}`];
            // LOGIQUE HYBRIDE : 
            // Si on a des prix sur le terrain, on pondère : 70% OMA / 30% Terrain
            // Sinon, on suit la tendance OMA ± variation aléatoire
            let prixCible;
            if (prixTerrain) {
                prixCible = Math.round((prixRefOMA * 0.7) + (prixTerrain * 0.3));
            }
            else {
                const prixReference = prixHierMap[`${region}__${produit}`] ?? prixRefOMA;
                const variation = 1 + (Math.random() * 0.10 - 0.05); // ±5%
                prixCible = Math.round(prixReference * variation);
            }
            // Garde le prix dans une fourchette ±20% du prix de référence OMA (sécurité)
            const prixMin = Math.round(prixRefOMA * 0.80);
            const prixMax = Math.round(prixRefOMA * 1.20);
            const prixFinal = Math.min(prixMax, Math.max(prixMin, Math.round(prixCible / 5) * 5));
            try {
                await prisma_1.default.prixMarche.upsert({
                    where: {
                        produit_region_date: {
                            produit: produit,
                            region: region,
                            date: today,
                        },
                    },
                    create: {
                        produit: produit,
                        region: region,
                        prixKg: prixFinal,
                        source: prixTerrain ? 'Sɔrô Intelligence (Hybride)' : 'Cron OMA Mali',
                        date: today,
                    },
                    update: {
                        prixKg: prixFinal,
                        source: prixTerrain ? 'Sɔrô Intelligence (Hybride)' : 'Cron OMA Mali'
                    },
                });
                total++;
            }
            catch (err) {
                console.error(`[CRON] Erreur prix ${region}/${produit}:`, err);
            }
        }
    }
    console.log(`[CRON] ${total} prix du marché synchronisés (Offre/Demande OK)`);
};
exports.mettreAJourPrixDuJour = mettreAJourPrixDuJour;
// ─────────────────────────────────────────────────────────────
// Envoie les SMS prix du matin aux agriculteurs
// ─────────────────────────────────────────────────────────────
const formaterPrixPourSms = (prix) => {
    const traductions = {
        MIL: 'Mil', SORGHO: 'Sorgho', MAIS: 'Maïs', RIZ: 'Riz',
        ARACHIDE: 'Arachide', NIEBE: 'Niébé', SESAME: 'Sésame',
        MANGUE: 'Mangue', OIGNON: 'Oignon', TOMATE: 'Tomate',
        KARITE: 'Karité', COTON: 'Coton',
    };
    return prix
        .slice(0, 5)
        .map(p => `${traductions[p.produit] || p.produit}: ${p.prixKg} F/kg`)
        .join('\n');
};
const envoyerPrixDuMatin = async () => {
    console.log('[CRON] Envoi SMS prix du matin...');
    try {
        const agriculteurs = await prisma_1.default.utilisateur.findMany({
            where: { role: 'AGRICULTEUR', actif: true },
            select: { telephone: true, region: true },
        });
        const parRegion = {};
        for (const user of agriculteurs) {
            if (!parRegion[user.region])
                parRegion[user.region] = [];
            parRegion[user.region].push(user.telephone);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const [region, telephones] of Object.entries(parRegion)) {
            const prix = await prisma_1.default.prixMarche.findMany({
                where: { region: region, date: { gte: today } },
                orderBy: { produit: 'asc' },
                take: 10,
            });
            if (prix.length === 0) {
                console.log(`[CRON] Pas de prix pour ${region}, SMS non envoyé`);
                continue;
            }
            const resume = formaterPrixPourSms(prix);
            await (0, sms_service_1.envoyerSMSPrixMatin)(telephones, region, resume);
            console.log(`[CRON] SMS envoyé à ${telephones.length} agriculteurs en ${region}`);
        }
        console.log('[CRON] Envoi SMS terminé');
    }
    catch (err) {
        console.error('[CRON] Erreur SMS prix:', err);
    }
};
// ─────────────────────────────────────────────────────────────
// Tâche principale : mise à jour prix + SMS
// Tous les jours à 6h45 Bamako : mise à jour prix
// Tous les jours à 7h00 Bamako : envoi SMS
// ─────────────────────────────────────────────────────────────
const demarrerCronPrix = () => {
    // 6h45 : mettre à jour les prix du jour
    node_cron_1.default.schedule('45 6 * * *', exports.mettreAJourPrixDuJour, {
        timezone: 'Africa/Bamako',
    });
    // 7h00 : envoyer les SMS avec les nouveaux prix
    node_cron_1.default.schedule('0 7 * * *', envoyerPrixDuMatin, {
        timezone: 'Africa/Bamako',
    });
    console.log('[CRON] Jobs prix planifiés — 6h45 mise à jour, 7h00 SMS (heure Bamako)');
};
exports.demarrerCronPrix = demarrerCronPrix;
//# sourceMappingURL=prix.cron.js.map