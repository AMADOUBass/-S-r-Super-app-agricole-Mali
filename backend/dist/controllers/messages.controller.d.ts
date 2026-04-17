import { Response } from 'express';
import { AuthRequest } from '../types';
/**
 * POST /conversations
 * Démarre ou récupère une discussion pour un produit/animal/matériel spécifique
 */
export declare const demarrerConversation: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /conversations
 * Liste les discussions de l'utilisateur
 */
export declare const getMesConversations: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /conversations/:id
 * Messages d'une conversation
 */
export declare const getMessages: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /conversations/:id/messages
 * Envoyer un message
 */
export declare const envoyerMessage: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=messages.controller.d.ts.map