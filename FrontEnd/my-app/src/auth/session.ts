import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'mt.session';

type StorageDriver = {
    getItem: () => Promise<string | null>;
    setItem: (value: string) => Promise<void>;
    deleteItem: () => Promise<void>;
};

function localStorageDriver(): StorageDriver {
    return {
        async getItem() {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return null;
                return window.localStorage.getItem(KEY);
            } catch {
                return null;
            }
        },
        async setItem(value: string) {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return;
                window.localStorage.setItem(KEY, value);
            } catch { }
        },
        async deleteItem() {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return;
                window.localStorage.removeItem(KEY);
            } catch { }
        },
    };
}

function secureStoreDriver(): StorageDriver {
    return {
        getItem: () => SecureStore.getItemAsync(KEY),
        setItem: (value: string) => SecureStore.setItemAsync(KEY, value),
        deleteItem: () => SecureStore.deleteItemAsync(KEY),
    };
}

function getDriver(): StorageDriver {
    // Expo Secure Store não suporta Web; usar localStorage no Web
    if (Platform.OS === 'web') return localStorageDriver();
    return secureStoreDriver();
}

export async function saveSession(s: any | null) {
    const store = getDriver();
    if (s) await store.setItem(JSON.stringify(s));
    else await store.deleteItem();
}

export async function loadSession<T = any>(): Promise<T | null> {
    const store = getDriver();
    const raw = await store.getItem();
    return raw ? (JSON.parse(raw) as T) : null;
}
