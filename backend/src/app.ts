// Point d'entrée principal de l'application Express
// Configure les middlewares globaux et monte toutes les routes

import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth.routes';
import produitsRoutes from './routes/produits.routes';
import commandesRoutes from './routes/commandes.routes';
import materielRoutes from './routes/materiel.routes';
import elevageRoutes from './routes/elevage.routes';
import prixRoutes from './routes/prix.routes';
import meteoRoutes from './routes/meteo.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ─── Middlewares de sécurité ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.startsWith('http://localhost') ||
      origin === process.env.FRONTEND_URL ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
}));

// ─── Parsing et logging ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes API ───────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/produits', produitsRoutes);
app.use('/commandes', commandesRoutes);
app.use('/materiel', materielRoutes);
app.use('/elevage', elevageRoutes);
app.use('/prix', prixRoutes);
app.use('/meteo', meteoRoutes);
app.use('/admin', adminRoutes);

// ─── Santé du serveur ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Sɔrɔ API', version: '1.0.0' });
});

// ─── Gestion des routes inconnues ────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable' });
});

// ─── Gestion globale des erreurs ─────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

export default app;
