import { installGlobalErrorHandler } from '@/src/observability/globalErrors';
import { addNavigationBreadcrumb, initSentry, registerNavigationContainer, reportAppTTIMs, SentryErrorBoundary, setSentryUser } from '@/src/observability/sentry';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { InteractionManager, Platform, Text as RNText } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { setAnalyticsProvider } from '@/src/observability/analytics';
import { useDevAutoAuth } from '@/src/lib/useDevAutoAuth';
import { useAuthStore, useThemeStore } from '@/src/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const qc = new QueryClient();

installGlobalErrorHandler();

const bootTimestamp = (globalThis as any).__APP_BOOT_TS__ ?? Date.now();
if (!(globalThis as any).__APP_BOOT_TS__) {
  (globalThis as any).__APP_BOOT_TS__ = bootTimestamp;
}

// Dev: silencia aviso específico do RN Web sobre props.pointerEvents
const DEV = process.env.NODE_ENV !== 'production';
if (DEV && Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('props.pointerEvents is deprecated. Use style.pointerEvents')) {
      return; // ignora apenas este aviso
    }
    originalWarn(...args);
  };
}

function ThemedRoot() {
  // Inicializa Sentry de forma assíncrona (import lazy + init) após primeira montagem
  useEffect(() => { initSentry(); }, []);
  // Inicializa provider de analytics simples (console) se variável permitir
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_ANALYTICS_CONSOLE === '1') {
      setAnalyticsProvider({
        track: (e) => { console.info('[analytics]', e.name, e.props || {}); },
        setUser: (u) => { console.info('[analytics] user', u?.id || null); }
      });
    }
  }, []);
  const { mode } = useThemeStore();
  const { initialize, user, isAuthenticated } = useAuthStore();
  const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationRef = useNavigationContainerRef();
  // Em dev, tenta autenticar automaticamente se habilitado
  useDevAutoAuth();

  // Initialize auth store on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sincroniza usuário logado com Sentry
  useEffect(() => {
    if (isAuthenticated && user) {
      setSentryUser({ id: user.id, email: (user as any).email, name: (user as any).name });
    } else {
      setSentryUser(null);
    }
  }, [isAuthenticated, user]);

  // Breadcrumbs de navegação: escuta eventos do expo-router Stack
  useEffect(() => {
    addNavigationBreadcrumb('app:start');
    if (!navigationRef) return;
    registerNavigationContainer(navigationRef);
    const unsubscribe = navigationRef.addListener?.('state', () => {
      const route = navigationRef.getCurrentRoute?.();
      if (route?.name) {
        addNavigationBreadcrumb(`route:${route.name}`, route.params ?? undefined);
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [navigationRef]);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - bootTimestamp;
      reportAppTTIMs(duration);
    });
    return () => {
      if (typeof handle?.cancel === 'function') {
        handle.cancel();
      }
    };
  }, []);

  // texto padrão acompanha o tema
  (RNText as any).defaultProps = {
    ...(RNText as any).defaultProps,
    style: [{ color: mode === 'dark' ? '#FFFFFF' : '#000000' }, (RNText as any).defaultProps?.style],
  };

  return (
    <ThemeProvider value={navTheme}>
      <QueryClientProvider client={qc}>
        <SafeAreaProvider>
          <SentryErrorBoundary fallback={() => <></>}>
            <Stack
              ref={navigationRef}
              initialRouteName="index"
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="reset" options={{ headerShown: false }} />
              <Stack.Screen name="reminders" options={{ headerShown: false }} />
              <Stack.Screen name="reminders/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="intakes" options={{ headerShown: false }} />
              <Stack.Screen name="intakes-history" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="emergency-contacts/index" options={{ headerShown: false }} />
              <Stack.Screen name="emergency-contacts/new" options={{ headerShown: false }} />
              <Stack.Screen name="emergency-contacts/edit" options={{ headerShown: false }} />
            </Stack>
          </SentryErrorBoundary>
          {/* Notification overlay */}
          <NotificationContainer />
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <OfflineBanner />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useColorScheme();
  return <ThemedRoot />;
}
