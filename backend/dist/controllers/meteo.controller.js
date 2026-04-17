"use strict";
// Contrôleur météo — proxy vers Open-Meteo (API gratuite, sans clé)
// Traduit le nom de commune malienne en coordonnées GPS puis appelle Open-Meteo
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeteo = void 0;
const meteo_service_1 = require("../services/meteo.service");
// ─────────────────────────────────────────────────────────────
// GET /meteo/:commune
// ─────────────────────────────────────────────────────────────
const getMeteo = async (req, res) => {
    try {
        const commune = decodeURIComponent(req.params.commune);
        const meteo = await (0, meteo_service_1.getMeteoParCommune)(commune);
        res.json({ success: true, data: meteo });
    }
    catch (err) {
        console.error('[meteo]', err);
        res.status(500).json({ success: false, error: 'Impossible de récupérer la météo' });
    }
};
exports.getMeteo = getMeteo;
//# sourceMappingURL=meteo.controller.js.map