# Log de Desenvolvimento - MedicalTime

## Resumo Atual

Aplicação de agenda de medicações com suporte a múltiplos horários, alarmes com reintentos, histórico de tomadas (90 dias), contatos de emergência (S.O.S.), envio de notificações e recuperação de senha.

## Linha do Tempo

- Definição inicial do schema Prisma (modelos principais: User, MedicationReminder, IntakeEvent, EmergencyContact, Device, PasswordResetToken)
- Tradução e documentação em pt-BR no `schema.prisma`
- Ajuste para múltiplos horários (criação de `MedicationSchedule` e remoção de campos de horário único no reminder)
- Adição de campo `timezone` em `User` com default `America/Sao_Paulo`
- Reset + migrate + generate executados com sucesso
- Infra básica Express + Prisma + rotas de autenticação
- Recuperação de senha (forgot/reset) com `PasswordResetToken`
- CRUD de lembretes e schedules (item 4 concluído)
- Endpoints de IntakeEvents (listar futuros, histórico, marcar taken)
- Scheduler de geração de IntakeEvents (próximas 24h a cada 5 min)
- Processador de alarmes (reenvio + marca MISSED) a cada 1 min
- CRUD de contatos de emergência + endpoint `/emergency/sos`
- CRUD de dispositivos (registro/atualização/desativação)
- Implementação de refresh tokens rotacionados (modelo `RefreshToken`, rotas /auth/refresh e /auth/logout)
- Testes iniciais (Jest + Supertest) cobrindo auth (register/login/refresh), criação de reminder e marcação de intake
- Camada de Notificações (provider de desenvolvimento) integrada ao processador de alarmes e S.O.S.
- Parametrização de tempos de alarmes via .env e import tipado de date-fns-tz ajustado
- Providers de notificação preparados (FCM/Expo) e seleção por env (`NOTIFY_PROVIDER`, `NOTIFY_DRY_RUN`)
- Push via Expo implementado (envio real) com desativação automática de tokens inválidos
- WhatsApp provider aprimorado (retry/backoff, logs estruturados e suporte opcional a templates)
- Testes ampliados: providers (Expo/WhatsApp) e job de alarmes (retries/MISSED)
- Segurança HTTP: Helmet habilitado e CORS configurável via `CORS_ORIGINS`
- Observabilidade: correlationId via AsyncLocalStorage, log de requests e propagação para providers/jobs
- Endpoints de desenvolvimento: `/dev/test-sos` e `/dev/test-alarm` (somente quando `NODE_ENV != production`)
- Tuning de índices (Prisma):
  - IntakeEvent: índices compostos `[status, scheduledAt]` e `[userId, scheduledAt]` e unique `[userId, medicationScheduleId, scheduledAt]`
  - EmergencyContact: índice composto `[userId, isActive, priority]`
  - Device: índice composto `[userId, isActive]`
  - Scheduler resiliente a duplicidade (ignora P2002 ao criar `IntakeEvent`)

## Modelos Principais

- User: autenticação, timezone, relacionamento geral
- MedicationReminder: metadados da medicação
- MedicationSchedule: horários (minutos a partir de 00:00) + dias da semana via bitmask
- IntakeEvent: instância concreta de tomada (status PENDING/TAKEN/MISSED)
- EmergencyContact: até 5 contatos S.O.S.
- Device: registro de token para push/alarme
- PasswordResetToken: fluxo de recuperação de senha
- RefreshToken: sessão prolongada com rotação e revogação

## Regras e Decisões

1. `daysOfWeekBitmask`: 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb; 0 => todos os dias
2. Múltiplos horários via `MedicationSchedule` (flexível para escalonar posologia)
3. Histórico de `IntakeEvent` limpo acima de 90 dias via job de limpeza (implementado)
4. Reenvio de alarme: até 2 reintentos (total 3 disparos) a cada 15 minutos (lógica em serviço, não no banco)
5. `attempts` conta disparos realizados (inicia em 0 antes do primeiro envio)
6. Timezone armazenado por usuário para conversão de horários locais -> UTC em geração de eventos
7. `pricePaid` opcional para controle de custo (decimal 10,2)
8. Fotos armazenadas externamente referenciadas por `photoUrl`
9. Chaves estrangeiras com `onDelete: Cascade` (exceto schedule opcional em IntakeEvent que usa `SetNull`)
10. Possível futura expansão: dosagem, quantidade em estoque, lembrete de reposição.

