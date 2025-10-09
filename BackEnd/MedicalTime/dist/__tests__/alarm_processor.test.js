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
// Helper to create minimal entities
function seedUserAndReminder() {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.create({ data: { email: `u${Date.now()}@test.com`, passwordHash: 'x' } });
        const reminder = yield prisma_1.prisma.medicationReminder.create({ data: { userId: user.id, name: 'Teste' } });
        return { user, reminder };
    });
}
function loadProcessorWithMock(mockProvider) {
    jest.resetModules();
    jest.doMock('../src/services/notifications', () => ({
        getNotificationProvider: () => mockProvider
    }));
    let processPendingAlarms;
    jest.isolateModules(() => {
        // Importa o módulo sob teste com o mock em vigor
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        processPendingAlarms = require('../src/services/intakeAlarms').processPendingAlarms;
    });
    return processPendingAlarms;
}
describe('Alarm processor', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.$connect();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.$disconnect();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.prisma.intakeEvent.deleteMany();
        yield prisma_1.prisma.medicationSchedule.deleteMany();
        yield prisma_1.prisma.medicationReminder.deleteMany();
        yield prisma_1.prisma.user.deleteMany();
    }));
    it('envia alarme e incrementa attempts', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '2';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '30';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';
        const { user, reminder } = yield seedUserAndReminder();
        const ev = yield prisma_1.prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 60 * 1000)
            }
        });
        const sendCalls = [];
        const mockProvider = {
            sendAlarm: (userId, intakeEventId) => __awaiter(void 0, void 0, void 0, function* () {
                sendCalls.push({ userId, eventId: intakeEventId });
            }),
            sendSosBulk: () => __awaiter(void 0, void 0, void 0, function* () { return ({ sent: 0 }); })
        };
        const processPendingAlarms = loadProcessorWithMock(mockProvider);
        const res = yield processPendingAlarms();
        expect(res.sent).toBe(1);
        expect(res.missed).toBe(0);
        const updated = yield prisma_1.prisma.intakeEvent.findUniqueOrThrow({ where: { id: ev.id } });
        expect(updated.attempts).toBe(1);
        expect(sendCalls.length).toBe(1);
    }));
    it('faz retry até MAX_ATTEMPTS e depois para', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '2';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '30';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';
        const { user, reminder } = yield seedUserAndReminder();
        yield prisma_1.prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 2 * 60 * 1000)
            }
        });
        const sendCalls = [];
        const mockProvider = {
            sendAlarm: (_userId, intakeEventId) => __awaiter(void 0, void 0, void 0, function* () {
                sendCalls.push(intakeEventId);
            }),
            sendSosBulk: () => __awaiter(void 0, void 0, void 0, function* () { return ({ sent: 0 }); })
        };
        const processPendingAlarms = loadProcessorWithMock(mockProvider);
        yield processPendingAlarms(); // attempts 1
        yield processPendingAlarms(); // attempts 2
        // Terceira rodada não deve enviar (já atingiu MAX_ATTEMPTS)
        const res3 = yield processPendingAlarms();
        expect(sendCalls.length).toBe(2);
        expect(res3.sent === 0).toBeTruthy();
    }));
    it('marca MISSED quando passa da janela', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '3';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '1';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';
        const { user, reminder } = yield seedUserAndReminder();
        const ev = yield prisma_1.prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 5 * 60 * 1000)
            }
        });
        const processPendingAlarms = loadProcessorWithMock({
            sendAlarm: () => __awaiter(void 0, void 0, void 0, function* () { throw new Error('não deve ser chamado'); }),
            sendSosBulk: () => __awaiter(void 0, void 0, void 0, function* () { return ({ sent: 0 }); })
        });
        const res = yield processPendingAlarms();
        expect(res.missed).toBeGreaterThanOrEqual(1);
        const updated = yield prisma_1.prisma.intakeEvent.findUniqueOrThrow({ where: { id: ev.id } });
        expect(updated.status).toBe('MISSED');
    }));
});
