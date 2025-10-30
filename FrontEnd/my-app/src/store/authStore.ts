import { api, setSession as applyApiSession, onAuthFailure, onTokensRefreshed, type Session, type User } from '@/src/api/client';
import { logger } from '@/src/lib/logger';
import { setAnalyticsUser, trackEvent } from '@/src/observability/analytics';
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

type PersistedUser = Pick<User, 'id' | 'email' | 'timezone' | 'name'>;

type PersistedSession = Pick<Session, 'token' | 'refreshToken' | 'refreshExpiresAt'> & {
    user: PersistedUser;
};

type SessionWithChecksum = PersistedSession & { _checksum: string | null };

export const AUTH_PERSIST_VERSION = 2;

interface AuthState {
    // State
    user: PersistedUser | null;
    session: SessionWithChecksum | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    offlineWarning?: boolean; // true se falha /me por rede/timeout

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    refreshMe: () => Promise<void>;
    setSession: (session: (Session | SessionWithChecksum | null)) => void;
    initialize: () => Promise<void>;
    clearOfflineWarning: () => void;
}

function sanitizeUser(user: User | PersistedUser | null | undefined): PersistedUser | null {
    if (!user) return null;
    const { id, email, timezone } = user;
    return {
        id,
        email,
        timezone,
        name: 'name' in user ? user.name ?? null : null,
    };
}

function toPersistedSession(session: Session | SessionWithChecksum | null): PersistedSession | null {
    if (!session) return null;
    const user = sanitizeUser(session.user);
    if (!user) return null;
    return {
        token: session.token,
        refreshToken: session.refreshToken,
        refreshExpiresAt: session.refreshExpiresAt,
        user,
    };
}

function computeChecksum(session: PersistedSession | null): string | null {
    if (!session) return null;
    try {
        const base = `${session.user?.id}|${session.token}|${session.refreshToken}`;
        let hash = 0;
        for (let i = 0; i < base.length; i++) {
            hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
        }
        return hash.toString(16);
    } catch {
        return null;
    }
}

function withChecksum(session: Session | SessionWithChecksum | null): SessionWithChecksum | null {
    const persisted = toPersistedSession(session);
    if (!persisted) return null;
    return {
        ...persisted,
        _checksum: computeChecksum(persisted),
    };
}

function stripChecksum(session: Session | SessionWithChecksum | null): PersistedSession | null {
    const persisted = toPersistedSession(session);
    if (!persisted) return null;
    return persisted;
}

