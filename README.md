# MedicalTime - Framework 25<<<<<<< HEAD

# MedicalTime Monorepo (BackEnd + FrontEnd)

Este repositório reúne o BackEnd (API/Prisma) e o FrontEnd (Expo/React Native) do projeto MedicalTime em um único monorepo.

Este repositório reúne o BackEnd (API/Prisma) e o FrontEnd (Expo/React Native) do projeto MedicalTime em um único monorepo.

- BackEnd: `BackEnd/MedicalTime`

- FrontEnd: `FrontEnd/my-app`- BackEnd: `BackEnd/MedicalTime`

- FrontEnd: `FrontEnd/my-app`

Backend em Node.js + TypeScript, Express e Prisma para gerenciamento de lembretes de medicação, eventos de tomada, S.O.S. e notificações.

## Sumário

> Versão atual do contrato OpenAPI: **1.3.0** (ver `openapi.yaml`). Se você gerou SDKs em versões 1.0.x ou 1.1.x, regenere para obter paginação de histórico, respostas expandidas e o novo campo `graceEndsAt`.

- Visão geral

## Sumário- Requisitos

- Configuração rápida (dev)

- Visão geral  - Backend (API)

- Requisitos  - Frontend (App Expo)

- Configuração rápida (dev)- Scripts úteis

  - Backend (API)- Testes

  - Frontend (App Expo)- Geração/uso do SDK

- Scripts úteis- Troubleshooting rápido

- Testes

- Geração/uso do SDK## Visão geral

- Troubleshooting rápido

- API Node.js/Express com Prisma e Postgres. Inclui `docker-compose.yml` para subir dependências locais.

## Visão geral- App móvel com Expo Router (React Native) em TypeScript.

- SDK TypeScript gerado a partir do `openapi.yaml` do BackEnd; sincronizado com o FrontEnd.

- API Node.js/Express com Prisma e MySQL. Inclui `docker-compose.yml` para subir dependências locais.

- App móvel com Expo Router (React Native) em TypeScript.## Requisitos

- SDK TypeScript gerado a partir do `openapi.yaml` do BackEnd; sincronizado com o FrontEnd.

- Node.js 18+ (recomendado 20+)

## Requisitos- npm 9+ (recomendado 10+)

- Docker e Docker Compose (opcional, recomendado para banco local)

- Node.js 18+ (recomendado 20+)- Expo CLI (opcional para rodar no dispositivo/emulador)

- npm 9+ (recomendado 10+)

- MySQL 8+## Configuração rápida (dev)

- Docker e Docker Compose (opcional, recomendado para banco local)

- Expo CLI (opcional para rodar no dispositivo/emulador)### 1) Backend (API)



## Configuração rápida (dev)Pasta: `BackEnd/MedicalTime`



### 1) Backend (API)1. Copie variáveis de ambiente e ajuste o banco:



Pasta: `BackEnd/MedicalTime````powershell

cd "BackEnd/MedicalTime"

1. Copie variáveis de ambiente e ajuste o banco:Copy-Item .env.example .env -Force

# Edite .env e configure DATABASE_URL (ou use Docker Compose abaixo)

```powershell```

cd "BackEnd/MedicalTime"

Copy-Item .env.example .env -Force2. (Opcional) Suba Postgres e serviços de apoio via Docker Compose:

# Edite .env e configure DATABASE_URL (ou use Docker Compose abaixo)

``````powershell

# Ainda dentro de BackEnd/MedicalTime

2. (Opcional) Suba MySQL e serviços de apoio via Docker Compose:docker compose up -d

```

```powershell

# Ainda dentro de BackEnd/MedicalTime3. Instale dependências e prepare o banco:

docker compose up -d

``````powershell

npm ci

3. Instale dependências e prepare o banco:npx prisma migrate dev

npx prisma generate

```powershell```

npm ci

npx prisma migrate dev4. Rode em desenvolvimento:

npx prisma generate

``````powershell

npm run dev

4. Rode em desenvolvimento:```



```powershellA API deve subir na porta configurada (ver `.env` e/ou `src/server.ts`).

npm run dev

```### 2) Frontend (App Expo)



A API deve subir na porta configurada (ver `.env` e/ou `src/server.ts`).Pasta: `FrontEnd/my-app`



### 2) Frontend (App Expo)1. Configure as variáveis do app e URL do backend:



