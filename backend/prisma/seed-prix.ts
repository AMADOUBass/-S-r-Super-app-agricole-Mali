// Seed — Prix du marché Mali (source : OMA / CSA, données 2025-2026)
// Exécuter : npx ts-node prisma/seed-prix.ts

import 'dotenv/config';
import prisma from '../src/lib/prisma';

// ─── Prix de base à Bamako (FCFA/kg) ─────────────────────────
// Source : OMA Mali, bulletins janvier 2025 / 2026
const PRIX_BASE: Record<string, number> = {
  MIL:          320,   // +35% vs 2023 en moyenne
  SORGHO:       290,   // +18% vs 2024
  MAIS:         230,
  RIZ:          575,   // 550-600 F/kg relevé Mopti / Bamako
  ARACHIDE:     600,
  NIEBE:        450,
  SESAME:       800,
  COTON:        275,
  MANGUE:       150,
  OIGNON:       200,
  TOMATE:       180,
  KARITE:       500,
  GOMBO:        250,
  PATATE_DOUCE: 175,
  IGNAME:       220,
};

// ─── Multiplicateurs régionaux ────────────────────────────────
// Zones de production (Sikasso, Kayes) → moins cher
// Zones enclavées / conflit (Mopti, Tombouctou, Gao, Kidal) → plus cher
const COEFF: Record<string, number> = {
  BAMAKO:      1.00,
  KOULIKORO:   0.95,
  SIKASSO:     0.88,   // zone de production maïs, mangue
  SEGOU:       0.93,   // zone de production riz, mil
  KAYES:       0.92,   // récoltes saisonnières
  MOPTI:       1.12,   // coûts transport + insécurité
  TOMBOUCTOU:  1.28,   // très enclavé
  GAO:         1.22,   // insécurité, transport difficile
  KIDAL:       1.40,   // zone de conflit
  MENAKA:      1.35,
  TAOUDENIT:   1.45,   // le plus enclavé
};

// ─── Produits disponibles par région ─────────────────────────
// Pas tous les produits dans toutes les régions
const PRODUITS_PAR_REGION: Record<string, string[]> = {
  BAMAKO:      ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','MANGUE','OIGNON','TOMATE','KARITE','SESAME'],
  SIKASSO:     ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','MANGUE','OIGNON','TOMATE','KARITE','IGNAME','PATATE_DOUCE'],
  SEGOU:       ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','OIGNON','KARITE','COTON'],
  KAYES:       ['MIL','SORGHO','ARACHIDE','NIEBE','SESAME','KARITE','MANGUE'],
  KOULIKORO:   ['MIL','SORGHO','MAIS','RIZ','ARACHIDE','NIEBE','OIGNON','KARITE'],
  MOPTI:       ['MIL','SORGHO','RIZ','NIEBE','OIGNON','POISSON'],
  TOMBOUCTOU:  ['MIL','SORGHO','RIZ','NIEBE'],
  GAO:         ['MIL','SORGHO','RIZ','NIEBE','OIGNON'],
  KIDAL:       ['MIL','SORGHO'],
  MENAKA:      ['MIL','SORGHO','NIEBE'],
  TAOUDENIT:   ['MIL','SORGHO'],
};

async function main() {
  console.log('🌾 Peuplement des prix du marché OMA Mali 2025-2026...\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let total = 0;
  let erreurs = 0;

  for (const [region, produits] of Object.entries(PRODUITS_PAR_REGION)) {
    const coeff = COEFF[region] ?? 1.0;

    for (const produit of produits) {
      if (produit === 'POISSON') continue; // pas dans l'enum TypeProduit

      const prixBase = PRIX_BASE[produit];
      if (!prixBase) continue;

      // Variation aléatoire ±5% pour simuler fluctuation hebdomadaire
      const variation = 1 + (Math.random() * 0.10 - 0.05);
      const prixKg = Math.round(prixBase * coeff * variation / 5) * 5; // arrondi au multiple de 5

      try {
        await prisma.prixMarche.upsert({
          where: {
            produit_region_date: {
              produit: produit as never,
              region: region as never,
              date: today,
            },
          },
          create: {
            produit: produit as never,
            region: region as never,
            prixKg,
            source: 'OMA Mali / CSA — seed 2025-2026',
            date: today,
          },
          update: { prixKg },
        });

        console.log(`  ✅ ${region.padEnd(12)} ${produit.padEnd(12)} → ${prixKg} F/kg`);
        total++;
      } catch (err) {
        console.error(`  ❌ ${region} / ${produit}:`, err);
        erreurs++;
      }
    }
  }

  console.log(`\n✅ ${total} prix insérés, ${erreurs} erreurs`);
  console.log('📊 Vérification : consultez /marche dans le frontend');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
