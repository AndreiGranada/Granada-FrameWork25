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

# Autenticação
JWT_SECRET="troque-este-segredo"

# Rate limit
RATE_LIMIT_AUTH_WINDOW=15m
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_SOS_WINDOW=1h
RATE_LIMIT_SOS_MAX=5

# E-mail (dev)
EMAIL_DEV_LOG=true
```

Dica: Em desenvolvimento, esta API usa pino-pretty para logs legíveis.

## Scripts NPM

- `npm run dev` — inicia o servidor em modo desenvolvimento (ts-node-dev)
- `npm run build` — gera saída JavaScript em `dist/`
- `npm start` — roda a versão compilada
- `npm run prisma:generate` — gera Prisma Client
- `npm run prisma:migrate` — cria/aplica migrações
- `npm test` — executa testes (Jest)

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

## Fluxo de Autenticação

- Após register/login, a API retorna `token` (JWT acesso) e `refreshToken`.
- Use `Authorization: Bearer <token>` em chamadas protegidas.
- Para renovar, chame `POST /auth/refresh` com `refreshToken` (rotação automática).
- `POST /auth/logout` revoga todos os refresh tokens do usuário.

## Jobs Ativos

- startIntakeScheduler: a cada 5 min, gera eventos das próximas 24h
- startAlarmProcessor: a cada 1 min, reenvia alarmes e marca MISSED após janela
- startCleanupJob: a cada 1h, remove tokens expirados/antigos e intakes > 90d

## Testes

- Framework: Jest + ts-jest + Supertest
- Rodar: `npm test`
- Setup limpa tabelas entre testes (`test/setup.ts`)

## Troubleshooting

- Erros de peer dependency: use `--force` apenas em dev quando necessário
- Porta ocupada: ajuste `PORT` no `.env`
- Problemas de timezone: confira `timezone` do usuário e bibliotecas `date-fns`/`date-fns-tz`

## Segurança

- Mantenha `JWT_SECRET` seguro
- Ajuste rate limits para produção
- Considere `helmet` e CORS restrito

## Licença

Uso interno/educacional. Adapte conforme sua necessidade.
