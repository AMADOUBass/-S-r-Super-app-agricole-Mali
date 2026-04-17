import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const listerProduits: (req: Request, res: Response) => Promise<void>;
export declare const getMesAnnonces: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProduit: (req: Request, res: Response) => Promise<void>;
export declare const creerProduit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const modifierProduit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerProduit: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=produits.controller.d.ts.map