Pasta: `FrontEnd/my-app````powershell

cd "FrontEnd/my-app"

1. Configure as variáveis do app e URL do backend:# Caso necessário, ajuste arquivos de env/config

# Ex.: src/config/env.ts ou use os scripts de sync disponíveis em scripts/

```powershell```

cd "FrontEnd/my-app"

# Caso necessário, ajuste arquivos de env/config2. Instale dependências e inicie o bundler do Expo:

# Ex.: src/config/env.ts ou use os scripts de sync disponíveis em scripts/

``````powershell

npm ci

2. Instale dependências e inicie o bundler do Expo:npm start

# ou: npx expo start

```powershell```

npm ci

npm start3. Abra no dispositivo/emulador via app Expo Go ou emuladores iOS/Android.

# ou: npx expo start

```## Scripts úteis



3. Abra no dispositivo/emulador via app Expo Go ou emuladores iOS/Android.Backend (em `BackEnd/MedicalTime`):



## Scripts úteis- `npm run dev` — inicia a API em modo desenvolvimento

- `npm test` — executa a suíte de testes

Backend (em `BackEnd/MedicalTime`):- `npm run seed` — popula dados de exemplo (ver `scripts/seed.js`)

- `npm run build` — gera artefatos em `dist/`

- `npm run dev` — inicia a API em modo desenvolvimento

- `npm test` — executa a suíte de testesFrontend (em `FrontEnd/my-app`):

- `npm run seed` — popula dados de exemplo (ver `scripts/seed.js`)

- `npm run build` — gera artefatos em `dist/`- `npm start` — inicia o Metro bundler (Expo)

- `npm test` — executa a suíte de testes do app

Frontend (em `FrontEnd/my-app`):- `npm run lint` — lint do código



- `npm start` — inicia o Metro bundler (Expo)## Testes

- `npm test` — executa a suíte de testes do app

- `npm run lint` — lint do código- Backend: Jest configurado (ver `BackEnd/MedicalTime/jest.config.ts`).

- Frontend: Jest/RTL (ver `FrontEnd/my-app/__tests__` e `test/jestSetup.ts`).

## Testes

Exemplos:

- Backend: Jest configurado (ver `BackEnd/MedicalTime/jest.config.ts`).

- Frontend: Jest/RTL (ver `FrontEnd/my-app/__tests__` e `test/jestSetup.ts`).```powershell

# Backend

Exemplos:npm test



```powershell# Frontend

# Backendnpm test

npm test```



# Frontend## Geração/uso do SDK

npm test

```- O contrato da API está em `BackEnd/MedicalTime/openapi.yaml`.

- O SDK é gerado/atualizado e copiado para o FrontEnd (ver `scripts/copy-sdk-to-frontend.js`).

## Geração/uso do SDK- No FrontEnd, o cliente do SDK fica em `FrontEnd/my-app/sdk-backend/`.



- O contrato da API está em `BackEnd/MedicalTime/openapi.yaml`.## Troubleshooting rápido

- O SDK é gerado/atualizado e copiado para o FrontEnd (ver `scripts/copy-sdk-to-frontend.js`).

- No FrontEnd, o cliente do SDK fica em `FrontEnd/my-app/sdk-backend/`.- 401/sem sessão no app: a UI evita chamadas quando não autenticado e oferece login/cadastro.

- Falha ao criar lembrete sem horários: o adaptador do FrontEnd injeta um horário padrão (08:00) quando necessário.

## Troubleshooting rápido- Cabeçalho Authorization duplicado: já normalizado no SDK do FrontEnd.

- JSDOM/polyfills: já cobertos em `FrontEnd/my-app/test/jestSetup.ts`.

- 401/sem sessão no app: a UI evita chamadas quando não autenticado e oferece login/cadastro.

- Falha ao criar lembrete sem horários: o adaptador do FrontEnd injeta um horário padrão (08:00) quando necessário.## Observações

- Cabeçalho Authorization duplicado: já normalizado no SDK do FrontEnd.

- JSDOM/polyfills: já cobertos em `FrontEnd/my-app/test/jestSetup.ts`.- Evite commitar segredos reais (arquivos `.env`).

- `node_modules/` são ignorados pelo Git.

## Observações- `dist/` e `.expo/` podem ser limpos se não forem necessários em versionamento.

