"use strict";
// Middleware d'authentification JWT
// Vérifie le token Bearer dans le header Authorization et injecte l'utilisateur dans req.user
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoriser = exports.authentifier = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const authentifier = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Token manquant — veuillez vous connecter' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // L'admin n'a pas de ligne en base — on skip la vérification actif
        if (payload.userId !== 'admin') {
            const user = await prisma_1.default.utilisateur.findUnique({
                where: { id: payload.userId },
                select: { actif: true },
            });
            if (!user || !user.actif) {
                res.status(403).json({ success: false, error: 'Compte suspendu ou introuvable' });
                return;
            }
        }
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
    }
};
exports.authentifier = authentifier;
// Middleware pour vérifier qu'un utilisateur a le rôle requis
const autoriser = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Non authentifié' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Accès refusé — rôle insuffisant' });
            return;
        }
        next();
    };
};
exports.autoriser = autoriser;
//# sourceMappingURL=auth.middleware.js.map