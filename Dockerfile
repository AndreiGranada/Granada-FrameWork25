# syntax=docker/dockerfile:1

# 1) Instala dependências (incluindo dev, para executar prisma migrate)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build do TypeScript e geração do Prisma Client
FROM deps AS builder
WORKDIR /app
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# 3) Runtime enxuto
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Dependências úteis para engines do Prisma
RUN apk add --no-cache openssl

# Copia apenas o necessário para rodar
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma

EXPOSE 3000
# Nota: migrate:deploy será executado via docker-compose command
CMD ["node", "dist/index.js"]
