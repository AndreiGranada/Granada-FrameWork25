import { setSession, __TESTING_SET_OPENAPI } from '@/src/api/client';

const OpenAPI: any = { BASE: 'http://test', TOKEN: undefined };
beforeAll(() => {
    __TESTING_SET_OPENAPI(OpenAPI);
});

/**
 * Garante que ao chamar setSession após carregar o cliente API (lazy import do SDK)
 * o token seja propagado para o objeto OpenAPI (usado pelos serviços gerados).
 * Este teste cobre a regressão onde o caminho incorreto '@/sdk' impedia a configuração do TOKEN
 * resultando em chamadas 401 mesmo com sessão válida.
 */

describe('lazy SDK token propagation', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('propaga Bearer token para OpenAPI após setSession', async () => {
        expect(OpenAPI.TOKEN).toBeUndefined();

        const fakeSession = {
            token: 'abc123',
            refreshToken: 'ref123',
            refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            user: { id: 'u1', email: 'user@example.com', timezone: 'UTC' }
        } as any;

        setSession(fakeSession);
        // Com resolver dinâmico agora TOKEN é função
        expect(typeof OpenAPI.TOKEN).toBe('function');
        expect(OpenAPI.TOKEN()).toBe('Bearer abc123');
    });
});
