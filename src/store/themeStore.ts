import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Storage adapter para funcionar no web e mobile
const storage = Platform.OS === 'web'
    ? {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: (key: string) => localStorage.removeItem(key),
    }
    : {
        getItem: async (key: string) => await SecureStore.getItemAsync(key),
        setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
        removeItem: async (key: string) => await SecureStore.deleteItemAsync(key),
    };

type ThemeMode = 'light' | 'dark';

interface ThemeState {
    // State
    mode: ThemeMode;

    // Actions
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
    initialize: () => void;
}

export const THEME_PERSIST_VERSION = 1;

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            // Initial state
            mode: 'light',

            // Actions
            setMode: (mode: ThemeMode) => {
                set({ mode });
            },

            toggle: () => {
                const currentMode = get().mode;
                set({ mode: currentMode === 'light' ? 'dark' : 'light' });
            },

            initialize: () => {
                // Just ensure the persisted state is loaded
                // The persist middleware handles loading from storage
            },
        }),
        {
            name: 'theme-storage',
            version: THEME_PERSIST_VERSION,
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ mode: state.mode }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<ThemeState> | undefined;
                return {
                    ...currentState,
                    mode: persisted?.mode ?? currentState.mode,
                };
            },
        }
    )
);