"use strict";
// Routes météo — proxy vers Open-Meteo API (gratuite, sans clé)
// GET /meteo/:commune → prévisions 7 jours pour une commune malienne
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meteo_controller_1 = require("../controllers/meteo.controller");
const router = (0, express_1.Router)();
router.get('/:commune', meteo_controller_1.getMeteo);
exports.default = router;
//# sourceMappingURL=meteo.routes.js.map