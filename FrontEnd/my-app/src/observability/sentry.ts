// Seleciona implementação real ou stub conforme env.
// Mantém API estável para o restante do app.
import * as realImpl from './sentry.real';
import * as stubImpl from './sentry.stub';
const useReal = process.env.EXPO_PUBLIC_USE_SENTRY === '1';
const impl: any = useReal ? realImpl : stubImpl;

export const initSentry = impl.initSentry;
export const setSentryUser = impl.setSentryUser;
export const addNavigationBreadcrumb = impl.addNavigationBreadcrumb;
export const SentryErrorBoundary = impl.SentryErrorBoundary;
export const __SENTRY_STUB_INFO = impl.__SENTRY_STUB_INFO || (() => ({ stub: !useReal }));
export const registerNavigationContainer = impl.registerNavigationContainer || (() => { });
export const reportAppTTIMs = impl.reportAppTTIMs || (() => { });
