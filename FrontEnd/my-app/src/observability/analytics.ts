// Módulo de métricas/analytics genérico com provider configurável.
// Permite futura integração com Sentry, Amplitude, Segment, etc.
import { create } from 'zustand';

export interface AnalyticsEvent {
    name: string;
    props?: Record<string, any>;
    ts: number;
    correlationId?: string;
}

export interface AnalyticsProvider {
    track(event: AnalyticsEvent): void | Promise<void>;
    setUser?(user: { id: string; email?: string | null; name?: string | null } | null): void;
}

let provider: AnalyticsProvider | null = null;
let correlationIdProvider: (() => string | undefined) | null = null;

// Fila offline + persist (memória). Poderíamos usar AsyncStorage se necessário.
const pendingQueue: AnalyticsEvent[] = [];
let flushing = false;
let maxQueue = 500; // limite de segurança
let periodicTimer: any = null;

// Lista de chaves sensíveis que serão removidas/mascaradas
let sensitiveKeys: string[] = ['email', 'password', 'token', 'refreshToken', 'name'];
export function setSensitiveAnalyticsKeys(keys: string[]) { sensitiveKeys = keys; }

function sanitizeProps(props?: Record<string, any>): Record<string, any> | undefined {
    if (!props) return props;
    const clone: Record<string, any> = {};
    for (const k of Object.keys(props)) {
        if (sensitiveKeys.includes(k)) {
            clone[k] = '[redacted]';
        } else {
            const val = props[k];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                clone[k] = sanitizeProps(val);
            } else {
                clone[k] = val;
            }
        }
    }
    return clone;
}

function enqueue(ev: AnalyticsEvent) {
    if (pendingQueue.length >= maxQueue) pendingQueue.shift();
    pendingQueue.push(ev);
    dashboardPush(ev);
}

async function flushQueue() {
    if (flushing) return;
    if (!provider || pendingQueue.length === 0) return;
    flushing = true;
    try {
        // envia em lotes pequenos para não bloquear
        while (pendingQueue.length) {
            const ev = pendingQueue.shift()!;
            try { await provider.track(ev); } catch { /* re-enqueue? descartar para evitar loop */ }
        }
    } finally {
        flushing = false;
    }
}

export function setAnalyticsProvider(p: AnalyticsProvider | null) {
    provider = p;
    // ao definir provider, tenta flush imediato
    flushQueue();
    if (provider && !periodicTimer) {
        periodicTimer = setInterval(() => {
            flushQueue();
        }, 10000); // 10s
    }
    if (!provider && periodicTimer) {
        clearInterval(periodicTimer);
        periodicTimer = null;
    }
}

export function setCorrelationIdProvider(fn: (() => string | undefined) | null) {
    correlationIdProvider = fn;
}

export function trackEvent(name: string, props?: Record<string, any>) {
    const ev: AnalyticsEvent = {
        name,
        props: sanitizeProps(props),
        ts: Date.now(),
        correlationId: correlationIdProvider?.(),
    };
    try {
        if (!provider) {
            enqueue(ev); // offline / não configurado ainda
            return;
        }
        const maybe = provider.track(ev);
        dashboardPush(ev);
        if (maybe instanceof Promise) {
            maybe.catch(() => { /* erro silencioso */ });
        }
    } catch {
        enqueue(ev); // fallback se provider lançar
    }
}

export async function withTiming<T>(name: string, fn: () => Promise<T>, props?: Record<string, any>): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        trackEvent(name, { ...(props || {}), durationMs: Date.now() - start, status: 'ok' });
        return result;
    } catch (err: any) {
        trackEvent(name, { ...(props || {}), durationMs: Date.now() - start, status: 'error', error: err?.message });
        throw err;
    }
}

export function setAnalyticsUser(user: { id: string; email?: string | null; name?: string | null } | null) {
    try { provider?.setUser?.(user); } catch { /* noop */ }
}

// Provider interno de teste para facilitar assertions em Jest
export function createInMemoryAnalyticsSink() {
    const events: AnalyticsEvent[] = [];
    return {
        provider: { track: (e: AnalyticsEvent) => { events.push(e); } } as AnalyticsProvider,
        events,
    };
}

// Dashboard interno (últimos N eventos) ----------------------------------
interface AnalyticsDashboardState {
    recent: AnalyticsEvent[];
    push: (e: AnalyticsEvent) => void;
    limit: number;
}
export const useAnalyticsDashboardStore = create<AnalyticsDashboardState>((set, get) => ({
    recent: [],
    limit: 200,
    push: (e) => set(({ recent, limit }) => {
        const next = [...recent, e];
        if (next.length > limit) next.splice(0, next.length - limit);
        return { recent: next };
    })
}));

function dashboardPush(e: AnalyticsEvent) {
    try { useAnalyticsDashboardStore.getState().push(e); } catch { /* ignore */ }
}

// Provider Sentry (futuro) -------------------------------------------------
export function createSentryAnalyticsProvider(Sentry: any): AnalyticsProvider {
    return {
        track: (e) => {
            try {
                Sentry.addBreadcrumb?.({
                    category: 'analytics',
                    message: e.name,
                    data: { ...(e.props || {}), correlationId: e.correlationId },
                    level: 'info',
                });
            } catch { /* noop */ }
        },
        setUser: (u) => {
            try { Sentry.setUser?.(u ? { id: u.id, email: u.email, username: u.name } : null); } catch { /* noop */ }
        }
    };
}

// Utilitário para inspeção manual / debug (pode ser exposto em dev menu)
export function getPendingAnalyticsQueue(): readonly AnalyticsEvent[] {
    return pendingQueue;
}

// Helper de navegação / screen view
export function withScreen(screen: string, extra?: Record<string, any>) {
    trackEvent('screen_view', { screen, ...(extra || {}) });
}
