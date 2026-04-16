// Lance Prisma Studio avec DIRECT_URL (Studio ne supporte pas Prisma Accelerate)
require('dotenv').config();
const { execSync } = require('child_process');

const url = process.env.DIRECT_URL;
if (!url) {
  console.error('❌ DIRECT_URL manquant dans .env');
  process.exit(1);
}

console.log('🔍 Ouverture de Prisma Studio sur http://localhost:5555');
execSync(`npx prisma studio --url "${url}"`, { stdio: 'inherit' });