=======

- Evite commitar segredos reais (arquivos `.env`).# MedicalTime API

- `node_modules/` são ignorados pelo Git.

- `dist/` e `.expo/` podem ser limpos se não forem necessários em versionamento.Backend em Node.js + TypeScript, Express e Prisma para gerenciamento de lembretes de medicação, eventos de tomada, S.O.S. e notificações.



## Licença> Versão atual do contrato OpenAPI: **1.3.0** (ver `openapi.yaml`). Se você gerou SDKs em versões 1.0.x ou 1.1.x, regenere para obter paginação de histórico, respostas expandidas e o novo campo `graceEndsAt`.



Uso interno/educacional. Adapte conforme sua necessidade.## Visão Geral

- Lembretes com múltiplos horários (MedicationSchedule)
- Geração de eventos (IntakeEvent) e reenvio de alarmes
- Confirmação de tomada (TAKEN) e marcação automática como MISSED
- Contatos de emergência (S.O.S.)
- Dispositivos (tokens de push)
- Autenticação JWT + Refresh Tokens rotacionados
- Recuperação de senha por e-mail
- Jobs de agendamento, alarmes e limpeza
- Camada de Notificações com provider de desenvolvimento (log) e providers para WhatsApp/FCM/Expo
- Janela de tolerância configurável via env (`INTAKE_GRACE_PERIOD_MIN`) permitindo exibir o horário limite (`graceEndsAt`) na API

## Requisitos

- Node.js 18+
- MySQL 8+
- PowerShell (Windows) ou Bash (Linux/Mac)

## Configuração

1. Instale dependências
2. Configure o banco e variáveis de ambiente
3. Rode migrações e gere o Prisma Client

### Variáveis de Ambiente (.env)

Crie um arquivo `.env` baseado em abaixo:

```
# Banco de dados
DATABASE_URL="mysql://USER:PASS@localhost:3306/DBNAME"

# Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGINS=

# Autenticação
JWT_SECRET="troque-este-segredo"

# Rate limit (aceita ms/s/m/h)
RATE_LIMIT_AUTH_WINDOW=15m
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_SOS_WINDOW=1h
RATE_LIMIT_SOS_MAX=5

# Intakes (janela de tolerância)
INTAKE_GRACE_PERIOD_MIN=15

# E-mail (dev/prod)
EMAIL_DEV_LOG=true
# URL base do frontend para links de e-mail (reset, etc.)
# Em apps Expo Web, a porta padrão costuma ser 8081 (se ocupada pode alternar p/ 8082). Ajuste conforme scripts do front.
FRONTEND_URL=http://localhost:8081
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Notificações (providers)
NOTIFY_PROVIDER=dev # dev | whatsapp | fcm | expo
NOTIFY_DRY_RUN=true

# WhatsApp Cloud API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_API_URL=https://graph.facebook.com/v20.0
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANG=pt_BR
WHATSAPP_RETRY_MAX=2
WHATSAPP_RETRY_BASE_MS=500

# FCM/Expo (push)
FCM_SERVER_KEY=
EXPO_ACCESS_TOKEN=
```

Dica: Em desenvolvimento, esta API usa pino-pretty para logs legíveis.

## Executar com Docker/Compose

Pré-requisitos: Docker Desktop instalado e ativo.

Arquivos adicionados:

- `Dockerfile` (multi-stage)
- `docker-compose.yml` (API + MySQL com healthcheck)
- `.dockerignore`

Passos (Windows PowerShell):

```powershell
# 1) Build da imagem e subida dos serviços
docker compose up -d --build

# 2) Ver logs da API
docker compose logs -f api

# 3) Parar/Remover
docker compose down
```

Padrões usados no compose:

- Banco: `mysql://mtuser:mtpass@db:3306/medicaltime`
- Porta API: `3000` (exposta como 3000)
- Migrações: executadas no start do container (`npm run generate && npm run migrate:deploy && npm run start`)

Observações:

- Ajuste `JWT_SECRET` e demais variáveis no `docker-compose.yml` ou use um `.env` com `docker compose --env-file`.
- A documentação Swagger estará em `http://localhost:3000/docs`.
- Para ambiente de produção, considere volumes/backup do MySQL e secrets seguros.

## Scripts NPM

