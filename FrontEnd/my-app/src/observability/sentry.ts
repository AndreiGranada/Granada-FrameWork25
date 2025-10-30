// Seleciona implementação real ou stub conforme env.
// Evita importar a implementação real quando não estiver habilitada, para não acionar
// import dinâmico (async-require) no Web que pode falhar em alguns ambientes Windows.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useReal = process.env.EXPO_PUBLIC_USE_SENTRY === '1';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl: any = useReal ? require('./sentry.real') : require('./sentry.stub');

export const initSentry = impl.initSentry;
export const setSentryUser = impl.setSentryUser;
export const addNavigationBreadcrumb = impl.addNavigationBreadcrumb;
export const SentryErrorBoundary = impl.SentryErrorBoundary;
export const __SENTRY_STUB_INFO = impl.__SENTRY_STUB_INFO || (() => ({ stub: !useReal }));
export const registerNavigationContainer = impl.registerNavigationContainer || (() => { });
export const reportAppTTIMs = impl.reportAppTTIMs || (() => { });
