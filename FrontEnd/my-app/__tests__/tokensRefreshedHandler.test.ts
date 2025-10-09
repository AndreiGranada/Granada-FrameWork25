import { onTokensRefreshed, setSession, __TESTING_INVOKE_REFRESH } from '@/src/api/client';
import { useAuthStore } from '@/src/store/authStore';

describe('tokensRefreshed handler integra com authStore', () => {
    it('atualiza session no store quando tokens são renovados', () => {
        // prepara sessão inicial
        useAuthStore.setState({
            session: { token: 'old', refreshToken: 'r1', refreshExpiresAt: '2030', user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } } as any,
            user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' } as any,
            isAuthenticated: true,
            isLoading: false
        });
        setSession(useAuthStore.getState().session as any);

        // registra handler igual initialize faria
        onTokensRefreshed((tokens) => {
            const current = useAuthStore.getState().session;
            if (current) {
                useAuthStore.getState().setSession({
                    ...current,
                    token: tokens.token,
                    refreshToken: tokens.refreshToken,
                    refreshExpiresAt: tokens.refreshExpiresAt || current.refreshExpiresAt
                } as any);
            }
        });

        // simula refresh invocando internals via setSession + intercept simulation
        // Como não expomos diretamente o handler, recriamos usando closure acima: chamamos onTokensRefreshed de novo
        __TESTING_INVOKE_REFRESH({ token: 'new', refreshToken: 'r2', refreshExpiresAt: '2031' });

        const st = useAuthStore.getState();
        expect(st.session?.token).toBe('new');
        expect(st.session?.refreshToken).toBe('r2');
    });
});
