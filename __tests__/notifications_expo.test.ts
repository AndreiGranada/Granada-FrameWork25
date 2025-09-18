import { prisma } from '../src/lib/prisma';
import { ExpoProvider } from '../src/services/notifications/push';

// Simples mock de fetch para capturar o payload enviado ao Expo
const originalFetch = global.fetch as any;

describe('ExpoProvider', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });
    afterAll(async () => {
        global.fetch = originalFetch;
        await prisma.$disconnect();
    });
    beforeEach(async () => {
        // Limpa tabelas relevantes
        await prisma.device.deleteMany();
        await prisma.user.deleteMany();
    });

    it('envia em dry-run sem chamar fetch quando não há tokens', async () => {
        process.env.NOTIFY_DRY_RUN = 'true';
        const provider = new ExpoProvider();
        const user = await prisma.user.create({ data: { email: 'expo1@test.com', passwordHash: 'x' } });
        await provider.sendAlarm(user.id, 'event-1');
        expect(global.fetch).toBe(originalFetch); // não deve mudar (não foi mockado)
    });

    it('envia para tokens expo e desativa inválidos', async () => {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.EXPO_ACCESS_TOKEN = 'token-test';

        const calls: any[] = [];
        global.fetch = jest.fn(async (input: any, opts?: any) => {
            calls.push({ url: input, opts });
            return {
                ok: true,
                json: async () => ({
                    data: [
                        { status: 'ok' },
                        { status: 'error', details: { error: 'DeviceNotRegistered' } }
                    ]
                })
            } as any;
        });

        const provider = new ExpoProvider();
        const user = await prisma.user.create({ data: { email: 'expo2@test.com', passwordHash: 'x' } });
        await prisma.device.createMany({
            data: [
                { userId: user.id, platform: 'ANDROID', pushToken: 'ExponentPushToken[valid]', isActive: true },
                { userId: user.id, platform: 'ANDROID', pushToken: 'ExponentPushToken[invalid]', isActive: true },
                { userId: user.id, platform: 'ANDROID', pushToken: 'nonExpoToken', isActive: true }
            ]
        });

        await provider.sendAlarm(user.id, 'event-2');

        expect(calls.length).toBe(1);
        const body = JSON.parse(calls[0].opts.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2); // apenas tokens Expo
        expect(body[0].to).toContain('ExponentPushToken[');

        // Verifica que o token inválido foi desativado
        const activeDevices = await prisma.device.findMany({ where: { userId: user.id, isActive: true } });
        expect(activeDevices.length).toBe(2); // 1 expo ok + 1 non-expo continua ativo
    });
});
