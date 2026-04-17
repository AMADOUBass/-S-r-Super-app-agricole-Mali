import { PrismaClient, Region, TypeProduit, TypeMateriel, TypeAnimal } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Use DIRECT_URL for seeding to bypass Accelerate proxy issues
process.env.DATABASE_URL = process.env.DIRECT_URL;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Master Seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  console.log('👤 Creating Users...');
  const users = await Promise.all([
    prisma.utilisateur.upsert({
      where: { email: 'admin@soro.ml' },
      update: {},
      create: {
        email: 'admin@soro.ml',
        passwordHash,
        nom: 'Admin Sɔrô',
        role: 'ADMIN',
        region: Region.BAMAKO,
        commune: 'Bamako',
        actif: true,
      },
    }),
    prisma.utilisateur.upsert({
      where: { telephone: '+22360000001' },
      update: {},
      create: {
        telephone: '+22360000001',
        nom: 'Mamadou Kayes',
        role: 'AGRICULTEUR',
        region: Region.KAYES,
        commune: 'Diboli',
        actif: true,
      },
    }),
    prisma.utilisateur.upsert({
      where: { telephone: '+22360000002' },
      update: {},
      create: {
        telephone: '+22360000002',
        nom: 'Bakary Sikasso',
        role: 'AGRICULTEUR',
        region: Region.SIKASSO,
        commune: 'Sikasso',
        actif: true,
      },
    }),
  ]);

  const [admin, farmer1, farmer2] = users;

  // 2. Create Products
  console.log('📦 Creating Products...');
  await prisma.produit.createMany({
    data: [
      {
        type: TypeProduit.MIL,
        quantiteKg: 5000,
        prixFcfa: 250,
        description: 'Mil de qualité supérieure récolté dans la région de Ségou.',
        photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800',
        agriculteurId: farmer1.id,
        region: Region.SEGOU,
        commune: 'Ségou',
      },
      {
        type: TypeProduit.OIGNON,
        quantiteKg: 800,
        prixFcfa: 450,
        description: 'Oignons frais et croquants de Sikasso.',
        photoUrl: 'https://images.unsplash.com/photo-1508747703725-7197771375a0?q=80&w=800',
        agriculteurId: farmer2.id,
        region: Region.SIKASSO,
        commune: 'Sikasso',
      },
      {
        type: TypeProduit.MAIS,
        quantiteKg: 2000,
        prixFcfa: 180,
        description: 'Maïs jaune pour consommation humaine ou bétail.',
        photoUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800',
        agriculteurId: farmer1.id,
        region: Region.KAYES,
        commune: 'Diboli',
      },
    ],
  });

  // 3. Create Animals
  console.log('🐄 Creating Animals (Livestock)...');
  await prisma.animal.createMany({
    data: [
      {
        type: TypeAnimal.MOUTON,
        race: 'Sahel',
        description: 'Bélier du Sahel robuste, parfait pour l\'élevage ou la fête.',
        prixFcfa: 125000,
        age: 24,
        poidsKg: 55,
        photoUrl: 'https://images.unsplash.com/photo-1484557918186-7b4e571d4b12?q=80&w=800',
        vendeurId: farmer1.id,
        region: Region.KAYES,
        commune: 'Diboli',
      },
      {
        type: TypeAnimal.BOEUF,
        race: 'Zébu Peul',
        description: 'Jeune zébu en excellente santé.',
        prixFcfa: 350000,
        age: 36,
        poidsKg: 180,
        photoUrl: 'https://images.unsplash.com/photo-1543161351-7871b65e90fc?q=80&w=800',
        vendeurId: farmer2.id,
        region: Region.SIKASSO,
        commune: 'Sikasso',
      },
    ],
  });

  // 4. Create Equipment
  console.log('🚜 Creating Equipment (Materiel)...');
  await prisma.materiel.createMany({
    data: [
      {
        type: TypeMateriel.TRACTEUR,
        description: 'Tracteur Massey Ferguson robuste disponible pour location journalière.',
        prixJour: 75000,
        caution: 250000,
        photoUrl: 'https://images.unsplash.com/photo-1594411133504-7493414925d1?q=80&w=800',
        proprietaireId: admin.id,
        region: Region.BAMAKO,
        commune: 'Bamako',
      },
      {
        type: TypeMateriel.MOTOPOMPE,
        description: 'Motopompe Honda 3 pouces pour irrigation.',
        prixJour: 15000,
        caution: 50000,
        photoUrl: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=800',
        proprietaireId: farmer1.id,
        region: Region.KAYES,
        commune: 'Diboli',
      },
    ],
  });

  console.log('✅ Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
