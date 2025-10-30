import { logger } from '@/src/lib/logger';
import { setCorrelationIdProvider } from '@/src/observability/analytics';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { OpenAPI } from '@/sdk-backend';
let accessToken: string | null = null; // Declarado cedo para ser usado no lazy import
let refreshToken: string | null = null;

// Referência direta ao OpenAPI do SDK (import estático para evitar problemas do async-require no Web)
let OpenAPIRef: any = OpenAPI;
if (OpenAPIRef) {
    OpenAPIRef.BASE = API_BASE_URL;
    OpenAPIRef.TOKEN = () => (accessToken ? `Bearer ${accessToken}` : undefined);
}

export type User = {
    id: string;
    email: string;
    name?: string | null;
    timezone: string;
};

export type Session = {
    token: string;
    refreshToken: string;
    refreshExpiresAt: string;
    user: User;
};

export const api = axios.create({ baseURL: API_BASE_URL });
// Dev helper (somente em dev real, não em produção buildada)
if (process.env.NODE_ENV === 'development') {
    logger.info(`[api] baseURL: ${API_BASE_URL}`);
}

// (variáveis já declaradas acima para permitir uso no lazy import)

export function setSession(session: Session | null) {
    accessToken = session?.token ?? null;
    refreshToken = session?.refreshToken ?? null;
    // Reflete também no SDK se já carregado
    if (OpenAPIRef) {
        // Resolver dinâmico garante uso do token mais recente (evita condição de corrida após refresh)
        // e já retorna com prefixo Bearer
        OpenAPIRef.TOKEN = () => (accessToken ? `Bearer ${accessToken}` : undefined);
    }
}

// Allow consumers (e.g., AuthProvider) to persist refreshed tokens
export type TokensRefreshed = {
    token: string;
    refreshToken: string;
    refreshExpiresAt?: string;
};
let tokensRefreshedHandler: ((tokens: TokensRefreshed) => void) | null = null;
export function onTokensRefreshed(handler: ((tokens: TokensRefreshed) => void) | null) {
    tokensRefreshedHandler = handler;
}
// Auxiliar ONLY para testes: permite disparar manualmente evento de refresh
export function __TESTING_INVOKE_REFRESH(tokens: TokensRefreshed) {
    tokensRefreshedHandler?.(tokens);
}

// Test helper: permite injetar referência OpenAPI simulada evitando import dinâmico no Jest
export function __TESTING_SET_OPENAPI(ref: any) {
    OpenAPIRef = ref;
}

// Auth failure (refresh impossível ou refresh retornou 401/403) => consumidores podem fazer logout.
type AuthFailureHandler = (() => void) | null;
let authFailureHandler: AuthFailureHandler = null;
export function onAuthFailure(handler: AuthFailureHandler) {
    authFailureHandler = handler;
}

function generateCorrelationId() {
    // RFC4122 v4-like, fallback without external deps
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

let lastCorrelationId: string | undefined = undefined;
setCorrelationIdProvider(() => lastCorrelationId);

// Expor o último correlation id para facilitar debug no front (dev-only)
export function getLastCorrelationId(): string | undefined {
    return lastCorrelationId;
}

api.interceptors.request.use((cfg) => {
    if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
    // Optional correlation id for easier tracing across backend logs
    if (!cfg.headers['X-Correlation-Id']) {
        cfg.headers['X-Correlation-Id'] = generateCorrelationId();
    }
    lastCorrelationId = cfg.headers['X-Correlation-Id'] as string;
    return cfg;
});

let refreshing = false;
let queue: (() => void)[] = [];

api.interceptors.response.use(
    (r) => {
        // Log leve em dev para o fluxo de esqueci senha
        if (process.env.NODE_ENV === 'development') {
            try {
                const url = r?.config?.url || '';
                if (typeof url === 'string' && url.includes('/auth/forgot')) {
                    console.info('[api][forgot][response]', {
                        status: r.status,
                        data: r.data,
                        correlationId: r.headers?.['x-correlation-id'] || lastCorrelationId,
                    });
                }
            } catch { /* noop */ }
        }
        return r;
    },
    async (error) => {
        const original = error.config || {};
        const status = error?.response?.status;
        const isRefreshCall = original?.url === '/auth/refresh';
        if (status === 401 && isRefreshCall) {
            // Refresh em si falhou -> notifica e aborta sem tentar novo refresh
            authFailureHandler?.();
            throw error;
        }
        if (status === 401 && refreshToken && !original._retry) {
            original._retry = true;
            if (!refreshing) {
                refreshing = true;
                try {
                    const { data } = await api.post('/auth/refresh', { refreshToken });
                    accessToken = data.token;
                    refreshToken = data.refreshToken;
                    // notify listeners so they can persist updated tokens/session
                    tokensRefreshedHandler?.({
                        token: data.token,
                        refreshToken: data.refreshToken,
                        refreshExpiresAt: data.refreshExpiresAt,
                    });
                    if (OpenAPIRef) {
                        OpenAPIRef.TOKEN = () => (accessToken ? `Bearer ${accessToken}` : undefined);
                    }
                    const pending = [...queue];
                    queue = [];
                    pending.forEach((fn) => fn());
                    return api(original);
                } catch (e) {
                    queue = [];
                    // Notifica para que a aplicação faça logout imediato
                    authFailureHandler?.();
                    throw e;
                } finally {
                    refreshing = false;
                }
            }
            return new Promise((resolve, reject) => {
                queue.push(() => api(original).then(resolve).catch(reject));
            });
        }
        throw error;
    }
);
