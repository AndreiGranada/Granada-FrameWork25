import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'dark' | 'light';

type Ctx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const KEY = 'mt.theme';
const ThemeCtx = createContext<Ctx>({} as any);

async function loadStoredMode(): Promise<ThemeMode | null> {
  try {
    if (Platform.OS === 'web') {
      const m = (globalThis as any)?.localStorage?.getItem(KEY);
      return m === 'light' || m === 'dark' ? (m as ThemeMode) : null;
    }
    const raw = await SecureStore.getItemAsync(KEY);
    return raw === 'light' || raw === 'dark' ? (raw as ThemeMode) : null;
  } catch {
    return null;
  }
}

async function saveStoredMode(m: ThemeMode) {
  try {
    if (Platform.OS === 'web') {
      (globalThis as any)?.localStorage?.setItem(KEY, m);
      return;
    }
    await SecureStore.setItemAsync(KEY, m);
  } catch {}
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  useEffect(() => {
    (async () => {
      const stored = await loadStoredMode();
      if (stored) setModeState(stored);
    })();
  }, []);
  const setMode = (m: ThemeMode) => {
    setModeState(m);
    saveStoredMode(m);
  };
  const value = useMemo<Ctx>(() => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }), [mode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeCtx);
}
