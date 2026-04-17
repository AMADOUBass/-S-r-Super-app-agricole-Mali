import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const listerMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const creerMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const modifierMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerMateriel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const louerMateriel: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=materiel.controller.d.ts.map