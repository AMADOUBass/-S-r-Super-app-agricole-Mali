// Instance Prisma Client — Prisma 7 + Accelerate
// dotenv chargé ICI en premier pour que DATABASE_URL soit dispo à l'import

import 'dotenv/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';

// PRISMA_ACCELERATE_URL évite le conflit avec le DATABASE_URL de Railway Postgres
const dbUrl = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('PRISMA_ACCELERATE_URL manquant dans les variables d\'environnement');
}
process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;
