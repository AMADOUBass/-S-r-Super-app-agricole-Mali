const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

async function seed() {
  const client = new Client({
    connectionString: "postgres://2d007d1bc7ab331119a65a62a27047d67834b5bc73ccea50a0b0c6dd71080278:sk_WJnn8XYceAWhjl1osRSAk@db.prisma.io:5432/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📡 Connected — wiping all data...');

    await client.query('DELETE FROM avis;');
    await client.query('DELETE FROM transactions_portefeuille;');
    await client.query('DELETE FROM portefeuilles;');
    await client.query('DELETE FROM retraits;');
    await client.query('DELETE FROM messages;');
    await client.query('DELETE FROM conversations;');
    await client.query('DELETE FROM commandes;');
    await client.query('DELETE FROM locations;');
    await client.query('DELETE FROM animaux;');
    await client.query('DELETE FROM materiels;');
    await client.query('DELETE FROM produits;');
    await client.query('DELETE FROM otps;');
    await client.query('DELETE FROM prix_marche;');
    await client.query('DELETE FROM utilisateurs;');

    console.log('✅ Tables vidées. Création de l\'admin...');

    const adminId = crypto.randomUUID();
    const adminHash = await bcrypt.hash('SoroAdmin2026!', 10);

    await client.query(`
      INSERT INTO utilisateurs (id, nom, role, region, commune, email, telephone, "passwordHash", actif, "updatedAt")
      VALUES (
        $1,
        'Admin Sɔrô',
        'ADMIN',
        'BAMAKO',
        'Bamako',
        'admin@soro.ml',
        '+22300000000',
        $2,
        true,
        NOW()
      )
    `, [adminId, adminHash]);

    console.log(`✅ Reset complet ! ID Admin : ${adminId}`);
    console.log('   Email    : admin@soro.ml');
    console.log('   Password : SoroAdmin2026!');

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await client.end();
  }
}

seed();
