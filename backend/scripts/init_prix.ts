import { mettreAJourPrixDuJour } from '../src/jobs/prix.cron';
import prisma from '../src/lib/prisma';

async function run() {
  console.log('🚀 Démarrage manuel de la mise à jour des prix (TS)...');
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
