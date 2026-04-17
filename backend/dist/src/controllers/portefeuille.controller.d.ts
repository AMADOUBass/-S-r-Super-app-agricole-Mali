import { Response } from 'express';
import { AuthRequest } from '../types';
/**
 * GET /portefeuille
 * Récupère le solde et les 20 dernières transactions
 */
export declare const getPortefeuille: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /portefeuille/retrait
 * Initie une demande de retrait vers un numéro Orange Money / Wave
 */
export declare const demanderRetrait: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=portefeuille.controller.d.ts.map