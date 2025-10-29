// Sentry stub - sem dependência real
export function initSentry() { }
export function setSentryUser(_u: any) { }
export function addNavigationBreadcrumb(_r: string) { }
export function registerNavigationContainer(_ref: any) { }
export function reportAppTTIMs(_duration: number, _extras?: Record<string, number>) { }
export const SentryErrorBoundary: any = ({ children }: any) => children;
export function __SENTRY_STUB_INFO() {
    return {
        stub: true,
        reason: 'Sentry desativado (stub) – defina EXPO_PUBLIC_USE_SENTRY=1 para usar a integração real.',
        useSentryEnvFlag: process.env.EXPO_PUBLIC_USE_SENTRY ?? null,
    };
}