- `npm run dev` — inicia o servidor em modo desenvolvimento (ts-node-dev)
- `npm run build` — gera saída JavaScript em `dist/`
- `npm run start` — roda a versão compilada (use após `npm run build`)
- `npm run generate` — gera Prisma Client
- `npm run migrate` — aplica migrações em desenvolvimento (`prisma migrate dev`)
- `npm run migrate:deploy` — aplica migrações em produção/CI (`prisma migrate deploy`)
- `npm test` — executa a suíte completa (Jest)
- `npm run test:contract` — smoke rápido de regressões de contrato (testes focados em additions do OpenAPI)
- `npm run smoke` — executa o script end-to-end local (requer servidor e DB ativos)
- `npm run sdk:generate` — gera SDK TypeScript na pasta `sdk/`
- `npm run sdk:update` — gera e copia SDK para `FrontEnd/my-app/sdk-backend`
- `npm run openapi:validate` — valida `openapi.yaml` com o Redocly CLI

## Banco de Dados (Prisma)

- Schema em `prisma/schema.prisma`
- Para sincronizar:
  - `npm run migrate`
  - `npm run generate`

## Como Rodar (Windows PowerShell)

1. Instalação de dependências
2. Ajuste `.env`
3. Migração do banco
4. Início do servidor

Exemplo (PowerShell):

```powershell
npm install
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

A API subirá em `http://localhost:%PORT%` (default 3000).

### Smoke manual

Pré-requisitos:

- Banco MySQL acessível conforme `DATABASE_URL` do `.env` (ex.: `mysql://root:senha@localhost:3306/medicaltime`)
- Servidor em execução (ex.: `npm run dev`)

Execução:

```powershell
# Em um terminal, mantenha o servidor ativo
npm run dev

# Em outro terminal, rode o smoke
npm run smoke
```

O script fará:

- Registro de usuário (gera e usa JWT)
- Criação de lembrete (com um schedule)
- Listagem de intakes próximas 24h e tentativa de marcar TAKEN (se existir)
- Registro e listagem de device
- Criação e listagem de contato de emergência
- Disparo de SOS (dev provider por padrão)

Observações:

- O script aguarda `GET /health` responder antes de iniciar (timeout ~15s).
- Em ambiente de desenvolvimento, `NOTIFY_PROVIDER=dev` e `NOTIFY_DRY_RUN=true` evitam envios reais.
- Caso use Docker para o banco, garanta que o container esteja saudável antes de rodar o smoke.

## Endpoints Essenciais

> Endpoints de desenvolvimento (somente quando `NODE_ENV != production`): `POST /dev/test-sos`, `POST /dev/test-alarm` auxiliam testes manuais de providers sem acionar fluxos reais completos. Não consumir em produção.

Auth:

- POST /auth/register
- POST /auth/login
- POST /auth/forgot
- POST /auth/reset
- POST /auth/refresh
- POST /auth/logout

Reminders/Schedules:

- POST /reminders
- GET /reminders
- GET /reminders/:id
- PATCH /reminders/:id
- POST /reminders/:id/schedules
- PATCH /reminders/schedules/:scheduleId
- DELETE /reminders/schedules/:scheduleId

Intakes:

- GET /intakes
- GET /intakes/history
- POST /intakes/:id/taken

Emergency:

- CRUD /emergency/emergency-contacts
- POST /emergency/sos

Devices:

- POST/GET/PATCH/DELETE /devices

Health:

- GET /health

Dev (somente quando NODE_ENV != production):

- POST /dev/test-sos — dispara S.O.S. de teste para contatos ativos do usuário
- POST /dev/test-alarm — dispara alarme de ingestão (usa o primeiro PENDING por padrão ou aceite `intakeEventId` no body)

Docs (Swagger UI):

- GET /docs — documentação interativa (use o botão "Authorize" para informar o JWT)

## Fluxo de Autenticação

- Após register/login, a API retorna `token` (JWT acesso) e `refreshToken`.
- Use `Authorization: Bearer <token>` em chamadas protegidas.
- Para renovar, chame `POST /auth/refresh` com `refreshToken` (rotação automática).
- `POST /auth/logout` revoga todos os refresh tokens do usuário.

## Jobs Ativos