## Status dos Itens Técnicos

| Item | Descrição                                 | Status                                                       |
| ---- | ----------------------------------------- | ------------------------------------------------------------ |
| 1    | Infra inicial (Express / Prisma / dotenv) | Concluído                                                    |
| 2    | Autenticação (register/login + JWT)       | Concluído (inclui refresh tokens rotacionados)               |
| 3    | Recuperação de senha (forgot/reset)       | Concluído                                                    |
| 4    | CRUD de medicações + schedules            | Concluído                                                    |
| 5    | Geração de IntakeEvents                   | Concluído (job simples)                                      |
| 6    | Atualização de status (taken, MISSED)     | Concluído (MISSED via job; janela configurável futuramente)  |
| 7    | Reenvio de alarmes                        | Concluído (integrado a provider; testado)                    |
| 8    | S.O.S. contatos e endpoint                | Concluído (WhatsApp integrado; depende de credenciais)       |
| 9    | Dispositivos (registro/lista)             | Concluído                                                    |
| 10   | Observabilidade (logger, rate limit)      | Concluído (logger pino + rate limiting /auth & /emergency)   |
| 11   | Limpeza (tokens expirados / eventos >90d) | Concluído (job hourly)                                       |
| 12   | Integração push/WhatsApp real             | Parcial (Expo push implementado; WhatsApp com retry/backoff) |
| 13   | Testes automatizados                      | Parcial (auth, reminders/intakes, providers, alarmes)        |
| 14   | Documentação README                       | Concluído (README.md adicionado)                             |
| 15   | Ajustar import tipado date-fns-tz         | Concluído                                                    |

## Endpoints Atuais (Resumo)

Auth:

- POST /auth/register
- POST /auth/login
- POST /auth/forgot
- POST /auth/reset
- POST /auth/refresh
- POST /auth/logout

Reminders / Schedules:

- POST /reminders
- GET /reminders
- GET /reminders/:id
- PATCH /reminders/:id
- POST /reminders/:id/schedules
- PATCH /reminders/schedules/:scheduleId
- DELETE /reminders/schedules/:scheduleId

Intakes:

- GET /intakes (query: from, to, hours, status)
- GET /intakes/history?days=n
- POST /intakes/:id/taken

Emergency:

- POST /emergency/emergency-contacts
- GET /emergency/emergency-contacts
- PATCH /emergency/emergency-contacts/:id
- DELETE /emergency/emergency-contacts/:id
- POST /emergency/sos

Devices:

- POST /devices
- GET /devices
- PATCH /devices/:id
- DELETE /devices/:id

Health:

- GET /health

## Jobs Ativos

1. Scheduler de geração (`startIntakeScheduler`):
   - Frequência: 5 min
   - Horizonte: próximas 24h
   - Lógica: cria eventos para schedules ativos respeitando bitmask e timezone
2. Processador de alarmes (`startAlarmProcessor`):

- Frequência: 1 min
- Reenvio: até 3 tentativas (0 inicial + 2 retries) com intervalo de 15 min
- MISSED: após 45 min ou excedido limite de tentativas

3. Limpeza (`startCleanupJob`):

- Frequência: 1h
- Ações: remove PasswordResetToken expirado ou usado há >1 dia e IntakeEvent com scheduledAt < agora-90 dias

## Próximos Passos Imediatos

1. Expandir testes (forgot/reset, scheduler, limpeza, rate limit)
2. Implementar FCM (envio real) com testes
3. Considerar fila (BullMQ/Redis) para escalonar alarmes e reduzir carga
4. Endpoint(s) de suporte/ops (reprocessar alarmes, forçar geração) restritos a dev/admin

