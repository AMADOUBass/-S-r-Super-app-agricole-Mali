// Routes météo — proxy vers Open-Meteo API (gratuite, sans clé)
// GET /meteo/:commune → prévisions 7 jours pour une commune malienne

import { Router } from 'express';
import { getMeteo } from '../controllers/meteo.controller';

const router = Router();

router.get('/:commune', getMeteo);

export default router;
