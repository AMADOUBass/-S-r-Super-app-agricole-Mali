import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const inscrire: (req: Request, res: Response) => Promise<void>;
export declare const verifierOtp: (req: Request, res: Response) => Promise<void>;
export declare const renvoyerOtp: (req: Request, res: Response) => Promise<void>;
export declare const connexionAdmin: (req: Request, res: Response) => Promise<void>;
export declare const modifierProfil: (req: AuthRequest, res: Response) => Promise<void>;
export declare const inscrireEmail: (req: Request, res: Response) => Promise<void>;
export declare const connexionEmail: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map