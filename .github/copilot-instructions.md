# Instruções para agentes de IA neste repo (Granada-FrameWork25)

Estas regras tornam um agente imediatamente produtivo neste monorepo. Seja direto, preserve os padrões existentes e use os scripts do projeto.

## Panorama da arquitetura

- Monorepo com dois apps:
  - Backend: `BackEnd/MedicalTime` (Node.js + TypeScript, Express 5, Prisma/MySQL, OpenAPI 3.1, Jest).
  - Frontend: `FrontEnd/my-app` (React Native + Expo 54, Expo Router, Zustand, React Query) consumindo SDK gerado do backend.
- OpenAPI (`BackEnd/MedicalTime/openapi.yaml`) é a fonte da verdade. O SDK TypeScript é gerado em `BackEnd/MedicalTime/sdk` e copiado para `FrontEnd/my-app/sdk-backend`.

## Backend – como é organizado e por quê

- Entradas: `index.ts` (root), `src/app.ts` (Express app), `src/server.ts` (listener + jobs). Ao subir o servidor, jobs são iniciados: `services/intakeScheduler`, `services/intakeAlarms`, `services/cleanup`.
- Rotas montadas em `src/app.ts` (auth, reminders, intakes, emergency, devices, me, dev). Swagger UI é servido em `/docs` carregando `openapi.yaml` da raiz.
- Segurança e DX: `helmet`, CORS restrito por `CORS_ORIGINS` (em dev, origens localhost/LAN são aceitas), `X-Correlation-Id` ecoado, logs estruturados (Pino) com contexto ALS.
- Domínios principais: lembretes/schedules (bitmask de dias), eventos de ingestão (com `graceEndsAt`), SOS, dispositivos, autenticação/refresh rotacionado.

## Frontend – como é organizado e por quê

- Expo Router com telas em `app/` (`_layout.tsx`, `index.tsx`, `login.tsx`, `intakes*.tsx`, `profile.tsx` etc.).
- Comunicação com backend via `sdk-backend/` (gerado) + adapters em `src/services` e cliente Axios com interceptadores (refresh token, friendly errors) em `src/api`.
- Scripts sincronizam env e URL do front com o backend antes de rodar (evitar CORS/config manual).

## Fluxos críticos do desenvolvedor

- Backend (PowerShell no Windows):
  - Instalação/migração/execução: `npm install`; `npm run generate`; `npm run migrate`; `npm run dev`.
  - Testes: `npm test` (Jest); contrato: `npm run test:contract`; smoke: `npm run smoke`.
  - Docker (API+MySQL): `docker compose up -d --build` (compose expõe `3000`).
  - SDK: `npm run sdk:update` (gera e copia para o front). Valide OpenAPI: `npm run openapi:validate`.
- Frontend:
  - Start padrão (sincroniza env/URL automaticamente): `npm start`.
  - Web: `npm run web`; Android: `npm run android`/`android:emulator`; iOS: `npm run ios` (macOS).
  - Verifique SDK sincronizado: `npm run sdk:verify`; smoke: `npm run smoke:frontend`.

## Convenções do projeto (siga ao codar)

- Contratos primeiro: qualquer mudança de API passa por `openapi.yaml`; gere SDK e atualize o front. Mudanças breaking exigem bump MAJOR (ver README Backend).
- Validação e erros: use Zod nos handlers; respostas de erro seguem `{ error: { code, message, details? } }` (helpers em `src/lib/errors`).
- Autenticação: header `Authorization: Bearer <token>`; refresh via `POST /auth/refresh` (rotaciona). Reset de senha envia apenas o TOKEN por e-mail (sem link).
- CORS: em prod restrito via `CORS_ORIGINS`; em dev, origens localhost/LAN são permitidas automaticamente.
- Schedules: utilize `daysOfWeekBitmask` (0=todos; 1=Dom, 2=Seg, 4=Ter, 8=Qua, 16=Qui, 32=Sex, 64=Sáb). Exemplos na OpenAPI.
- Intakes: `/intakes/history` suporta modo legado (array) ou modo paginado com `{ data, pageInfo }` quando `limit` é enviado.
- Notificações: seleção por env `NOTIFY_PROVIDER` (dev|whatsapp|fcm|expo) e `NOTIFY_DRY_RUN` para evitar envios reais em dev.
- Observabilidade: sempre propague/registre `X-Correlation-Id`; `logger.child({ correlationId })` já é usado nos middlewares.

## Pontos de integração e exemplos

- Documente endpoints no `openapi.yaml` e mantenha exemplos práticos (curl, bodies). Swagger em `http://localhost:3000/docs`.
- Exemplos de rotas: `src/routes/reminders.ts` (CRUD + schedules), `src/routes/intakes.ts` (janela de tolerância via `graceEndsAt`), `src/routes/emergency.ts` (SOS), `src/routes/dev.ts` (helpers de teste, desabilitar em prod).
- Front utiliza `src/push/registerForPush.ts` para registrar tokens após login e `src/services/*` como camada de adaptação sobre o SDK.

## Quando editar o quê

- Novo endpoint/campo: editar `openapi.yaml` → `npm run sdk:update` → ajustar handlers/serviços → atualizar adapters no front.
- Jobs/comportamento de eventos: editar `services/intakeScheduler|intakeAlarms|cleanup` e refletir campos/respostas na OpenAPI.
- Mudanças de autenticação/segurança: revisar middlewares em `src/app.ts`, rate limits, CORS e exemplos na doc.
