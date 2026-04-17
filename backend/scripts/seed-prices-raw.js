const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('❌ DIRECT_URL is missing in .env');
    process.exit(1);
  }

  console.log('🌱 Starting Raw SQL Seed for Price History...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // Cleanup existing prices to avoid duplicates
    console.log('🧹 Cleaning up old prices...');
    await client.query('DELETE FROM prix_marche');

    const products = [
      'MIL', 'SORGHO', 'MAIS', 'RIZ', 'ARACHIDE', 
      'NIEBE', 'SESAME', 'COTON', 'MANGUE', 'OIGNON', 
      'TOMATE', 'KARITE', 'GOMBO', 'PATATE_DOUCE', 'IGNAME'
    ];
    const regions = [
      'BAMAKO', 'SIKASSO', 'SEGOU', 'MOPTI', 'KAYES', 
      'KOULIKORO', 'TOMBOUCTOU', 'GAO', 'KIDAL', 'MENAKA', 'TAOUDENIT'
    ];
    const now = new Date();

    console.log(`📈 Generating 30 days of data for each of the ${products.length} products in ${regions.length} regions...`);
    
    let count = 0;
    for (const produit of products) {
      for (const region of regions) {
        let currentPrice = 150 + Math.random() * 300;
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const fluctuation = 1 + (Math.random() * 0.1 - 0.05);
          currentPrice = Math.round(currentPrice * fluctuation);

          const id = `seed-${produit}-${region}-${i}`;
          
          await client.query(
            'INSERT INTO prix_marche (id, produit, region, "prixKg", source, date) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, produit, region, currentPrice, 'Observatoire Sɔrô (Raw Seed)', date]
          );
          count++;
        }
      }
    }

    console.log(`✅ Seed Successful! Inserted ${count} entries.`);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await client.end();
  }
}

main();
