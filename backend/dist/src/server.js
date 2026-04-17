"use strict";
// Démarrage du serveur Sɔrɔ
// Lance Express sur le port 5000 + démarre les cron jobs
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prix_cron_1 = require("./jobs/prix.cron");
const PORT = process.env.PORT || 5000;
app_1.default.listen(PORT, () => {
    console.log(`✅ Sɔrɔ API démarré sur le port ${PORT}`);
    console.log(`   http://localhost:${PORT}/health`);
    // Démarrer les tâches planifiées
    (0, prix_cron_1.demarrerCronPrix)();
    console.log('⏰ Cron jobs démarrés');
});
//# sourceMappingURL=server.js.map