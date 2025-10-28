# MedicalTime API

Backend em Node.js + TypeScript, Express e Prisma para gerenciamento de lembretes de medicação, eventos de tomada, S.O.S. e notificações.

> Versão atual do contrato OpenAPI: **1.3.0** (ver `openapi.yaml`). Se você gerou SDKs em versões 1.0.x ou 1.1.x, regenere para obter paginação de histórico, respostas expandidas e o novo campo `graceEndsAt`.

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
# Observação sobre reset de senha
# A recuperação de senha por e-mail envia APENAS o TOKEN (sem link).
# O usuário deve colar o token na tela "/reset" do app/web.
# A variável abaixo pode ser mantida por compatibilidade com outros recursos,
# mas não é usada para montar links de reset:
FRONTEND_URL=http://localhost:8081
# Configurações SMTP (use Mailtrap para desenvolvimento)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=sua-mailtrap-username
SMTP_PASS=sua-mailtrap-password
MAIL_FROM=noreply@medicaltime.app

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

## Configuração de Email

O sistema possui funcionalidade de recuperação de senha via email. O e-mail de recuperação **envia apenas o token** (sem link). O usuário cola esse token na tela
"Redefinir senha" do aplicativo/web. Para configurar:

### Desenvolvimento (Mailtrap)

1. **Criar conta no Mailtrap:**

   - Acesse [mailtrap.io](https://mailtrap.io) e crie uma conta gratuita
   - Crie um inbox de teste
   - Copie as credenciais SMTP

2. **Configurar .env:**

   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=sua-mailtrap-username
   SMTP_PASS=sua-mailtrap-password
   MAIL_FROM=noreply@medicaltime.app
   EMAIL_DEV_LOG=true
   ```

3. **Testar configuração:**

   ```powershell
   node scripts/test-email.js
   ```

4. **Fluxo de recuperação (dev):**
   - Chame `POST /auth/forgot` com `{ email }`.
   - Verifique seu inbox no Mailtrap e copie o token do e-mail recebido.
   - No app/web, abra a tela `/reset`, cole o token e informe a nova senha.

### Produção

Para produção, configure um provedor real como:

- **Gmail:** `smtp.gmail.com:587`
- **Outlook:** `smtp.office365.com:587`
- **SendGrid, Mailgun, Amazon SES, etc.**

⚠️ **Importante:** Nunca use Mailtrap em produção!

Documentação completa: [docs/MAILTRAP_SETUP.md](./docs/MAILTRAP_SETUP.md)

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

### Recuperação de senha (token)

- `POST /auth/forgot` gera um token válido por 30 minutos e envia por e-mail (sem link).
- Na tela `/reset` do app/web, envie `{ token, password }` via formulário (o front chama `POST /auth/reset`).
- O token é marcado como usado após sucesso e não pode ser reutilizado.

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
- Caso o Expo mude para uma porta fora do par 8081/8082, execute `node ./scripts/sync-backend-frontend-url.js <host> <novaPorta>` para acrescentá-la (útil para outras features e compatibilidade). Note que o e-mail de reset **não usa links**, apenas token.
- O fluxo de refresh de token do front realiza fila de requisições paralelas; ao falhar o refresh a sessão é invalidada imediatamente.
