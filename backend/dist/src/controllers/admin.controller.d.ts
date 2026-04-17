import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getStats: (_req: AuthRequest, res: Response) => Promise<void>;
export declare const listerAnnonces: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerAnnonce: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleAnnonce: (req: AuthRequest, res: Response) => Promise<void>;
export declare const listerCommandes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const listerUtilisateurs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleUtilisateur: (req: AuthRequest, res: Response) => Promise<void>;
export declare const listerMaterielAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const listerAnimauxAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerAnimal: (req: AuthRequest, res: Response) => Promise<void>;
export declare const listerRetraits: (req: AuthRequest, res: Response) => Promise<void>;
export declare const traiterRetrait: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map