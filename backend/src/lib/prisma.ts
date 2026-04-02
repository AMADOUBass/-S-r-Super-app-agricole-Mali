// Instance Prisma Client — Prisma 7 + Accelerate
// dotenv chargé ICI en premier pour que DATABASE_URL soit dispo à l'import

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const accelerateUrl = process.env.DATABASE_URL;

if (!accelerateUrl) {
  throw new Error('DATABASE_URL manquant dans .env');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ accelerateUrl } as any).$extends(withAccelerate());

export default prisma;