- startIntakeScheduler: a cada 5 min, gera eventos das próximas 24h
- startAlarmProcessor: a cada 1 min, reenvia alarmes e marca MISSED após janela
- startCleanupJob: a cada 1h, remove tokens expirados/antigos e intakes > 90d
  - Parametrizações via .env: ALARM_RETRY_INTERVAL_MIN, ALARM_MAX_ATTEMPTS, ALARM_MARK_MISSED_AFTER_MIN, ALARM_SCAN_WINDOW_HOURS, INTAKE_GRACE_PERIOD_MIN

## Notificações

- Abstração via `NotificationProvider` com implementação Dev (`console.log`) pronta
- Providers: WhatsApp (texto/templated com retry/backoff), Expo (push com desativação automática de tokens inválidos), FCM (skeleton)
- Configuração via `NOTIFY_PROVIDER` (dev|whatsapp|fcm|expo) e `NOTIFY_DRY_RUN`

## Testes

- Framework: Jest + ts-jest + Supertest
- Rodar: `npm test`
- Setup limpa tabelas entre testes (`test/setup.ts`)
- Cobertura atual: auth, reminders/intakes, providers (Expo/WhatsApp) e job de alarmes

## Troubleshooting

- Erros de peer dependency: use `--force` apenas em dev quando necessário
- Porta ocupada: ajuste `PORT` no `.env`
- Problemas de timezone: confira `timezone` do usuário e bibliotecas `date-fns`/`date-fns-tz`

## Segurança

- Mantenha `JWT_SECRET` seguro
- Ajuste rate limits para produção
- Helmet ativado por padrão; configure CORS restrito via `CORS_ORIGINS` (lista separada por vírgula)
- CorrelationId: envie `X-Correlation-Id` nas requisições para rastreabilidade; a API ecoa o mesmo header na resposta

## Licença

Uso interno/educacional. Adapte conforme sua necessidade.

## Versionamento

Estado atual: **1.3.0**.

Resumo rápido das versões recentes (detalhes nas tags/releases do Git):

- 1.3.0: Campo `graceEndsAt` em respostas de intakes (ajuda na UX para janela de tolerância) e documentação da env `INTAKE_GRACE_PERIOD_MIN`.
- 1.2.0: Paginação experimental em `/intakes/history` (`limit` + `cursor`, envelope `{ data, pageInfo }`, mantendo oneOf com modo legado `days`).
- 1.1.0: Introdução de schema `AuthSession`, respostas enriquecidas de Reminder/Schedule, documentação de bitmask de dias.
- 1.0.0: Versão inicial com domínios principais (auth, reminders, intakes, emergency, devices) e providers de notificação.

Política SemVer adotada:

- **MAJOR**: quebras de contrato (mudança de campos obrigatórios, remoção de endpoints, alterações de semântica).
- **MINOR**: adição retrocompatível de endpoints/campos opcionais.
- **PATCH**: correções que não alteram contratos.

Boas práticas para evoluções futuras:

1. Nunca remover ou mudar tipo de campo sem bump de MAJOR.
2. Campos novos sempre opcionais inicialmente (ou com default seguro).
3. Avaliar introduzir prefixo `/v2` apenas quando MAJOR for inevitável.
4. Documentar mudanças nas notas de release (tags do Git) e regenerar o SDK após cada release.

Observação: antes de remover ou alterar campos obrigatórios abra uma issue e considere bump de MAJOR ou introdução de campos opcionais transitórios. Para novas features que exigem alteração de contratos gere novamente o SDK e atualize o front (scripts de sync já propagam o `EXPO_PUBLIC_API_BASE_URL`).

### Integração com Frontend (Expo)

- Scripts do frontend (pasta `FrontEnd/my-app`) sincronizam automaticamente a porta real do Expo Web e escrevem `FRONTEND_URL`/`FRONTEND_URLS` + `CORS_ORIGINS` via `sync-backend-frontend-url.js` (8081 e 8082 já são incluídas por padrão).
- Caso o Expo mude para uma porta fora do par 8081/8082, execute `node ./scripts/sync-backend-frontend-url.js <host> <novaPorta>` para acrescentá-la e garantir que links de e-mail (ex.: reset) continuem válidos.
- O fluxo de refresh de token do front realiza fila de requisições paralelas; ao falhar o refresh a sessão é invalidada imediatamente.
>>>>>>> dd4bdbe9f8b468452a176d89616654e22bdd4c21
