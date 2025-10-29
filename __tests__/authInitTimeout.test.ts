import { useAuthStore } from '@/src/store/authStore';
import { api } from '@/src/api/client';

jest.mock('axios', () => {
    const inst = {
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
        post: jest.fn().mockResolvedValue({ data: {} }),
        get: jest.fn(),
    };
    return { __esModule: true, default: { create: () => inst }, create: () => inst };
});


describe('auth initialize timeout', () => {
    jest.setTimeout(10000);
    beforeEach(() => {
        // reset store state limpando persist (zustand persist pode exigir limpar localStorage se web; aqui simplificado)
        const s: any = useAuthStore.getState();
        s.setSession(null);
    });

    it('libera isLoading e seta offlineWarning quando /me demora > 5s', async () => {
        // mock /me que "expira" após >5s simulando abort
        const getSpy = jest.spyOn(api, 'get').mockImplementation((_url: string) => {
            return new Promise((_resolve, reject) => {
                setTimeout(() => {
                    const err: any = new Error('AbortError');
                    err.name = 'AbortError';
                    reject(err);
                }, 5100);
            }) as any;
        });

        // cria sessão simulada antes do initialize
        useAuthStore.getState().setSession({
            token: 't1',
            refreshToken: 'r1',
            refreshExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
            user: { id: 'u1', email: 'a@b.c', timezone: 'UTC' }
        } as any);

        const start = Date.now();
        const promise = useAuthStore.getState().initialize();

        // aguarda 6s para garantir timeout disparado
        await promise.catch(() => { }); // initialize não lança, mas segurança; aguardamos término

        const { isLoading, offlineWarning } = useAuthStore.getState();
        expect(isLoading).toBe(false);
        expect(offlineWarning).toBe(true);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(5000);
        expect(elapsed).toBeLessThan(8000); // margem

        getSpy.mockRestore();
    });
});
