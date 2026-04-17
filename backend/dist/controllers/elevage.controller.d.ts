import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const listerAnimaux: (req: Request, res: Response) => Promise<void>;
export declare const getAnimal: (req: Request, res: Response) => Promise<void>;
export declare const creerAnimal: (req: AuthRequest, res: Response) => Promise<void>;
export declare const modifierAnimal: (req: AuthRequest, res: Response) => Promise<void>;
export declare const supprimerAnimal: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=elevage.controller.d.ts.map