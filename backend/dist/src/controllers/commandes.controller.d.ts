import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const creerCommande: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMesCommandes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getStatutCommande: (req: AuthRequest, res: Response) => Promise<void>;
export declare const payerCommande: (req: AuthRequest, res: Response) => Promise<void>;
export declare const preparerCommande: (req: AuthRequest, res: Response) => Promise<void>;
export declare const confirmerLivraison: (req: AuthRequest, res: Response) => Promise<void>;
export declare const annulerCommande: (req: AuthRequest, res: Response) => Promise<void>;
export declare const webhookFlutterwave: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=commandes.controller.d.ts.map