import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📸 Taking snapshot of Utilisateurs...');
  const users = await prisma.utilisateur.findMany();
  fs.writeFileSync(
    path.join(__dirname, 'snapshot_users.json'),
    JSON.stringify(users, null, 2)
  );
  console.log(`✅ Snapshot saved: ${users.length} users.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
