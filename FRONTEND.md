# Guia do Front-end (React Native + Expo)

Este guia descreve como criar o app cliente (React Native + Expo) para consumir a API do MedicalTime. Inclui setup de projeto, uso do SDK gerado via OpenAPI, autenticação com refresh, push notifications com Expo, React Query, navegação e exemplos práticos.

## Pré-requisitos

- Node.js 18+
- Expo (CLI): `npx expo`
- Editor com TypeScript
- Backend em execução (ex.: http://localhost:3000) com CORS_ORIGINS configurado para aceitar a origem do app (em dev pode deixar amplo, em prod restrinja)

## Visão Geral de Arquitetura do App

- Expo (SDK 51+)
- Navegação: React Navigation
- Data fetching/cache: React Query (tanstack)
- Validação opcional: Zod
- Armazenamento seguro de tokens: expo-secure-store
- Notificações push: expo-notifications (Expo Push)
- SDK de API: pasta `sdk/` gerada a partir do OpenAPI do backend

## 1) Criando o Projeto Expo

```bash
npx create-expo-app medicaltime-app --template
# selecione TypeScript quando perguntado (ou use um template TS)
cd medicaltime-app
```

### Dependências recomendadas

```bash
# Navegação
npx expo install react-native-screens react-native-safe-area-context
npm i @react-navigation/native @react-navigation/native-stack

# React Query
npm i @tanstack/react-query

# Tokens e Push (Expo)
npx expo install expo-secure-store expo-notifications

# Validação (opcional)
npm i zod
```

## 2) Usando o SDK gerado pelo backend

No backend, o SDK foi gerado em `sdk/` (via `npm run sdk:generate`). Copie essa pasta para o seu app, por exemplo para `src/sdk/`.

Estrutura esperada no app:

```
src/
  sdk/
    core/
    models/
    schemas/
    services/
    index.ts
```

## 3) Configuração da API (BASE e Token)

Crie `src/api/client.ts` no app para configurar a base URL da API e o token:

```ts
// src/api/client.ts
import { OpenAPI } from "../sdk/core/OpenAPI";

export function configureApi(baseUrl: string) {
  OpenAPI.BASE = baseUrl;
}

export function setAuthToken(
  getToken: () => Promise<string | undefined> | string | undefined
) {
  OpenAPI.TOKEN = async () => {
    const t = typeof getToken === "function" ? await getToken() : getToken;
    return t ? `Bearer ${t}` : "";
  };
}
```

No `App.tsx` (ou no bootstrap do app), chame:

```ts
import * as SecureStore from "expo-secure-store";
import { configureApi, setAuthToken } from "./src/api/client";

configureApi(process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000");
setAuthToken(() => SecureStore.getItemAsync("accessToken"));
```

Dica: configure `EXPO_PUBLIC_API_URL` no `app.json` / `app.config.ts`:

```json
{
  "expo": {
    "extra": {
      "eas": { "projectId": "..." },
      "apiUrl": "http://192.168.0.10:3000"
    }
  }
}
```

ou use variáveis `EXPO_PUBLIC_*` se preferir.

## 4) Autenticação com refresh automático

Crie um helper para repetir a requisição após refresh de token quando houver 401:

```ts
// src/api/call.ts
import { DefaultService } from "../sdk";
import * as SecureStore from "expo-secure-store";

let isRefreshing = false;
let queue: Array<() => void> = [];

async function refresh() {
  if (isRefreshing) {
    await new Promise<void>((resolve) => queue.push(resolve));
    return;
  }
  isRefreshing = true;
  try {
    const rt = await SecureStore.getItemAsync("refreshToken");
    if (!rt) throw new Error("Sem refresh token");
    const data = await DefaultService.postAuthRefresh({
      requestBody: { refreshToken: rt },
    });
    await SecureStore.setItemAsync("accessToken", data.token);
    await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  } finally {
    isRefreshing = false;
    queue.forEach((r) => r());
    queue = [];
  }
}

export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status === 401) {
      await refresh();
      return fn();
    }
    throw err;
  }
}
```

Crie um módulo de auth simples:

```ts
// src/auth/store.ts
import * as SecureStore from "expo-secure-store";
import { DefaultService } from "../sdk";

export async function login(email: string, password: string) {
  const data = await DefaultService.postAuthLogin({
    requestBody: { email, password },
  });
  await SecureStore.setItemAsync("accessToken", data.token);
  await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  return data;
}

export async function logout() {
  try {
    await DefaultService.postAuthLogout();
  } catch {}
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}
```

### Fluxo de Dados de Usuário

Agora as respostas de `POST /auth/register`, `POST /auth/login` e `POST /auth/refresh` retornam o objeto `user` juntamente com os tokens:

```jsonc
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "timezone": "America/Sao_Paulo"
  },
  "token": "<jwt>",
  "refreshToken": "<refresh>",
  "refreshExpiresAt": "2025-09-16T12:34:56.000Z"
}
```

Isso elimina a necessidade de chamar imediatamente `GET /me` após login ou refresh. O endpoint `GET /me` permanece disponível caso seja preciso revalidar o estado do usuário (ex.: tela de configurações ou após um cenário de restauração de sessão em que queira garantir consistência).

Exemplo de login consumindo diretamente o user retornado:

```ts
import { DefaultService } from "../sdk";
import * as SecureStore from "expo-secure-store";

async function doLogin(email: string, password: string) {
  const data = await DefaultService.postAuthLogin({
    requestBody: { email, password },
  });
  // data.user já disponível
  await SecureStore.setItemAsync("accessToken", data.token);
  await SecureStore.setItemAsync("refreshToken", data.refreshToken);
  return data.user; // { id, email, name, timezone }
}
```

Refresh também devolve `user`, permitindo atualizar rapidamente timezone/nome se alterados em outro dispositivo.

## 5) React Query setup

```ts
// src/utils/query.ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
```

No `App.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/utils/query";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Navegação */}
    </QueryClientProvider>
  );
}
```

Exemplo de uso:

```ts
import { useQuery } from "@tanstack/react-query";
import { DefaultService } from "../sdk";
import { apiCall } from "../api/call";

export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: () => apiCall(() => DefaultService.getReminders()),
  });
}
```

## 6) Navegação

- AuthStack: Login/Register/Forgot
- AppStack (tabs): Today, Reminders, History, SOS, Settings
- Se não houver `accessToken`, redirecionar para AuthStack.

## 7) Notificações Push (Expo)

Solicitar permissão e obter token Expo:

```ts
// src/notifications/expo.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token; // ExponentPushToken[...]
}
```

Registre o dispositivo no backend:

```ts
import { DefaultService } from "../sdk";
import { apiCall } from "../api/call";
import { Platform } from "react-native";

export async function syncDeviceToken(pushToken: string) {
  const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
  await apiCall(() =>
    DefaultService.postDevices({
      // Ajuste caso o serviço gere requestBody automaticamente no seu codegen
      // Alguns schemas podem requerer { requestBody: { platform, pushToken } }
    } as any)
  );
}
```

Observação: o backend já desativa tokens Expo inválidos automaticamente quando detectados.

## 8) Casos de Uso e Exemplos

- Registrar e logar:

```ts
await DefaultService.postAuthRegister({
  requestBody: { email, password, name },
});
await login(email, password); // salva tokens
```

- Listar e criar lembretes:

```ts
const reminders = await apiCall(() => DefaultService.getReminders());
await apiCall(() =>
  DefaultService.postReminders({
    requestBody: {
      name: "Dipirona",
      schedules: [{ ingestionTimeMinutes: 510, daysOfWeekBitmask: 0 }],
    },
  })
);
```

- Schedules (adicionar/remover):

```ts
await apiCall(() =>
  DefaultService.postRemindersSchedules({
    id: reminderId,
    requestBody: { ingestionTimeMinutes: 840, daysOfWeekBitmask: 42 },
  })
);
await apiCall(() => DefaultService.deleteRemindersSchedules({ scheduleId }));
```

- Intakes (futuros, histórico, marcar TAKEN):

```ts
const today = new Date().toISOString();
const next = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const intakes = await apiCall(() =>
  DefaultService.getIntakes({ from: today, to: next })
);

await apiCall(() => DefaultService.getIntakesHistory({ days: "7" }));
await apiCall(() => DefaultService.postIntakesTaken({ id: intakeId }));
```

## 8.1) Estrutura `IntakeEventExpanded`

O backend retorna eventos de ingestão já enriquecidos para evitar chamadas extras:

```jsonc
[
  {
    "id": "intk_1",
    "medicationReminderId": "rem_1",
    "medicationScheduleId": "sch_1",
    "scheduledAt": "2025-09-16T19:30:00.000Z",
    "status": "PENDING", // PENDING | TAKEN | MISSED
    "attempts": 0,
    "takenAt": null,
    "reminder": { "id": "rem_1", "name": "Vitamina D", "photoUrl": null },
    "schedule": { "id": "sch_1", "ingestionTimeMinutes": 510 }
  }
]
```

Campos:

- `scheduledAt` (UTC ISO) – converta para horário local ao exibir.
- `ingestionTimeMinutes` – minutos desde 00:00 (0..1439); útil para ordenar previsões futuras.
- `status` – alterar para `TAKEN` via `POST /intakes/{id}/taken`.
- `attempts` – número de tentativas de notificação / alarmes (pode ser usado para feedback ao usuário no futuro).
- `reminder.photoUrl` – pode ser `null`; exibir placeholder.

Estratégia de UI recomendada:

1. Separar lista em “Próximos” (status PENDING, horário >= agora) e “Passados” (TAKEN/MISSED ou já no passado).
2. Mostrar janela configurável: ex.: `?from=now&hours=6` para próximos 6h.
3. Para histórico use `GET /intakes/history?days=7` agrupando por dia.

Exemplo de tipagem (pode extrair do SDK):

```ts
interface IntakeEventExpanded {
  id: string;
  medicationReminderId: string;
  medicationScheduleId?: string | null;
  scheduledAt: string; // ISO UTC
  status: "PENDING" | "TAKEN" | "MISSED";
  attempts: number;
  takenAt?: string | null;
  reminder: { id: string; name: string; photoUrl?: string | null };
  schedule?: { id: string; ingestionTimeMinutes: number } | null;
}
```

Conversão de horário para exibição:

```ts
import { format } from "date-fns";

function formatIntakeLocal(scheduledAt: string) {
  const d = new Date(scheduledAt);
  return format(d, "HH:mm");
}
```

Ordenação por proximidade:

```ts
function sortByScheduled(a: IntakeEventExpanded, b: IntakeEventExpanded) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}
```

Detecção de atraso (MISSED provável):

```ts
function isLate(e: IntakeEventExpanded) {
  return (
    e.status === "PENDING" && new Date(e.scheduledAt).getTime() < Date.now()
  );
}
```

- S.O.S. (contatos + disparo):

```ts
const contacts = await apiCall(() =>
  DefaultService.getEmergencyEmergencyContacts()
);
await apiCall(() => DefaultService.postEmergencyEmergencyContacts()); // ajuste body conforme seu spec
await apiCall(() => DefaultService.postEmergencySos());
```

## 9) Tratamento de Erros e UX

- 401: tente `refresh()`; se falhar, redirecione para login
- 429 (rate limit): exiba mensagem amigável e espere
- 5xx: mostre “Tente novamente mais tarde”
- Use toasts/snackbars padronizados

### 9.1) Estrutura Padronizada de Erro

Todas as respostas de erro seguem o schema `ErrorResponse`:

```jsonc
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Falha de validação",
    "details": {
      /* opcional */
    }
  }
}
```

Principais códigos de `error.code` (case upper snake):

- `BAD_REQUEST`: validação / parâmetros inválidos. `details.issues` (array) pode listar `{ path: string[], message: string }`.
- `UNAUTHORIZED`: token ausente ou inválido/expirado.
- `NOT_FOUND`: recurso não existe ou não pertence ao usuário.
- `CONFLICT`: conflito de negócio (ex.: email já usado, senha atual incorreta).
- `RATE_LIMIT`: muitas requisições; campo `details.retryAfterSeconds` pode vir.
- `INTERNAL_ERROR`: exceção não tratada.

Sugestão de helper para mapear erro:

```ts
export interface ApiIssue {
  path: string[];
  message: string;
}
export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: { issues?: ApiIssue[]; [k: string]: any };
  };
}

export function parseApiError(err: unknown): string {
  const anyErr = err as any;
  const data: ApiErrorShape | undefined =
    anyErr?.body || anyErr?.response?.body;
  if (!data?.error) return "Erro inesperado";
  if (data.error.details?.issues?.length) {
    return data.error.details.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
  }
  return data.error.message;
}
```

Uso com React Query:

```ts
try {
  await mutationFn();
} catch (e) {
  showToast(parseApiError(e));
}
```

## 10) Timezone e Datas

- O backend agenda eventos considerando `timezone` do usuário; `scheduledAt` chega em ISO UTC
- No app, mostre horários no fuso local (use Intl.DateTimeFormat ou dayjs/luxon se preferir)

## 11) Checklist para subir o app

- [ ] Definir `OpenAPI.BASE` com a URL correta do backend
- [ ] Configurar `OpenAPI.TOKEN` via `setAuthToken`
- [ ] Implementar login/refresh/logout e persistência de tokens no SecureStore
- [ ] Integrar React Query para listas e mutações
- [ ] Implementar telas: Today, Reminders CRUD, History, SOS, Settings
- [ ] Registrar push token e enviar para `/devices`
- [ ] Tratar erros comuns (401/429/5xx)
- [ ] Ajustar CORS_ORIGINS no backend para o domínio do app (produção)

## 12) Dicas de Desenvolvimento

- Em dev, use o modo Tunnel do Expo se o dispositivo não estiver na mesma rede
- Use `X-Correlation-Id` nos requests se quiser rastreabilidade completa; o servidor ecoa esse header
- A API tem documentação interativa em `/docs` (Swagger UI). Use o botão “Authorize” com seu JWT.

## 13) Scripts Úteis (Backend)

- `npm run sdk:generate` — regenera a pasta `sdk/` após alterações no `openapi.yaml`
- `npm test` — roda a suíte de testes do backend

---

Se quiser, posso fornecer um esqueleto de telas (Login, TodayIntakes e RemindersList) já conectadas ao SDK e React Query, ou gerar um mini SDK por cima do codegen com helpers de auth/refresh inclusos.

## 14) Mapa completo de endpoints e exemplos (SDK)

Notas gerais:

- Autorização: use `Authorization: Bearer <token>` nas rotas protegidas (praticamente todas, exceto `/health` e as rotas de `/auth/*`).
- Status típicos: 200 (OK), 201 (Criado), 204 (Sem conteúdo), 400 (entrada inválida), 401 (não autorizado), 404 (não encontrado), 409 (conflito), 429 (rate limit), 5xx (erro servidor).
- Cabeçalhos opcionais: envie `X-Correlation-Id` para rastreabilidade. Com o SDK, você pode definir `OpenAPI.HEADERS`.
- Timezone: `scheduledAt` é ISO UTC; exiba no fuso do usuário.
- Bitmask de dias (daysOfWeekBitmask): 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb; 0 => todos.

Como configurar headers extras no SDK:

```ts
import { OpenAPI } from "./src/sdk/core/OpenAPI";
OpenAPI.HEADERS = async () => ({ "X-Correlation-Id": "app-<uuid>" });
```

### Health

- GET `/health` → 200

Exemplo:

```ts
await DefaultService.getHealth();
```

### Autenticação

- POST `/auth/register` → 201 | 409
  - body: { email, password, name? }
- POST `/auth/login` → 200 | 401
  - body: { email, password }
- POST `/auth/forgot` → 200
  - body: { email }
- POST `/auth/reset` → 200 | 400
  - body: { token, password }
- POST `/auth/refresh` → 200 | 401
  - body: { refreshToken }
- POST `/auth/logout` → 200

Exemplos:

```ts
await DefaultService.postAuthRegister({
  requestBody: { email, password, name },
});
const auth = await DefaultService.postAuthLogin({
  requestBody: { email, password },
});
await DefaultService.postAuthForgot({ requestBody: { email } });
await DefaultService.postAuthReset({ requestBody: { token, password } });
const renewed = await DefaultService.postAuthRefresh({
  requestBody: { refreshToken },
});
await DefaultService.postAuthLogout();
```

### Reminders (Lembretes)

- GET `/reminders` → 200
- POST `/reminders` → 201
  - body: { name, schedules?: Schedule[] }
- GET `/reminders/{id}` → 200 | 404
- PATCH `/reminders/{id}` → 200 | 404
- POST `/reminders/{id}/schedules` → 201
  - body: { ingestionTimeMinutes, daysOfWeekBitmask }
- PATCH `/reminders/schedules/{scheduleId}` → 200
- DELETE `/reminders/schedules/{scheduleId}` → 204

Exemplos:

```ts
const list = await DefaultService.getReminders();
await DefaultService.postReminders({
  requestBody: {
    name: "Dipirona",
    schedules: [{ ingestionTimeMinutes: 510, daysOfWeekBitmask: 0 }],
  },
});
const one = await DefaultService.getReminders1({ id: reminderId });
await DefaultService.patchReminders({
  id: reminderId /*, requestBody: {...} se definido no spec */,
});
await DefaultService.postRemindersSchedules({
  id: reminderId,
  requestBody: { ingestionTimeMinutes: 840, daysOfWeekBitmask: 42 },
});
await DefaultService.patchRemindersSchedules({ scheduleId });
await DefaultService.deleteRemindersSchedules({ scheduleId });
```

### Intakes (Eventos de Tomada)

- GET `/intakes` (query: from, to, hours, status) → 200
- GET `/intakes/history` (query: days) → 200
- POST `/intakes/{id}/taken` → 200 | 404

Exemplos:

```ts
const from = new Date().toISOString();
const to = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
const list = await DefaultService.getIntakes({ from, to });
const hist = await DefaultService.getIntakesHistory({ days: "7" });
await DefaultService.postIntakesTaken({ id: intakeId });
```

### Emergency (S.O.S.)

- GET `/emergency/emergency-contacts` → 200
- POST `/emergency/emergency-contacts` → 201
- PATCH `/emergency/emergency-contacts/{id}` → 200
- DELETE `/emergency/emergency-contacts/{id}` → 204
- POST `/emergency/sos` → 200

Exemplos:

```ts
const contacts = await DefaultService.getEmergencyEmergencyContacts();
await DefaultService.postEmergencyEmergencyContacts(/* { requestBody: {...} } se aplicável */);
await DefaultService.patchEmergencyEmergencyContacts({
  id: contactId /*, requestBody */,
});
await DefaultService.deleteEmergencyEmergencyContacts({ id: contactId });
await DefaultService.postEmergencySos();
```

### Devices (Dispositivos para Push)

- GET `/devices` → 200
- POST `/devices` → 201
- PATCH `/devices/{id}` → 200
- DELETE `/devices/{id}` → 204

Exemplos:

```ts
const devices = await DefaultService.getDevices();
await DefaultService.postDevices(/* { requestBody: { platform: 'ANDROID'|'IOS', pushToken } } se aplicável */);
await DefaultService.patchDevices({ id: deviceId /*, requestBody */ });
await DefaultService.deleteDevices({ id: deviceId });
```

### Dev (somente em desenvolvimento)

- POST `/dev/test-sos` → 200
- POST `/dev/test-alarm` → 200

Exemplos:

```ts
await DefaultService.postDevTestSos();
await DefaultService.postDevTestAlarm();
```

### Esquemas principais (para referência rápida)

- User: { id, email, name? }
- Reminder: { id, name, isActive }
- Schedule: { id, ingestionTimeMinutes, daysOfWeekBitmask }
- IntakeEvent: { id, userId, scheduledAt, status: 'PENDING'|'TAKEN'|'MISSED', attempts }
- Device: { id, platform: 'ANDROID'|'IOS', pushToken, isActive }
- EmergencyContact: { id, name, phone, priority, isActive }

### Tratamento de erros e rate limit

- Autenticação: 401 → tente `refresh()`; se falhar, redirecione para login.
- Conflitos: 409 em `/auth/register` quando e-mail existe.
- Rate limit (ex.: /auth e /emergency/sos): 429 → exiba feedback amigável e permita nova tentativa após alguns segundos/minutos.
- Genéricos: 5xx → mensagem “Tente novamente mais tarde”.

### Dicas operacionais para o front

- Garanta `CORS_ORIGINS` configurado no backend com o domínio do seu app.
- Use HTTPS em produção.
- Propague `X-Correlation-Id` nas requisições críticas para facilitar suporte.
