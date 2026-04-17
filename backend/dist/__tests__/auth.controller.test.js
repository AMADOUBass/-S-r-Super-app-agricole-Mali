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
const auth_controller_1 = require("../controllers/auth.controller");
const vitest_mock_extended_1 = require("vitest-mock-extended");
const prisma_1 = __importDefault(require("../lib/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ─── Mocks ──────────────────────────────────────────────────
vitest_1.vi.mock('../lib/prisma', async () => {
    const { mockDeep } = await Promise.resolve().then(() => __importStar(require('vitest-mock-extended')));
    return { default: mockDeep() };
});
vitest_1.vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vitest_1.vi.fn().mockReturnValue('mocked-jwt-token'),
    },
}));
vitest_1.vi.mock('../services/sms.service', () => ({
    envoyerSms: vitest_1.vi.fn(),
}));
const prismaMock = prisma_1.default;
(0, vitest_1.describe)('Auth Controller - Tests critiques', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, vitest_mock_extended_1.mockReset)(prismaMock);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('verifierOtp (Expiration JWT et contrôle de validité)', () => {
        (0, vitest_1.it)('doit rejeter un OTP introuvable ou expiré', async () => {
            // Prisma retourne null (soit parce qu'il n'existe pas, soit parce que expiresAt < NOW)
            prismaMock.otp.findFirst.mockResolvedValue(null);
            const req = {
                body: { telephone: '+22360000000', code: '123456' },
            };
            const res = {
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn(),
            };
            await (0, auth_controller_1.verifierOtp)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Code incorrect ou expiré',
            });
            (0, vitest_1.expect)(prismaMock.utilisateur.findUnique).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('doit valider l\'OTP, marquer comme utilisé et générer un JWT', async () => {
            prismaMock.otp.findFirst.mockResolvedValue({ id: 'otp1' });
            prismaMock.utilisateur.findUnique.mockResolvedValue({
                id: 'u1',
                telephone: '+22360000000',
                role: 'AGRICULTEUR',
                actif: true,
            });
            const req = {
                body: { telephone: '+22360000000', code: '123456' },
            };
            const res = {
                json: vitest_1.vi.fn(),
            };
            // On force la clé secrète sinon jwt sign pourrait planter
            process.env.JWT_SECRET = 'secret';
            process.env.JWT_EXPIRES_IN = '7d';
            await (0, auth_controller_1.verifierOtp)(req, res);
            (0, vitest_1.expect)(prismaMock.otp.update).toHaveBeenCalledWith({
                where: { id: 'otp1' },
                data: { utilise: true }, // Vérifie que l'OTP est "brûlé" après usage
            });
            (0, vitest_1.expect)(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: 'u1', telephone: '+22360000000', role: 'AGRICULTEUR' }, 'secret', { expiresIn: '7d' });
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                success: true,
                data: vitest_1.expect.objectContaining({
                    token: 'mocked-jwt-token',
                }),
            }));
        });
    });
});
//# sourceMappingURL=auth.controller.test.js.map