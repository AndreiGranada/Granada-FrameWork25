import { api, setSession, onTokensRefreshed, onAuthFailure } from '@/src/api/client';
import { useAuthStore } from '@/src/store/authStore';
import MockAdapter from 'axios-mock-adapter';

// Força adapter HTTP (evita XHR/jsdom e CORS fake)
beforeAll(async () => {
    try {
        const mod: any = await import('axios/lib/adapters/http.js');
        // @ts-ignore
        api.defaults.adapter = mod.default || mod;
    } catch { }
});

// Silencia erros de CORS spurios originados pelo jsdom quando algum request escapar
const silent = jest.spyOn(console, 'error').mockImplementation(() => { });
afterAll(() => silent.mockRestore());

describe('api token refresh retry', () => {
    beforeEach(() => {
        // limpa estado auth
        useAuthStore.setState({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false
        } as any);
    });

    it('refaz requisição apos refresh bem sucedido', async () => {
        const mock = new MockAdapter(api);
        // registra handlers como initialize faria
        onTokensRefreshed((tokens) => {
            const current = useAuthStore.getState().session;
            if (current) {
                useAuthStore.getState().setSession({
                    ...current,
                    token: tokens.token,
                    refreshToken: tokens.refreshToken,
                    refreshExpiresAt: tokens.refreshExpiresAt || current.refreshExpiresAt,
                } as any);
            }
        });
        onAuthFailure(() => {
            useAuthStore.getState().logout();
        });
        useAuthStore.setState({
            session: { token: 'old', refreshToken: 'r1', refreshExpiresAt: '2030-01-01T00:00:00Z', user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } } as any,
            user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } as any,
            isAuthenticated: true,
            isLoading: false
        });
        setSession(useAuthStore.getState().session as any);

        mock.onGet('/secure').replyOnce(401);
        mock.onPost('/auth/refresh').replyOnce(200, { token: 'newToken', refreshToken: 'r2', refreshExpiresAt: '2031-01-01T00:00:00Z' });
        mock.onGet('/secure').replyOnce(200, { ok: true });

        const res = await api.get('/secure');
        expect(res.data.ok).toBe(true);
        const st = useAuthStore.getState();
        expect(st.session?.token).toBe('newToken');
        expect(st.session?.refreshToken).toBe('r2');
    });

    it('faz logout quando refresh falha', async () => {
        const mock = new MockAdapter(api);
        onTokensRefreshed((tokens) => {
            const current = useAuthStore.getState().session;
            if (current) {
                useAuthStore.getState().setSession({
                    ...current,
                    token: tokens.token,
                    refreshToken: tokens.refreshToken,
                    refreshExpiresAt: tokens.refreshExpiresAt || current.refreshExpiresAt,
                } as any);
            }
        });
        onAuthFailure(() => {
            useAuthStore.getState().logout();
        });
        useAuthStore.setState({
            session: { token: 'old', refreshToken: 'refreshX', refreshExpiresAt: '2030-01-01T00:00:00Z', user: { id: 'u9', email: 'x@y.z', timezone: 'UTC' } } as any,
            user: { id: 'u9', email: 'x@y.z', timezone: 'UTC' } as any,
            isAuthenticated: true,
            isLoading: false
        });
        setSession(useAuthStore.getState().session as any);

        mock.onGet('/secure').replyOnce(401);
        mock.onPost('/auth/refresh').replyOnce(401, { error: { message: 'invalid refresh' } });

        await expect(api.get('/secure')).rejects.toMatchObject({ response: { status: 401 } });
        // flush microtasks pendentes da fila de retry
        await new Promise((r) => setTimeout(r, 0));
        const st = useAuthStore.getState();
        expect(st.isAuthenticated).toBeFalsy();
        expect(st.session).toBeNull();
    });
});
