# Changelog

## [1.2.0] - 2025-09-17

### Added

- Paginação experimental em `/intakes/history` via parâmetros `limit` (>=1) e `cursor` (ISO date-time) retornando envelope `{ data, pageInfo }`.
- Schema `IntakeHistoryPage` no OpenAPI e resposta documentada com `oneOf` (modo legado array OU página paginada) mantendo retrocompatibilidade.

### Changed

- Versão do OpenAPI `1.1.0` -> `1.2.0` para refletir adição de paginação experimental.

### Notes

- Modo paginado só é acionado quando `limit` é fornecido. O modo legado com `days` permanece intacto (sem breaking change).
- Cursor utiliza `scheduledAt` em ordem decrescente; clientes devem tratar `hasMore=false` ou `nextCursor=null` como fim.

## [1.1.0] - 2025-09-17

### Added

- Schema `AuthSession` no OpenAPI reutilizado em /auth/register, /auth/login e /auth/refresh.
- Schemas formais `Reminder`, `Schedule`, `ScheduleCreate/Update` agora referenciados nas respostas dos endpoints.
- Retornos enriquecidos de criação/atualização de Reminder e Schedule passam a devolver o Reminder completo (com `schedules`).
- Documentação expandida para `daysOfWeekBitmask` (exemplos: diário=0, úteis=62, fds=65, seg/qua/sex=42, ter/qui=20).

### Changed

- Version bump OpenAPI de 1.0.0 para 1.1.0 incluindo novas definições.
- Normalização de respostas de auth para aderir ao schema `AuthSession` (ordem e nomenclatura de campos consistentes).

### Fixed

- Correção de formatação YAML na descrição de bitmask (uso de string simples ao invés de bloco inválido).

### Notes

- Próximos passos planejados (não implementados ainda): envelope `{ data, error }` e paginação em histórico de intakes.

## [1.0.0] - 2025-09-16

Todas as mudanças notáveis deste projeto serão documentadas aqui. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/) e versionamento SemVer.

## [1.0.0] - 2025-09-16

### Added

- Autenticação completa: register, login (retornando user), refresh com rotação, logout global, recuperação de senha (forgot/reset) e PATCH /me (perfil e troca de senha).
- Modelos principais: Reminder, Schedule, IntakeEvent (com expansão `IntakeEventExpanded`), Device, EmergencyContact.
- Soft delete lógico de Reminders/Schedules (isActive=false) via DELETE /reminders/{id}.
- Geração de eventos de ingestão (scheduler) e processamento de alarmes com retries e marcação de MISSED.
- Providers de notificação: dev (log), WhatsApp (mock/test + desativação tokens inválidos), Expo (push com limpeza de tokens inválidos), esqueleto FCM.
- SOS: disparo para contatos de emergência com rate limit dedicado.
- ErrorResponse padronizado (400/401/404/409/429/500) + exemplos de erros no OpenAPI.
- Lista de endpoints e contratos OpenAPI 3.1.0 completa, com `operationId`, exemplos de sucesso e erros, e schema `IntakeEventExpanded`.
- SDK TypeScript gerado via openapi-typescript-codegen.
- Logging estruturado (Pino) + correlation id.
- Rate limits configuráveis para auth e SOS.
- Documentação para Front (`FRONTEND.md`) incluindo guias de uso do SDK, auth flow e parsing de erros.

### Changed

- Resposta de login/refresh para incluir objeto `user`, reduzindo necessidade de GET /me imediato.
- Intakes enriquecidos com `reminder` e `schedule` embutidos para evitar round trips.

### Fixed

- Ajustes de indentação e consistência YAML no OpenAPI.

### Security

- Uso de Helmet, CORS configurável e limpeza de tokens inválidos de push.

### Notes

- Paginação, upload de imagens real, métricas e versionamento avançado estão fora do escopo desta versão inicial.

[1.0.0]: https://example.com/releases/1.0.0 "ajuste este link caso publique releases"
