# Checklist (status atual resumido)

- [x] GET /me
- [x] DELETE /reminders/{id} OU estratégia documentada (soft delete implementado)
- [x] Schemas PATCH + bodies ausentes adicionados
- [x] Body POST /devices / emergency-contacts definidos
- [x] ErrorResponse + referências (400/401/404/409/429/500 padronizados)
- [x] 429 documentado onde aplicável
- [x] Login retorna user (decisão tomada)
- [x] Formato de listagem padronizado (array simples) e documentado no OpenAPI
- [x] Intakes retornam nome do reminder
- [x] Examples adicionados (login, reminder, schedule, intakes, device, SOS)
- [x] Examples de erros padronizados (400/401/404/409/429/500) adicionados
- [x] SDK regenerado (após próximos ajustes)
- [x] PATCH /me implementado (perfil & senha)

> Versão **v1.0.0** congelada em 2025-09-16. Mudanças futuras seguirão SemVer (ver CHANGELOG.md).

# Gaps Essenciais para Consumo do Front

Este arquivo lista SOMENTE o que ainda precisa ser ajustado no backend para o front React Native/Expo integrar sem fricção. Foque nesses pontos antes de evoluções não críticas.

## 1. Endpoints / Recursos Mínimos

1. GET /me
   - Retorna: { id, email, name, timezone }
   - Uso: hidratar estado do usuário após login/refresh sem segunda chamada derivada.
2. (Opcional mas recomendado) PATCH /me
   - Body: { name?, timezone?, passwordCurrent?, passwordNew? }
   - Permite edição de perfil e troca de senha autenticado.
3. DELETE /reminders/{id} OU confirmar estratégia oficial (ex.: PATCH isActive=false) e documentar no OpenAPI.
4. Upload de foto (se UI inicial exigir) — pode ser adiado; se adiar, documentar que `photoUrl` é setado externamente.

## 2. OpenAPI Ajustes (Bloqueadores de DX)

Concluído: schemas de body e listagens, ErrorResponse padronizado referenciado em 400/401/404/409/429/500, formato definido (arrays simples), exemplos adicionados (login, reminder, schedule, intakes, device, SOS), 429 documentado.

Pendente (opcional): OperationId amigáveis para melhorar nomes no SDK, exemplos de erros adicionais.
Atualização: operationIds amigáveis já adicionados e SDK regenerado.

## 3. Respostas de Auth

1. POST /auth/login — incluir user no payload: { token, refreshToken, user: { id, email, name, timezone } }
2. POST /auth/refresh — opcional incluir user (se quiser manter simples pode retornar só tokens; se incluir, reduz necessidade de GET /me em alguns fluxos). Se optar por manter simples, assegure o GET /me.

## 4. Consistência de Listagens

Definir agora (antes do front depender) se listagens devolvem:

- Array puro (ex.: `[ {..}, {..} ]`) OU
- Envelope `{ items: [...], total: number }`

Decisão executada deve ser replicada em:

- GET /reminders
- GET /intakes
- GET /intakes/history (se não for só array)
- GET /devices
- GET /emergency/emergency-contacts

## 5. Campos de Relacionamento nos Intakes

Confirmar se GET /intakes inclui ao menos: `medicationReminder: { id, name }`.
Se não incluir, ajustar seleção no serviço para evitar round trips extras do front.

## 6. Rate Limit / Códigos

Adicionar 429 com descrição e referência ao ErrorResponse em:

- /auth/register, /auth/login (se aplicar), /auth/forgot
- /emergency/sos

## 7. Documentação de Bitmask e Timezone

Adicionar (se ainda não estiver no OpenAPI `description`):

- Bitmask: 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb; 0 => todos.
- `ingestionTimeMinutes`: minutos desde 00:00 (0..1439)
- `scheduledAt`: ISO UTC.

## 8. Ordem Recomendada de Implementação

1. (FEITO) /me + login retorna user + soft delete reminders
2. (FEITO) Schemas, ErrorResponse, listagens, exemplos, 429
3. (AGORA) Intakes incluir nome do reminder
4. Regenerar SDK
5. (Opcional) OperationIds amigáveis / PATCH /me / exemplos de erros

## 9. Ações Pós-Ajustes

1. Rodar `npm run sdk:generate` para atualizar o SDK do front.
2. Atualizar FRONTEND.md se formato de resposta mudar.
3. Front substituir chamadas extras (ex.: buscar user após login) pelo novo payload.

## 10. Itens Explicitamente Fora do Escopo Agora

- RS256 / key rotation (segurança avançada)
- Métricas / readiness endpoint
- Paginação e filtros avançados
- Upload de imagens (se não houver UI imediata)
- FCM provider real (só se push nativo for exigido agora)

---

Checklist rápido (marque ao implementar):

- [x] GET /me
- [x] DELETE /reminders/{id} OU estratégia documentada (soft delete implementado)
- [x] Schemas PATCH + bodies ausentes adicionados
- [x] Body POST /devices / emergency-contacts definidos
- [x] ErrorResponse + referências (400/401/404/409/429/500 padronizados)
- [x] 429 documentado onde aplicável
- [x] Login retorna user (decisão tomada)
- [x] Formato de listagem padronizado (array simples) e documentado no OpenAPI
- [x] Intakes retornam nome do reminder
- [x] Examples adicionados (login, reminder, schedule, intakes, device, SOS)
- [x] SDK regenerado (após próximos ajustes)

## 11. Próximo Passo Imediato

Expandir resposta de GET /intakes e /intakes/history para incluir o nome do reminder (evitar round trips no front):

Proposta:

- Novo schema `IntakeEventExpanded` com campo `reminder: { id, name }` (ou apenas `reminderName` simples se quiser payload menor).
- Prisma: incluir relacionamento do reminder na query de construção dos eventos.
- OpenAPI: atualizar responses para usar o novo schema.
- Regenerar SDK após a mudança.

Critério de pronto: front consegue listar eventos de ingestão já exibindo o nome do medicamento sem chamada adicional.

## 12. Próximos Opcionais Sugeridos

- Adicionar PATCH /me (atualização de perfil e troca de senha)
- Exemplos de erros padronizados (ex.: 400 e 401) para referência de parsing no front
- Documentar no README/FRONTEND.md o shape de `IntakeEventExpanded`
- Preparar estratégia de versionamento futuro (ex.: header X-API-Version ou prefixo /v1)
