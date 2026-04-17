"use strict";
// Point d'entrée principal de l'application Express
// Configure les middlewares globaux et monte toutes les routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const produits_routes_1 = __importDefault(require("./routes/produits.routes"));
const commandes_routes_1 = __importDefault(require("./routes/commandes.routes"));
const materiel_routes_1 = __importDefault(require("./routes/materiel.routes"));
const elevage_routes_1 = __importDefault(require("./routes/elevage.routes"));
const prix_routes_1 = __importDefault(require("./routes/prix.routes"));
const meteo_routes_1 = __importDefault(require("./routes/meteo.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const portefeuille_routes_1 = __importDefault(require("./routes/portefeuille.routes"));
const messages_routes_1 = __importDefault(require("./routes/messages.routes"));
const avis_routes_1 = __importDefault(require("./routes/avis.routes"));
const app = (0, express_1.default)();
// Nécessaire pour Railway/Proxies afin de récupérer la vraie IP du client
app.set('trust proxy', 1);
// ─── Middlewares de sécurité ──────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin ||
            origin.startsWith('http://localhost') ||
            origin === process.env.FRONTEND_URL ||
            origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
}));
// ─── Parsing et logging ───────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// ─── Routes API ───────────────────────────────────────────────
app.use('/auth', auth_routes_1.default);
app.use('/produits', produits_routes_1.default);
app.use('/commandes', commandes_routes_1.default);
app.use('/materiel', materiel_routes_1.default);
app.use('/elevage', elevage_routes_1.default);
app.use('/prix', prix_routes_1.default);
app.use('/meteo', meteo_routes_1.default);
app.use('/admin', admin_routes_1.default);
app.use('/portefeuille', portefeuille_routes_1.default);
app.use('/conversations', messages_routes_1.default);
app.use('/avis', avis_routes_1.default);
// ─── Santé du serveur ─────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Sɔrɔ API', version: '1.0.0' });
});
// ─── Gestion des routes inconnues ────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route introuvable' });
});
// ─── Gestion globale des erreurs ─────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});
exports.default = app;
//# sourceMappingURL=app.js.map