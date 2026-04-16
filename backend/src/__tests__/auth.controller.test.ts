import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifierOtp } from '../controllers/auth.controller';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return { default: mockDeep() };
});
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
  },
}));
vi.mock('../services/sms.service', () => ({
  envoyerSms: vi.fn(),
}));

const prismaMock = prisma as any;

describe('Auth Controller - Tests critiques', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  describe('verifierOtp (Expiration JWT et contrôle de validité)', () => {
    it('doit rejeter un OTP introuvable ou expiré', async () => {
      // Prisma retourne null (soit parce qu'il n'existe pas, soit parce que expiresAt < NOW)
      prismaMock.otp.findFirst.mockResolvedValue(null);

      const req = {
        body: { telephone: '+22360000000', code: '123456' },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await verifierOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Code incorrect ou expiré',
      });
      expect(prismaMock.utilisateur.findUnique).not.toHaveBeenCalled();
    });

    it('doit valider l\'OTP, marquer comme utilisé et générer un JWT', async () => {
      prismaMock.otp.findFirst.mockResolvedValue({ id: 'otp1' });
      prismaMock.utilisateur.findUnique.mockResolvedValue({
        id: 'u1',
        telephone: '+22360000000',
        role: 'AGRICULTEUR',
        actif: true,
      });

      const req = {
        body: { telephone: '+22360000000', code: '123456' },
      } as any;

      const res = {
        json: vi.fn(),
      } as any;

      // On force la clé secrète sinon jwt sign pourrait planter
      process.env.JWT_SECRET = 'secret';
      process.env.JWT_EXPIRES_IN = '7d';

      await verifierOtp(req, res);

      expect(prismaMock.otp.update).toHaveBeenCalledWith({
        where: { id: 'otp1' },
        data: { utilise: true }, // Vérifie que l'OTP est "brûlé" après usage
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'u1', telephone: '+22360000000', role: 'AGRICULTEUR' },
        'secret',
        { expiresIn: '7d' }
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'mocked-jwt-token',
          }),
        })
      );
    });
  });
});
