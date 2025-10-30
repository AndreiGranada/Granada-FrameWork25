import { logger } from '@/src/lib/logger';
import Constants from 'expo-constants';
import React from 'react';

let initPromise: Promise<void> | null = null;
let sentryModule: any | null = null;
let latestUser: any = null;
let navigationInstrumentation: any | null = null;
let appStartTransaction: any | null = null;
const breadcrumbQueue: { route: string; data?: Record<string, unknown> }[] = [];
const metricQueue: { durationMs: number; extras?: Record<string, number> }[] = [];
const navigationRefQueue: any[] = [];
const APP_START_EPOCH = Date.now();

function getBridge() {
    if (!sentryModule) return null;
    return sentryModule.Native || sentryModule;
}

function applyUser(user: any) {
    const bridge = getBridge();
    if (!bridge || typeof bridge.setUser !== 'function') return;
    bridge.setUser(user);
}

function applyBreadcrumb(route: string, data?: Record<string, unknown>) {
    const bridge = getBridge();
    if (!bridge || typeof bridge.addBreadcrumb !== 'function') return;
    bridge.addBreadcrumb({ category: 'navigation', message: route, level: 'info', data });
}

function createRelease() {
    const easCommit = process.env.EAS_BUILD_COMMIT ?? process.env.EXPO_PUBLIC_GIT_SHA;
    const version = Constants.expoConfig?.version || Constants.expoConfig?.sdkVersion || '0.0.0';
    const slug = Constants.expoConfig?.slug || 'medicaltime-app';
    return easCommit ? `${slug}@${version}+${easCommit}` : `${slug}@${version}`;
}

function createEnvironment() {
    return process.env.EXPO_PUBLIC_ENV || Constants.expoConfig?.extra?.env || (__DEV__ ? 'development' : 'production');
}

function maybeStartAppStartTransaction() {
    const bridge = getBridge();
    if (!bridge || typeof bridge.startTransaction !== 'function' || appStartTransaction) return;
    try {
        appStartTransaction = bridge.startTransaction({
            name: 'app.start',
            op: 'app.start',
            startTimestamp: APP_START_EPOCH / 1000,
        });
    } catch (err) {
        logger.warn('[sentry.real] Não foi possível iniciar transação de app.start.', {
            message: err instanceof Error ? err.message : String(err),
        });
    }
}

function recordAppStartMetric(durationMs: number, extras?: Record<string, number>) {
    const bridge = getBridge();
    if (appStartTransaction) {
        try {
            appStartTransaction.setMeasurement?.('app_start_tti', durationMs, 'millisecond');
            if (extras) {
                Object.entries(extras).forEach(([key, value]) => {
                    appStartTransaction.setMeasurement?.(key, value, 'millisecond');
                });
            }
            appStartTransaction.finish?.();
        } catch (err) {
            logger.warn('[sentry.real] Falha ao finalizar transação app.start.', {
                message: err instanceof Error ? err.message : String(err),
            });
        } finally {
            appStartTransaction = null;
        }
        return;
    }

    if (bridge?.captureMessage) {
        bridge.captureMessage('app.start.metrics', {
            level: 'info',
            extra: {
                ttiMs: durationMs,
                ...(extras || {}),
            },
        });
        return;
    }

    metricQueue.push({ durationMs, extras });
}

async function ensureInitialized() {
    if (sentryModule) return;
    if (initPromise) {
        await initPromise;
        return;
    }
    if (process.env.EXPO_PUBLIC_USE_SENTRY !== '1') {
        logger.info('[sentry.real] EXPO_PUBLIC_USE_SENTRY=0 (mantendo stub).');
        return;
    }
    initPromise = (async () => {
        try {
            let imported: any = null;
            try {
                // @ts-ignore — dependência opcional carregada dinamicamente
                imported = await import('sentry-expo');
            } catch (err) {
                logger.warn('[sentry.real] sentry-expo não encontrado. Instale a dependência antes de ativar o Sentry.', {
                    message: err instanceof Error ? err.message : String(err),
                });
                return;
            }

            const module = imported?.default || imported;
            if (!module || typeof module.init !== 'function') {
                logger.warn('[sentry.real] sentry-expo importado, mas método init() ausente.');
                return;
            }

            let integrations: any[] | undefined;

            if (module?.Native?.ReactNavigationInstrumentation && module?.Native?.ReactNavigationIntegration) {
                navigationInstrumentation = new module.Native.ReactNavigationInstrumentation();
                integrations = [
                    new module.Native.ReactNavigationIntegration({
                        routingInstrumentation: navigationInstrumentation,
                    }),
                ];
            }

            module.init({
                dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
                enableInExpoDevelopment: process.env.EXPO_PUBLIC_SENTRY_DEBUG === '1',
                debug: process.env.EXPO_PUBLIC_DEBUG === '1',
                tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.2),
                profilesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? 0.2),
                environment: createEnvironment(),
                release: createRelease(),
                enableAutoPerformanceTracking: true,
                enableAutoSessionTracking: true,
                enableNative: true,
                integrations,
            });

            sentryModule = module;
            (globalThis as any).__SENTRY_EXPO__ = module;
            (globalThis as any).__SENTRY_LAZY_READY__ = true;
            logger.info('[sentry.real] Sentry inicializado.');

            maybeStartAppStartTransaction();

            if (latestUser) {
                applyUser(latestUser);
            }
            if (breadcrumbQueue.length > 0) {
                breadcrumbQueue.splice(0).forEach(({ route, data }) => applyBreadcrumb(route, data));
            }
            if (metricQueue.length > 0) {
                const pending = metricQueue.splice(0);
                pending.forEach(({ durationMs, extras }) => recordAppStartMetric(durationMs, extras));
            }
            if (navigationRefQueue.length > 0 && navigationInstrumentation?.registerNavigationContainer) {
                navigationRefQueue.splice(0).forEach((ref) => {
                    try {
                        navigationInstrumentation.registerNavigationContainer(ref);
                    } catch (err) {
                        logger.warn('[sentry.real] Falha ao registrar container de navegação pendente.', {
                            message: err instanceof Error ? err.message : String(err),
                        });
                    }
                });
            }
        } catch (err) {
            logger.warn('[sentry.real] Falha ao carregar sentry-expo, mantendo stub.', {
                message: err instanceof Error ? err.message : String(err),
            });
        }
    })();
    await initPromise;
}

export async function initSentry() {
    await ensureInitialized();
}

export function setSentryUser(user: any) {
    latestUser = user || null;
    if (sentryModule) applyUser(latestUser);
}

export function addNavigationBreadcrumb(route: string, data?: Record<string, unknown>) {
    if (sentryModule) {
        applyBreadcrumb(route, data);
    } else {
        breadcrumbQueue.push({ route, data });
    }
}

export function registerNavigationContainer(ref: any) {
    if (navigationInstrumentation?.registerNavigationContainer) {
        try {
            navigationInstrumentation.registerNavigationContainer(ref);
        } catch (err) {
            logger.warn('[sentry.real] Falha ao registrar NavigationContainer.', {
                message: err instanceof Error ? err.message : String(err),
            });
        }
    } else {
        navigationRefQueue.push(ref);
    }
}

export function reportAppTTIMs(durationMs: number, extras?: Record<string, number>) {
    if (!sentryModule) {
        metricQueue.push({ durationMs, extras });
        return;
    }
    recordAppStartMetric(durationMs, extras);
}

export const SentryErrorBoundary: any = (props: any) => {
    const bridge = getBridge();
    const Boundary = bridge?.ErrorBoundary || (({ children }: any) => children);
    return React.createElement(Boundary, props);
};
