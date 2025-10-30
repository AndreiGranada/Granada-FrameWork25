// Utilitário central para tratamento de erros em adapters
// Extrai mensagem padronizada de erro de resposta HTTP ou usa fallback.
// Import do Sentry tornado lazy/opcional para evitar quebra em ambiente de teste (Jest) sem módulos nativos.
import { toFriendlyError } from './friendlyError';

let _sentryCache: any | undefined;
function getSentry(): any | null {
    if (_sentryCache !== undefined) return _sentryCache;
    // Desabilita em testes (reduz ruído e evita require de módulos nativos expo)
    if (process.env.JEST_WORKER_ID) {
        _sentryCache = null;
        return _sentryCache;
    }
    try {
        // Se initSentry ainda não marcou pronto, evitamos import para não forçar carga prematura em Android.
        if (!(global as any).__SENTRY_LAZY_READY__) {
            _sentryCache = null;
            return _sentryCache;
        }
        const maybe = (global as any).__SENTRY_EXPO__ || null;
        if (maybe) {
            _sentryCache = maybe;
            return _sentryCache;
        }
    } catch { /* ignore */ }
    _sentryCache = null;
    return _sentryCache;
}

export function mapError(raw: any, fallback: string): string {
    return raw?.response?.data?.error?.message || raw?.message || fallback;
}

export async function wrap<T>(promise: Promise<T>, fallback: string): Promise<T> {
    try {
        return await promise;
    } catch (e: any) {
        // Usar apenas fallback fornecido (não sobrescrever com mensagem interna desconhecida)
        const friendly = toFriendlyError(e, fallback);
        // Captura no Sentry com contexto técnico adicional
        const S = getSentry();
        if (S?.Native?.captureException) {
            S.Native.captureException(friendly, {
                extra: {
                    status: e?.response?.status,
                    code: e?.response?.data?.error?.code,
                    backendMessage: e?.response?.data?.error?.message,
                    url: e?.config?.url,
                    method: e?.config?.method
                }
            });
        }
        throw friendly;
    }
}

// Helper para breadcrumb de operações de mutação
export function mutationBreadcrumb(action: string, domain: string, meta?: Record<string, any>) {
    const S = getSentry();
    if (!S?.Native?.addBreadcrumb) return;
    S.Native.addBreadcrumb({
        category: `mutation.${domain}`,
        type: 'info',
        message: action,
        data: meta,
        level: 'info'
    });
}

