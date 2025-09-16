# Changelog

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
