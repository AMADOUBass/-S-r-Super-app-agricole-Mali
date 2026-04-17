const { mettreAJourPrixDuJour } = require('../src/jobs/prix.cron');
const prisma = require('../src/lib/prisma').default;

async function run() {
  console.log('🚀 Démarrage manuel de la mise à jour des prix...');
  try {
    await mettreAJourPrixDuJour();
    console.log('✅ Mise à jour des prix terminée avec succès.');
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour des prix :', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
