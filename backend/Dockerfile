FROM node:20-alpine

WORKDIR /app

# Railway build context = repo root, so prefix with backend/
COPY backend/package*.json ./
COPY backend/prisma.config.ts ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/
COPY backend/src ./src/

RUN npm ci

RUN npx prisma generate
RUN npx tsc

RUN npm prune --omit=dev

EXPOSE 5000

CMD ["node", "dist/server.js"]
