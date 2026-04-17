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
const materiel_controller_1 = require("../controllers/materiel.controller");
const vitest_mock_extended_1 = require("vitest-mock-extended");
const prisma_1 = __importDefault(require("../lib/prisma"));
// ─── Mocks ──────────────────────────────────────────────────
vitest_1.vi.mock('../lib/prisma', async () => {
    const { mockDeep } = await Promise.resolve().then(() => __importStar(require('vitest-mock-extended')));
    return { default: mockDeep() };
});
const prismaMock = prisma_1.default;
(0, vitest_1.describe)('Materiel Controller - Tests critiques', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, vitest_mock_extended_1.mockReset)(prismaMock);
    });
    (0, vitest_1.describe)('louerMateriel (Gestion Cautions & 5%)', () => {
        (0, vitest_1.it)('doit bloquer des dates invalides', async () => {
            const req = {
                params: { id: 'm1' },
                body: { dateDebut: '2026-05-10T10:00:00Z', dateFin: '2026-05-09T10:00:00Z' }, // fin AVANT début
                user: { userId: 'locataire1' },
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn(),
            };
            await (0, materiel_controller_1.louerMateriel)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'La date de fin doit être après la date de début',
            });
        });
        (0, vitest_1.it)('doit calculer correctement le nombre de jours, la caution et la commission (5%)', async () => {
            prismaMock.materiel.findUnique.mockResolvedValue({
                id: 'm1',
                disponible: true,
                proprietaireId: 'prop1',
                prixJour: 10000,
                caution: 50000, // La caution escrow
            });
            // 5 jours de location
            const req = {
                params: { id: 'm1' },
                body: { dateDebut: '2026-05-01T00:00:00Z', dateFin: '2026-05-06T00:00:00Z' }, // 5 jours
                user: { userId: 'locataire1' },
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn(),
            };
            prismaMock.location.create.mockResolvedValue({ id: 'loc1' });
            await (0, materiel_controller_1.louerMateriel)(req, res);
            // 5 jours * 10 000 = 50 000 FCFA pour le montant total de location
            // Commission = 5% de 50 000 = 2500 FCFA
            (0, vitest_1.expect)(prismaMock.location.create).toHaveBeenCalledWith({
                data: {
                    materielId: 'm1',
                    locataireId: 'locataire1',
                    dateDebut: new Date('2026-05-01T00:00:00Z'),
                    dateFin: new Date('2026-05-06T00:00:00Z'),
                    montantFcfa: 50000,
                    commission: 2500, // Validé: Commission à 5% !
                    caution: 50000, // Validé: Gestion de la caution escrow depuis le matériel !
                },
            });
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
        });
    });
});
//# sourceMappingURL=materiel.controller.test.js.map