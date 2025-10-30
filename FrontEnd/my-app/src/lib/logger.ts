// Logger leve com toggle via EXPO_PUBLIC_DEBUG e integração opcional com Sentry
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;

const rawDebugFlag = String(process.env.EXPO_PUBLIC_DEBUG || '').toLowerCase();
const debugEnabled =
    rawDebugFlag === '1' ||
    rawDebugFlag === 'true' ||
    rawDebugFlag === 'yes' ||
    (rawDebugFlag === '' && process.env.NODE_ENV !== 'production');

const levelWeight: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const minimumLevel: LogLevel = debugEnabled ? 'debug' : 'info';

function shouldEmit(level: LogLevel): boolean {
    return levelWeight[level] >= levelWeight[minimumLevel];
}

function safeStringify(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (value === undefined || value === null) return String(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
        return JSON.stringify(value);
    } catch {
        return '[unserializable]';
    }
}

function normalizeMeta(meta: unknown): LogMetadata | undefined {
    if (meta === undefined || meta === null) return undefined;
    if (meta instanceof Error) {
        return {
            errorName: meta.name,
            errorMessage: meta.message,
            stack: meta.stack,
        };
    }
    if (typeof meta === 'object' && !Array.isArray(meta)) {
        return { ...(meta as Record<string, unknown>) };
    }
    return { value: meta };
}

function mergeMeta(message: unknown, meta: unknown): LogMetadata | undefined {
    const normalized = normalizeMeta(meta);
    if (message instanceof Error) {
        const errorMeta = {
            errorName: message.name,
            errorMessage: message.message,
            stack: message.stack,
        };
        return normalized ? { ...errorMeta, ...normalized } : errorMeta;
    }
    return normalized;
}

function maybeCaptureWithSentry(message: unknown, meta?: LogMetadata) {
    try {
        const sentry: any = (globalThis as any).__SENTRY_EXPO__;
        if (!sentry || typeof sentry.captureException !== 'function') return;
        const send = (err: Error) => {
            if (typeof sentry.withScope === 'function') {
                sentry.withScope((scope: any) => {
                    if (scope && typeof scope.setExtras === 'function' && meta) {
                        scope.setExtras(meta);
                    }
                    if (scope && typeof scope.setExtra === 'function') {
                        scope.setExtra('loggerOrigin', 'frontend/logger');
                    }
                    sentry.captureException(err);
                });
            } else {
                sentry.captureException(err);
            }
        };
        if (message instanceof Error) {
            send(message);
        } else {
            send(new Error(safeStringify(message)));
        }
    } catch (captureErr) {
        // Não interrompe o fluxo de log se a integração opcional falhar.
        console.debug('[logger] Falha ao encaminhar erro para Sentry (ignorado).', captureErr);
    }
}

function emit(level: LogLevel, message: unknown, meta?: unknown) {
    if (!shouldEmit(level)) return;
    const ts = new Date().toISOString();
    const normalizedMessage = safeStringify(message);
    const mergedMeta = mergeMeta(message, meta);
    const args: any[] = [`[${ts}] [${level.toUpperCase()}] ${normalizedMessage}`];
    if (mergedMeta && Object.keys(mergedMeta).length > 0) {
        args.push(mergedMeta);
    }
    const consoleFn =
        level === 'debug' ? console.debug.bind(console) :
            level === 'info' ? console.info.bind(console) :
                level === 'warn' ? console.warn.bind(console) :
                    console.error.bind(console);
    consoleFn(...args);
    if (level === 'error') {
        maybeCaptureWithSentry(message, mergedMeta);
    }
}

export const logger = {
    debug(message: unknown, meta?: unknown) {
        emit('debug', message, meta);
    },
    info(message: unknown, meta?: unknown) {
        emit('info', message, meta);
    },
    warn(message: unknown, meta?: unknown) {
        emit('warn', message, meta);
    },
    error(message: unknown, meta?: unknown) {
        emit('error', message, meta);
    },
};

export const isDebugLoggingEnabled = debugEnabled;

export function wrapTry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((err) => {
        logger.error(err instanceof Error ? err : new Error(String(err)), {
            scope: label,
        });
        throw err;
    });
}
