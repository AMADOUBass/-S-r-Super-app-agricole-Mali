// Middleware de validation des données entrantes avec Zod
// Retourne une erreur 400 lisible si la validation échoue

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const valider = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valide req.body et remplace par les données transformées (ex: trim, lowercase...)
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const erreurs = err.errors.map(e => ({
          champ: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          erreurs,
        });
        return;
      }
      next(err);
    }
  };
};
