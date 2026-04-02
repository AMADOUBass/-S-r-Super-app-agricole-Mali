// Démarrage du serveur Sɔrɔ
// Lance Express sur le port 5000 + démarre les cron jobs

import app from './app';
import { demarrerCronPrix } from './jobs/prix.cron';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Sɔrɔ API démarré sur le port ${PORT}`);
  console.log(`   http://localhost:${PORT}/health`);

  // Démarrer les tâches planifiées
  demarrerCronPrix();
  console.log('⏰ Cron jobs démarrés');
});
