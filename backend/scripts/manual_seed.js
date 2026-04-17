const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

async function seed() {
  const client = new Client({
    connectionString: "postgres://2d007d1bc7ab331119a65a62a27047d67834b5bc73ccea50a0b0c6dd71080278:sk_WJnn8XYceAWhjl1osRSAk@db.prisma.io:5432/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📡 Connected to database... Cleaning tables for Seed 5.0...');

    // Nettoyage complet
    await client.query('DELETE FROM avis;');
    await client.query('DELETE FROM locations;');
    await client.query('DELETE FROM animaux;');
    await client.query('DELETE FROM materiels;');
    await client.query('DELETE FROM produits;');
    await client.query('DELETE FROM otps;');
    await client.query('DELETE FROM portefeuilles;');
    await client.query('DELETE FROM utilisateurs;');

    const adminHash = await bcrypt.hash('SoroAdmin2026!', 10);

    console.log('👤 Creating 5 Authentic Malian Users...');
    
    // 1. Users
    await client.query(`
      INSERT INTO utilisateurs (id, nom, role, region, commune, email, "passwordHash", actif, "updatedAt")
      VALUES 
        ('id-admin', 'Moussa Traoré', 'ADMIN', 'BAMAKO', 'ACI 2000', 'admin@soro.ml', $1, true, NOW()),
        ('id-fatoumata', 'Fatoumata Diallo', 'AGRICULTEUR', 'SEGOU', 'Ségou Centre', NULL, NULL, true, NOW()),
        ('id-amadou', 'Amadou Maïga', 'AGRICULTEUR', 'MOPTI', 'Mopti Port', NULL, NULL, true, NOW()),
        ('id-mariam', 'Mariam Keïta', 'AGRICULTEUR', 'SIKASSO', 'Koutiala', NULL, NULL, true, NOW()),
        ('id-oumar', 'Oumar Sidibé', 'AGRICULTEUR', 'KAYES', 'Kita', NULL, NULL, true, NOW())
    `, [adminHash]);

    // Update phones
    await client.query(`
      UPDATE utilisateurs SET telephone = '+22360000001' WHERE id = 'id-fatoumata';
      UPDATE utilisateurs SET telephone = '+22360000002' WHERE id = 'id-amadou';
      UPDATE utilisateurs SET telephone = '+22360000003' WHERE id = 'id-mariam';
      UPDATE utilisateurs SET telephone = '+22360000004' WHERE id = 'id-oumar';
      UPDATE utilisateurs SET telephone = '+22360000005' WHERE id = 'id-admin';
    `);

    console.log('📦 Creating 5 Products (Market)...');
    
    const baseUrl = "/images/seed/";
    
    // 5 PRODUITS
    await client.query(`
      INSERT INTO produits (id, type, "quantiteKg", "prixFcfa", description, "photoUrl", "agriculteurId", region, commune, "updatedAt")
      VALUES 
        ('p1', 'MIL', 5000, 250, 'Mil de Ségou premium, récolté à la main et séché au soleil.', '${baseUrl}soro_sac_mil_segou_1776393626428.png', 'id-fatoumata', 'SEGOU', 'Ségou Centre', NOW()),
        ('p2', 'RIZ', 3000, 450, 'Riz Gambiaka authentique de Ségou. Grain long et riche.', '${baseUrl}soro_riz_marigot_1776393670400.png', 'id-fatoumata', 'SEGOU', 'Ségou Centre', NOW()),
        ('p3', 'OIGNON', 1200, 500, 'Oignons violets de Sikasso, récolte fraîche de la semaine.', '${baseUrl}soro_oignon_sikasso_1776393657896.png', 'id-mariam', 'SIKASSO', 'Koutiala', NOW()),
        ('p4', 'ARACHIDE', 800, 750, 'Arachides décortiquées de Kita, idéales pour l''exportation.', '${baseUrl}seed_arachide_1776394320497.png', 'id-oumar', 'KAYES', 'Kita', NOW()),
        ('p5', 'MAIS', 1500, 200, 'Maïs rouge séléctionné, semence de haute qualité.', '${baseUrl}seed_sorgho_1776394336183.png', 'id-amadou', 'MOPTI', 'Niono', NOW())
    `);

    console.log('🐄 Creating 5 Animals (Livestock)...');
    
    // 5 ANIMAUX
    await client.query(`
      INSERT INTO animaux (id, type, race, age, "poidsKg", "prixFcfa", description, "photoUrl", "vendeurId", region, commune, "updatedAt")
      VALUES 
        ('a1', 'MOUTON', 'Sahel', 24, 65, 150000, 'Bélier majestueux avec de grandes cornes, prêt pour la Tabaski.', '${baseUrl}soro_mouton_sahel_1776393607703.png', 'id-amadou', 'MOPTI', 'Mopti Port', NOW()),
        ('a2', 'BOEUF', 'Zébu Peul', 48, 220, 380000, 'Zébu robuste pour le transport ou le labour.', '${baseUrl}soro_boeuf_labour_1776393643019.png', 'id-amadou', 'MOPTI', 'Mopti Port', NOW()),
        ('a3', 'CHEVRE', 'Rousse de Maradi', 12, 15, 35000, 'Jeune chèvre productive, excellente santé.', '${baseUrl}seed_chevre_1776394369788.png', 'id-oumar', 'KAYES', 'Kita', NOW()),
        ('a4', 'VOLAILLE', 'Local', 6, 2, 4500, 'Poulet bicyclette authentique nourri en plein air.', '${baseUrl}seed_volaille_1776394380468.png', 'id-mariam', 'SIKASSO', 'Koutiala', NOW()),
        ('a5', 'BOEUF', 'Métis', 36, 180, 450000, 'Vache laitière métis, bon rendement quotidien.', '${baseUrl}boeuf.webp', 'id-fatoumata', 'SEGOU', 'Ségou', NOW())
    `);

    console.log('🚜 Creating 5 Equipment items (Rental)...');
    
    // 5 MATÉRIELS
    await client.query(`
      INSERT INTO materiels (id, type, description, "prixJour", caution, "photoUrl", "proprietaireId", region, commune, "updatedAt")
      VALUES 
        ('m1', 'TRACTEUR', 'Tracteur Massey Ferguson industriel, 75 chevaux.', 75000, 250000, '${baseUrl}soro_tractor_mali_1776393593254.png', 'id-admin', 'BAMAKO', 'ACI 2000', NOW()),
        ('m2', 'MOTOPOMPE', 'Motopompe 3 pouces pour irrigation intensive.', 15000, 50000, '${baseUrl}seed_motopompe_1776394392395.png', 'id-fatoumata', 'SEGOU', 'Ségou Centre', NOW()),
        ('m3', 'CHARRUE', 'Charrue en acier trempé pour traction animale.', 5000, 15000, '${baseUrl}seed_charrue_1776394407312.png', 'id-oumar', 'KAYES', 'Kita', NOW()),
        ('m4', 'SILO', 'Silo de stockage métallique ventilé, capacité 10 tonnes.', 25000, 100000, '${baseUrl}seed_silo_1776394423698.png', 'id-admin', 'BAMAKO', 'ACI 2000', NOW()),
        ('m5', 'PULVERISATEUR', 'Pulvérisateur dorsal 16 litres pour traitements phytosanitaires.', 3000, 10000, '${baseUrl}seed_pulverisateur_1776394437255.png', 'id-mariam', 'SIKASSO', 'Koutiala', NOW())
    `);

    console.log('✅ Master Seed 5.0 Successful! (15 items generated)');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await client.end();
  }
}

seed();
