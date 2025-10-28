"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../src/lib/prisma");
const push_1 = require("../src/services/notifications/push");
// Simples mock de fetch para capturar o payload enviado ao Expo
const originalFetch = global.fetch;
describe('ExpoProvider', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.$connect();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        global.fetch = originalFetch;
        yield prisma_1.prisma.$disconnect();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Limpa tabelas relevantes
        yield prisma_1.prisma.device.deleteMany();
        yield prisma_1.prisma.user.deleteMany();
        process.env.NOTIFY_DRY_RUN = 'true';
        delete process.env.EXPO_ACCESS_TOKEN;
        if (global.fetch !== originalFetch) {
            global.fetch = originalFetch;
        }
    }));
    it('envia em dry-run sem chamar fetch quando não há tokens', () => __awaiter(void 0, void 0, void 0, function* () {
        const provider = new push_1.ExpoProvider();
        const user = yield prisma_1.prisma.user.create({ data: { email: 'expo1@test.com', passwordHash: 'x' } });
        yield provider.sendAlarm(user.id, 'event-1');
        expect(global.fetch).toBe(originalFetch); // não deve mudar (não foi mockado)
    }));
    it('envia para tokens expo e desativa inválidos', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.EXPO_ACCESS_TOKEN = 'token-test';
        const calls = [];
        global.fetch = jest.fn((input, opts) => __awaiter(void 0, void 0, void 0, function* () {
            calls.push({ url: input, opts });
            return {
                ok: true,
                json: () => __awaiter(void 0, void 0, void 0, function* () {
                    return ({
                        data: [
                            { status: 'ok' },
                            { status: 'error', details: { error: 'DeviceNotRegistered' } }
                        ]
                    });
                })
            };
        }));
        const provider = new push_1.ExpoProvider();
        const user = yield prisma_1.prisma.user.create({ data: { email: 'expo2@test.com', passwordHash: 'x' } });
        yield prisma_1.prisma.device.createMany({
            data: [
                { userId: user.id, platform: 'ANDROID', pushToken: 'ExponentPushToken[valid]', isActive: true },
                { userId: user.id, platform: 'ANDROID', pushToken: 'ExponentPushToken[invalid]', isActive: true },
                { userId: user.id, platform: 'ANDROID', pushToken: 'nonExpoToken', isActive: true }
            ]
        });
        yield provider.sendAlarm(user.id, 'event-2');
        expect(calls.length).toBe(1);
        const body = JSON.parse(calls[0].opts.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2); // apenas tokens Expo
        expect(body[0].to).toContain('ExponentPushToken[');
        // Verifica que o token inválido foi desativado
        const activeDevices = yield prisma_1.prisma.device.findMany({ where: { userId: user.id, isActive: true } });
        expect(activeDevices.length).toBe(2); // 1 expo ok + 1 non-expo continua ativo
    }));
    it('reitera envio quando fetch falha de forma transitória', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.EXPO_ACCESS_TOKEN = 'token-test';
        let attempt = 0;
        const responses = [
            () => {
                const err = new Error('Premature close');
                err.code = 'UND_ERR_REQ_ABORTED';
                throw err;
            },
            () => ({
                ok: true,
                json: () => __awaiter(void 0, void 0, void 0, function* () { return ({ data: [{ status: 'ok' }] }); })
            })
        ];
        global.fetch = jest.fn(() => __awaiter(void 0, void 0, void 0, function* () {
            const handler = responses[Math.min(attempt, responses.length - 1)];
            attempt += 1;
            return handler();
        }));
        const provider = new push_1.ExpoProvider();
        const user = yield prisma_1.prisma.user.create({ data: { email: 'expo3@test.com', passwordHash: 'x' } });
        yield prisma_1.prisma.device.create({ data: { userId: user.id, platform: 'ANDROID', pushToken: 'ExponentPushToken[retry]', isActive: true } });
        yield provider.sendAlarm(user.id, 'event-3');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    }));
});
