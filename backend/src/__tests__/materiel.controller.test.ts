import { describe, it, expect, vi, beforeEach } from 'vitest';
import { louerMateriel } from '../controllers/materiel.controller';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import prisma from '../lib/prisma';

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return { default: mockDeep() };
});

const prismaMock = prisma as any;

describe('Materiel Controller - Tests critiques', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('louerMateriel (Gestion Cautions & 5%)', () => {
    it('doit bloquer des dates invalides', async () => {
      const req = {
        params: { id: 'm1' },
        body: { dateDebut: '2026-05-10T10:00:00Z', dateFin: '2026-05-09T10:00:00Z' }, // fin AVANT début
        user: { userId: 'locataire1' },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await louerMateriel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'La date de fin doit être après la date de début',
      });
    });

    it('doit calculer correctement le nombre de jours, la caution et la commission (5%)', async () => {
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
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      prismaMock.location.create.mockResolvedValue({ id: 'loc1' });

      await louerMateriel(req, res);

      // 5 jours * 10 000 = 50 000 FCFA pour le montant total de location
      // Commission = 5% de 50 000 = 2500 FCFA
      expect(prismaMock.location.create).toHaveBeenCalledWith({
        data: {
          materielId: 'm1',
          locataireId: 'locataire1',
          dateDebut: new Date('2026-05-01T00:00:00Z'),
          dateFin: new Date('2026-05-06T00:00:00Z'),
          montantFcfa: 50000,
          commission: 2500, // Validé: Commission à 5% !
          caution: 50000,   // Validé: Gestion de la caution escrow depuis le matériel !
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