type PersistedAuthState = {
    session: PersistedSession | null;
    user: PersistedUser | null;
    isAuthenticated: boolean;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            session: null,
            isAuthenticated: false,
            // Começa como carregando para evitar flicker enquanto hidrata sessão persistida
            isLoading: true,
            offlineWarning: false,

            // Actions
            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post<Session>('/auth/login', { email, password });
                    get().setSession(data);
                    setAnalyticsUser({ id: data.user.id, email: data.user.email, name: (data.user as any).name });
                    trackEvent('auth_login_success');
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (email: string, password: string, name?: string) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post<Session>('/auth/register', { email, password, name });
                    get().setSession(data);
                    setAnalyticsUser({ id: data.user.id, email: data.user.email, name: (data.user as any).name });
                    trackEvent('auth_register_success');
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch {
                    // Ignore errors on logout
                } finally {
                    get().setSession(null);
                    // remove handler de refresh para evitar retenção desnecessária
                    onTokensRefreshed(null);
                    setAnalyticsUser(null);
                    trackEvent('auth_logout');
                }
            },

            forgotPassword: async (email: string) => {
                const e = typeof email === 'string' ? email.trim() : email;
                await api.post('/auth/forgot', { email: e });
            },

            resetPassword: async (token: string, password: string) => {
                await api.post('/auth/reset', { token, password });
            },

            refreshMe: async () => {
                try {
                    const me = await api.get('/me');
                    const sanitized = sanitizeUser(me.data.user);
                    set({ user: sanitized ? { ...sanitized } : null });
                    setAnalyticsUser({ id: me.data.user.id, email: me.data.user.email, name: (me.data.user as any).name });
                    trackEvent('auth_refresh_me_success');
                } catch (error: any) {
                    const status = error?.response?.status;
                    const isNetwork = !status && (error?.message?.includes('Network') || error?.name === 'AxiosError');
                    if (status === 401 || status === 403) {
                        // Sessão inválida
                        logger.warn('[auth] refreshMe -> sessão inválida, efetuando logout');
                        get().logout();
                        trackEvent('auth_refresh_me_invalid');
                    } else if (isNetwork) {
                        logger.warn('[auth] refreshMe -> falha de rede, marcando offlineWarning');
                        set({ offlineWarning: true });
                        trackEvent('auth_offline_detected');
                    } else {
                        logger.error('[auth] refreshMe -> erro inesperado', { status, error });
                        trackEvent('auth_refresh_me_error', { status });
                    }
                    throw error;
                }
            },

            setSession: (session: Session | SessionWithChecksum | null) => {
                const normalized = withChecksum(session);
                set({
                    session: normalized,
                    user: normalized?.user ?? null,
                    isAuthenticated: !!normalized,
                });
                applyApiSession(stripChecksum(normalized));
            },

            clearOfflineWarning: () => set({ offlineWarning: false }),

            initialize: async () => {
                const existing = get().session as SessionWithChecksum | null;
                if (!existing) {
                    // Nada persistido: liberar loading imediatamente
                    set({ isLoading: false });
                    return;
                }
                // Verifica checksum de integridade
                const expected = computeChecksum(stripChecksum(existing));
                if (existing._checksum && expected && existing._checksum !== expected) {
                    // Sessão corrompida -> logout forçado
                    set({ session: null, user: null, isAuthenticated: false, isLoading: false });
                    applyApiSession(null);
                    trackEvent('auth_session_corrupted');
                    return;
                }
                set({ isLoading: true });
                applyApiSession(stripChecksum(existing));
                // Registrar handler de refresh (uma vez)
                onTokensRefreshed((tokens) => {
                    const currentSession = get().session;
                    if (currentSession) {
                        const updatedSession = {
                            ...currentSession,
                            token: tokens.token,
                            refreshToken: tokens.refreshToken,
                            refreshExpiresAt: tokens.refreshExpiresAt || currentSession.refreshExpiresAt,
                        };
                        get().setSession(updatedSession as SessionWithChecksum);
                        trackEvent('auth_tokens_refreshed');
                    }
                });
                // Handler de falha de auth (refresh inválido / expirado) => logout automático
                onAuthFailure(() => {
                    get().logout();
                    trackEvent('auth_refresh_failed_final');
                });
                // Aplica timeout manual para não travar a splash indefinidamente em rede lenta ou backend offline
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                try {
                    await get().refreshMe();
                } catch (err: any) {
                    if (err?.name === 'AbortError') {
                        logger.warn('[auth] initialize timeout /me (5s)');
                        set({ offlineWarning: true });
                        trackEvent('auth_initialize_timeout');
                    }
                } finally {
                    clearTimeout(timeout);
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            version: AUTH_PERSIST_VERSION,
            storage: createJSONStorage(() => storage),
            partialize: (state) => {
                const session = stripChecksum(state.session);
                return {
                    session,
                    user: sanitizeUser(state.user),
                    isAuthenticated: !!session,
                } satisfies PersistedAuthState;
            },
            merge: (persistedState, currentState) => {
                const persisted = persistedState as PersistedAuthState | undefined;
                if (!persisted) return currentState;
                const normalizedSession = withChecksum(persisted.session);
                return {
                    ...currentState,
                    session: normalizedSession,
                    user: sanitizeUser(persisted.user),
                    isAuthenticated: !!normalizedSession,
                };
            },
        }
    )
);