## Observações de Performance / Melhorias Futuras

- Reduzir N+1 ao gerar eventos (carregar usuários e schedules em lotes)
- Introduzir fila (BullMQ / Redis) para desacoplar disparo de push/whatsapp
- Índices compostos adicionados (ex.: `IntakeEvent(status, scheduledAt)`, `IntakeEvent(userId, scheduledAt)`) e unique lógico para deduplicar
- Cache de timezone por usuário em memória (Map) para reduzir queries repetidas no scheduler

## Segurança (Pontos a Endereçar)

- JWT refresh + revogação (lista de bloqueio ou rotacionamento)
- Rate limit /auth e /emergency/sos
- Sanitização adicional de entrada (já há Zod, complementar com limites de payload)
- Configurar CORS restrito em produção
- Helmet para headers de segurança

## Backlog Futuro (Ideias)

- Dose / quantidade e alerta de reposição
- Exportação de histórico (PDF/CSV)
- Multi-idioma (i18n)
- Tema claro/escuro para apps clientes
- Auditoria (log detalhado de alterações de lembretes)

## Estrutura de Bitmask Exemplo

Selecionar Seg, Qua, Sex: 2 + 8 + 32 = 42. Valor armazenado = 42.

## Exemplos de Conversão de Horário

- 08:30 => 8\*60 + 30 = 510
- 20:00 => 20\*60 = 1200

## Exemplo de Criação (pseudo-código)

```ts
await prisma.medicationReminder.create({
  data: {
    userId,
    name: "Dipirona",
    purpose: "Dor / Febre",
    schedules: {
      create: [
        { ingestionTimeMinutes: 480 }, // 08:00
        { ingestionTimeMinutes: 840 }, // 14:00
        { ingestionTimeMinutes: 1200 }, // 20:00
      ],
    },
  },
  include: { schedules: true },
});
```

## Riscos / Pontos de Atenção

- Job de geração de eventos deve evitar duplicação (usar chave única lógica? userId+schedule+scheduledAt)
- Timezone de verão (DST) pode alterar horários — considerar biblioteca (luxon, date-fns-tz)
- Limpeza de eventos antigos e tokens expirados (cron)
- Segurança dos tokens de reset (expiração + single use)
- Persistência de push tokens inválidos (remover ao receber erro permanente)

## Próximas Decisões a Tomar

- Biblioteca de hashing: bcrypt vs argon2
- Estratégia de notificação: push nativo + fallback (local notification) vs somente push
- Provedor oficial WhatsApp (custos e aprovação de templates)
- Implementar fila (BullMQ / RabbitMQ) para escalabilidade de alarmes

## Histórico de Versões do Schema

- v1: Modelo inicial com horário único por lembrete
- v2: Introduz `MedicationSchedule` + campo `timezone` em `User` + ajuste de `IntakeEvent`
- v3: Adiciona modelo `RefreshToken` para suporte a refresh tokens rotacionados
- v4: Índices compostos e unique em `IntakeEvent`; índices compostos em `EmergencyContact` e `Device`

## Testes Automatizados (Estado Atual)

Stack: Jest + ts-jest + Supertest.

Cobertura atual:

- Auth: register, login, refresh (fluxo principal) e cenário de login inválido
- Recuperação de senha: forgot/reset (inclui token inválido/expirado e rate limit em /auth/register)
- Reminders/Intakes: criação de reminder com schedule simples e marcação TAKEN
- Scheduler e limpeza: geração de IntakeEvents sem duplicidade e remoção de eventos >90 dias e tokens expirados/antigos
- Providers: Expo (filtro tokens, envio em lote e desativação de tokens inválidos), WhatsApp (dry-run, retry/backoff, template)
- Job de alarmes: envio e incremento de attempts, retries até MAX_ATTEMPTS e marcação MISSED

Observação: Toda a suíte de testes passa localmente (7 suites, 16 testes).

---

Última atualização: (manter manualmente) 2025-09-16 – testes expandidos e validados
