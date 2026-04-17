"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const commandes_controller_1 = require("../controllers/commandes.controller");
const vitest_mock_extended_1 = require("vitest-mock-extended");
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─── Mocks ──────────────────────────────────────────────────
vitest_1.vi.mock('../lib/prisma', async () => {
    const { mockDeep } = await Promise.resolve().then(() => __importStar(require('vitest-mock-extended')));
    return { default: mockDeep() };
});
vitest_1.vi.mock('../services/sms.service', () => ({
    envoyerSms: vitest_1.vi.fn(),
}));
const prismaMock = prisma_1.default;
(0, vitest_1.describe)('Commandes Controller - Tests critiques', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, vitest_mock_extended_1.mockReset)(prismaMock);
    });
    (0, vitest_1.describe)('creerCommande', () => {
        (0, vitest_1.it)('doit rejeter si le stock est insuffisant', async () => {
            prismaMock.produit.findUnique.mockResolvedValue({
                id: 'p1',
                disponible: true,
                agriculteurId: 'v1',
                quantiteKg: 5, // Seulement 5 kg dispo
                prixFcfa: 400,
                type: 'MIL'
            });
            const req = {
                body: { produitId: 'p1', quantiteKg: 10 },
                user: { userId: 'acheteurt1', role: 'ACHETEUR' },
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn(),
            };
            await (0, commandes_controller_1.creerCommande)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Stock insuffisant (5 kg disponibles)',
            });
            (0, vitest_1.expect)(prismaMock.commande.create).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('doit créer la commande et appliquer la commission de 3%', async () => {
            prismaMock.produit.findUnique.mockResolvedValue({
                id: 'p1',
                disponible: true,
                agriculteurId: 'vendeur1',
                quantiteKg: 100,
                prixFcfa: 500, // 500 * 10 = 5000 FCFA
                type: 'MIL',
                agriculteur: { telephone: '+22360000000' }
            });
            prismaMock.$transaction.mockResolvedValue([{ id: 'cmd1' }, {}]);
            const req = {
                body: { produitId: 'p1', quantiteKg: 10 },
                user: { userId: 'acheteur1', role: 'ACHETEUR' },
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn(),
            };
            await (0, commandes_controller_1.creerCommande)(req, res);
            // Calcul attendu : 10kg * 500 = 5000 FCFA
            // Commission acheteur = 3% de 5000 = 150 FCFA
            (0, vitest_1.expect)(prismaMock.commande.create).toHaveBeenCalledWith({
                data: {
                    produitId: 'p1',
                    quantiteKg: 10,
                    montantFcfa: 5000,
                    commission: 150, // Test validant la commission à 3% !
                    acheteurId: 'acheteur1',
                    vendeurId: 'vendeur1',
                },
            });
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'cmd1' } });
        });
    });
    (0, vitest_1.describe)('annulerCommande', () => {
        (0, vitest_1.it)('doit restaurer le stock du produit en cas d\'annulation', async () => {
            prismaMock.commande.findUnique.mockResolvedValue({
                id: 'cmd1',
                produitId: 'p1',
                quantiteKg: 20,
                acheteurId: 'acheteur1',
                vendeurId: 'vendeur1',
                statut: 'EN_ATTENTE'
            });
            prismaMock.$transaction.mockResolvedValue([{}, {}]);
            const req = {
                params: { id: 'cmd1' },
                user: { userId: 'acheteur1', role: 'ACHETEUR' },
            };
            const res = {
                json: vitest_1.vi.fn(),
            };
            await (0, commandes_controller_1.annulerCommande)(req, res);
            (0, vitest_1.expect)(prismaMock.produit.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: {
                    quantiteKg: { increment: 20 }, // Vérifie que les 20 kg sont remis
                    disponible: true,
                },
            });
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ success: true, message: 'Commande annulée' });
        });
    });
});
//# sourceMappingURL=commandes.controller.test.js.map