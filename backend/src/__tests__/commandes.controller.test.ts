import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creerCommande, annulerCommande } from '../controllers/commandes.controller';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import prisma from '../lib/prisma';

// ─── Mocks ──────────────────────────────────────────────────
vi.mock('../lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return { default: mockDeep() };
});
vi.mock('../services/sms.service', () => ({
  envoyerSms: vi.fn(),
}));

const prismaMock = prisma as any;

describe('Commandes Controller - Tests critiques', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('creerCommande', () => {
    it('doit rejeter si le stock est insuffisant', async () => {
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
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await creerCommande(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Stock insuffisant (5 kg disponibles)',
      });
      expect(prismaMock.commande.create).not.toHaveBeenCalled();
    });

    it('doit créer la commande et appliquer la commission de 3%', async () => {
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
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await creerCommande(req, res);

      // Calcul attendu : 10kg * 500 = 5000 FCFA
      // Commission acheteur = 3% de 5000 = 150 FCFA
      expect(prismaMock.commande.create).toHaveBeenCalledWith({
        data: {
          produitId: 'p1',
          quantiteKg: 10,
          montantFcfa: 5000,
          commission: 150, // Test validant la commission à 3% !
          acheteurId: 'acheteur1',
          vendeurId: 'vendeur1',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'cmd1' } });
    });
  });

  describe('annulerCommande', () => {
    it('doit restaurer le stock du produit en cas d\'annulation', async () => {
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
      } as any;

      const res = {
        json: vi.fn(),
      } as any;

      await annulerCommande(req, res);

      expect(prismaMock.produit.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          quantiteKg: { increment: 20 }, // Vérifie que les 20 kg sont remis
          disponible: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Commande annulée' });
    });
  });
});
