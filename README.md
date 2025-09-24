# MedicalTime API

Backend em Node.js + TypeScript, Express e Prisma para gerenciamento de lembretes de medicação, eventos de tomada, S.O.S. e notificações.

## Visão Geral

- Lembretes com múltiplos horários (MedicationSchedule)
- Geração de eventos (IntakeEvent) e reenvio de alarmes
- Confirmação de tomada (TAKEN) e marcação automática como MISSED
- Contatos de emergência (S.O.S.)
- Dispositivos (tokens de push)
- Autenticação JWT + Refresh Tokens rotacionados
- Recuperação de senha por e-mail
- Jobs de agendamento, alarmes e limpeza
- Camada de Notificações com provider de desenvolvimento (log) e providers para WhatsApp/FCM/Expo

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

# E-mail (dev/prod)
EMAIL_DEV_LOG=true
FRONTEND_URL=http://localhost:5173
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
- `npm start` — roda a versão compilada
- `npm run generate` — gera Prisma Client
- `npm run migrate` — aplica migrações em desenvolvimento
- `npm run migrate:deploy` — aplica migrações em produção/CI
- `npm test` — executa testes (Jest)
- `npm run smoke` — executa um smoke test end-to-end local (requer servidor e DB ativos)

## Banco de Dados (Prisma)

- Schema em `prisma/schema.prisma`
- Para sincronizar:
  - `npm run prisma:migrate`
  - `npm run prisma:generate`

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
  - Parametrizações via .env: ALARM_RETRY_INTERVAL_MIN, ALARM_MAX_ATTEMPTS, ALARM_MARK_MISSED_AFTER_MIN, ALARM_SCAN_WINDOW_HOURS

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

Este backend está congelado como versão inicial **v1.0.0** (ver `CHANGELOG.md`).

Política adotada:

- **MAJOR**: quebras de contrato (mudança de campos obrigatórios, remoção de endpoints, alterações de semântica).
- **MINOR**: adição retrocompatível de endpoints/campos opcionais.
- **PATCH**: correções que não alteram contratos.

Boas práticas para evoluções futuras:

1. Nunca remover ou mudar tipo de campo sem bump de MAJOR.
2. Campos novos sempre opcionais inicialmente (ou com default seguro).
3. Avaliar introduzir prefixo `/v2` apenas quando MAJOR for inevitável.
4. Documentar mudanças no `CHANGELOG.md` e regenerar SDK após cada release.

Congelamento atual: nenhum trabalho adicional de schema será feito até surgirem requisitos do app. Abrir issues para propostas antes de alterar o OpenAPI.
