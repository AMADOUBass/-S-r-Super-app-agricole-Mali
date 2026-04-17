FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npm ci

RUN npx prisma generate
RUN npx tsc

RUN npm prune --omit=dev

EXPOSE 5000

CMD ["node", "dist/server.js"]
