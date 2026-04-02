// Instance Prisma Client — Prisma 7 + Accelerate
// dotenv chargé ICI en premier pour que DATABASE_URL soit dispo à l'import

import 'dotenv/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
import { withAccelerate } from '@prisma/extension-accelerate';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquant dans .env');
}

const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;
