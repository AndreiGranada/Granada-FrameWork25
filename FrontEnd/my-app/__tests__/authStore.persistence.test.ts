/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@/src/observability/analytics', () => ({
    trackEvent: jest.fn(),
    setAnalyticsUser: jest.fn(),
    setCorrelationIdProvider: jest.fn(),
}));

jest.mock('@/src/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('authStore persistence', () => {
    type UseAuthStore = typeof import('@/src/store/authStore').useAuthStore;
    let useAuthStore: UseAuthStore;
    let AUTH_PERSIST_VERSION: number;

    beforeEach(async () => {
        jest.resetModules();
        const reactNative = require('react-native');
        Object.defineProperty(reactNative.Platform, 'OS', {
            configurable: true,
            get: () => 'web',
        });

        const storeModule = require('@/src/store/authStore');
        useAuthStore = storeModule.useAuthStore;
        AUTH_PERSIST_VERSION = storeModule.AUTH_PERSIST_VERSION;

        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        await (useAuthStore as any).persist.clearStorage();
    });

    afterEach(async () => {
        if (useAuthStore) {
            await (useAuthStore as any).persist.clearStorage();
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        jest.clearAllMocks();
    });

    it('persists only whitelisted auth keys', async () => {
        useAuthStore.getState().setSession({
            token: 'token-123',
            refreshToken: 'refresh-123',
            refreshExpiresAt: '2030-01-01T00:00:00Z',
            user: {
                id: 'user-1',
                email: 'user@example.com',
                timezone: 'UTC',
                name: 'User Example',
                phone: '+55-11-99999-0000',
            } as any,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const raw = localStorage.getItem('auth-storage');
        expect(raw).toBeTruthy();

        const persisted = JSON.parse(raw!);
        expect(persisted.state.session).toEqual({
            token: 'token-123',
            refreshToken: 'refresh-123',
            refreshExpiresAt: '2030-01-01T00:00:00Z',
            user: {
                id: 'user-1',
                email: 'user@example.com',
                timezone: 'UTC',
                name: 'User Example',
            },
        });
        expect(persisted.state.user).toEqual({
            id: 'user-1',
            email: 'user@example.com',
            timezone: 'UTC',
            name: 'User Example',
        });
        expect(persisted.state.isAuthenticated).toBe(true);
        expect(persisted.state.offlineWarning).toBeUndefined();
    });

    it('hydrates sanitized payload and ignores unknown fields', async () => {
        const payload = {
            state: {
                session: {
                    token: 'persisted-token',
                    refreshToken: 'persisted-refresh',
                    refreshExpiresAt: '2031-01-01T00:00:00Z',
                    user: {
                        id: 'persisted-user',
                        email: 'persisted@example.com',
                        timezone: 'America/Sao_Paulo',
                        name: 'Persisted User',
                        phone: '+55-11-00000-0000',
                    },
                    junk: 'should-drop',
                },
                user: {
                    id: 'persisted-user',
                    email: 'persisted@example.com',
                    timezone: 'America/Sao_Paulo',
                    name: 'Persisted User',
                    avatarUrl: 'https://example.com/img.png',
                },
                isAuthenticated: true,
                offlineWarning: true,
            },
            version: AUTH_PERSIST_VERSION,
        };

        localStorage.setItem('auth-storage', JSON.stringify(payload));

        await (useAuthStore as any).persist.rehydrate();

        const state = useAuthStore.getState();
        expect(state.session?.token).toBe('persisted-token');
        expect(state.session?.refreshToken).toBe('persisted-refresh');
        expect(state.session?.user).toEqual({
            id: 'persisted-user',
            email: 'persisted@example.com',
            timezone: 'America/Sao_Paulo',
            name: 'Persisted User',
        });
        expect((state.session as any)?.junk).toBeUndefined();
        expect(state.user).toEqual({
            id: 'persisted-user',
            email: 'persisted@example.com',
            timezone: 'America/Sao_Paulo',
            name: 'Persisted User',
        });
        expect(state.offlineWarning).toBe(false);
        expect(state.isAuthenticated).toBe(true);
    });
});
