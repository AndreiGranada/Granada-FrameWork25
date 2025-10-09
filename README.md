# MedicalTime Monorepo (BackEnd + FrontEnd)

Este repositório reúne o BackEnd (API/Prisma) e o FrontEnd (Expo/React Native) do projeto MedicalTime em um único monorepo.

- BackEnd: `BackEnd/MedicalTime`
- FrontEnd: `FrontEnd/my-app`

## Sumário

- Visão geral
- Requisitos
- Configuração rápida (dev)
  - Backend (API)
  - Frontend (App Expo)
- Scripts úteis
- Testes
- Geração/uso do SDK
- Troubleshooting rápido

## Visão geral

- API Node.js/Express com Prisma e Postgres. Inclui `docker-compose.yml` para subir dependências locais.
- App móvel com Expo Router (React Native) em TypeScript.
- SDK TypeScript gerado a partir do `openapi.yaml` do BackEnd; sincronizado com o FrontEnd.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+ (recomendado 10+)
- Docker e Docker Compose (opcional, recomendado para banco local)
- Expo CLI (opcional para rodar no dispositivo/emulador)

## Configuração rápida (dev)

### 1) Backend (API)

Pasta: `BackEnd/MedicalTime`

1. Copie variáveis de ambiente e ajuste o banco:

```powershell
cd "BackEnd/MedicalTime"
Copy-Item .env.example .env -Force
# Edite .env e configure DATABASE_URL (ou use Docker Compose abaixo)
```

2. (Opcional) Suba Postgres e serviços de apoio via Docker Compose:

```powershell
# Ainda dentro de BackEnd/MedicalTime
docker compose up -d
```

3. Instale dependências e prepare o banco:

```powershell
npm ci
npx prisma migrate dev
npx prisma generate
```

4. Rode em desenvolvimento:

```powershell
npm run dev
```

A API deve subir na porta configurada (ver `.env` e/ou `src/server.ts`).

### 2) Frontend (App Expo)

Pasta: `FrontEnd/my-app`

1. Configure as variáveis do app e URL do backend:

```powershell
cd "FrontEnd/my-app"
# Caso necessário, ajuste arquivos de env/config
# Ex.: src/config/env.ts ou use os scripts de sync disponíveis em scripts/
```

2. Instale dependências e inicie o bundler do Expo:

```powershell
npm ci
npm start
# ou: npx expo start
```

3. Abra no dispositivo/emulador via app Expo Go ou emuladores iOS/Android.

## Scripts úteis

Backend (em `BackEnd/MedicalTime`):

- `npm run dev` — inicia a API em modo desenvolvimento
- `npm test` — executa a suíte de testes
- `npm run seed` — popula dados de exemplo (ver `scripts/seed.js`)
- `npm run build` — gera artefatos em `dist/`

Frontend (em `FrontEnd/my-app`):

- `npm start` — inicia o Metro bundler (Expo)
- `npm test` — executa a suíte de testes do app
- `npm run lint` — lint do código

## Testes

- Backend: Jest configurado (ver `BackEnd/MedicalTime/jest.config.ts`).
- Frontend: Jest/RTL (ver `FrontEnd/my-app/__tests__` e `test/jestSetup.ts`).

Exemplos:

```powershell
# Backend
npm test

# Frontend
npm test
```

## Geração/uso do SDK

- O contrato da API está em `BackEnd/MedicalTime/openapi.yaml`.
- O SDK é gerado/atualizado e copiado para o FrontEnd (ver `scripts/copy-sdk-to-frontend.js`).
- No FrontEnd, o cliente do SDK fica em `FrontEnd/my-app/sdk-backend/`.

## Troubleshooting rápido

- 401/sem sessão no app: a UI evita chamadas quando não autenticado e oferece login/cadastro.
- Falha ao criar lembrete sem horários: o adaptador do FrontEnd injeta um horário padrão (08:00) quando necessário.
- Cabeçalho Authorization duplicado: já normalizado no SDK do FrontEnd.
- JSDOM/polyfills: já cobertos em `FrontEnd/my-app/test/jestSetup.ts`.

## Observações

- Evite commitar segredos reais (arquivos `.env`).
- `node_modules/` são ignorados pelo Git.
- `dist/` e `.expo/` podem ser limpos se não forem necessários em versionamento.
