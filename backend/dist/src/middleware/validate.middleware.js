"use strict";
// Middleware de validation des données entrantes avec Zod
// Retourne une erreur 400 lisible si la validation échoue
Object.defineProperty(exports, "__esModule", { value: true });
exports.valider = void 0;
const zod_1 = require("zod");
const valider = (schema) => {
    return (req, res, next) => {
        try {
            // Valide req.body et remplace par les données transformées (ex: trim, lowercase...)
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
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
exports.valider = valider;
//# sourceMappingURL=validate.middleware.js.map