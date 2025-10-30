import { useAuthStore } from '@/src/store/authStore';

jest.mock('@/src/api/client', () => {
    const original = jest.requireActual('@/src/api/client');
    return {
        ...original,
        api: {
            post: jest.fn(async (url: string) => {
                if (url === '/auth/login') {
                    return { data: { token: 't1', refreshToken: 'rt1', refreshExpiresAt: '2030-01-01T00:00:00Z', user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } } };
                }
                if (url === '/auth/logout') return { data: {} };
                throw new Error('Unhandled ' + url);
            }),
            get: jest.fn(async (url: string) => {
                if (url === '/me') return { data: { user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } } };
                throw new Error('Unhandled ' + url);
            })
        }
    };
});

describe('authStore', () => {
    it('login seta sessão e usuário', async () => {
        await useAuthStore.getState().login('a@b.c', 'secret');
        const st = useAuthStore.getState();
        expect(st.isAuthenticated).toBeTruthy();
        expect(st.user?.email).toBe('a@b.c');
    });

    it('logout limpa sessão', async () => {
        await useAuthStore.getState().logout();
        const st = useAuthStore.getState();
        expect(st.isAuthenticated).toBeFalsy();
        expect(st.user).toBeNull();
    });
});
