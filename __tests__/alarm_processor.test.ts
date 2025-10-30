import { prisma } from '../src/lib/prisma';

// Helper to create minimal entities
async function seedUserAndReminder() {
    const user = await prisma.user.create({ data: { email: `u${Date.now()}@test.com`, passwordHash: 'x' } });
    const reminder = await prisma.medicationReminder.create({ data: { userId: user.id, name: 'Teste' } });
    return { user, reminder };
}

function loadProcessorWithMock(mockProvider: any) {
    jest.resetModules();
    jest.doMock('../src/services/notifications', () => ({
        getNotificationProvider: () => mockProvider
    }));
    let processPendingAlarms: any;
    jest.isolateModules(() => {
        // Importa o módulo sob teste com o mock em vigor
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        processPendingAlarms = require('../src/services/intakeAlarms').processPendingAlarms;
    });
    return processPendingAlarms as typeof import('../src/services/intakeAlarms').processPendingAlarms;
}

describe('Alarm processor', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    beforeEach(async () => {
        await prisma.intakeEvent.deleteMany();
        await prisma.medicationSchedule.deleteMany();
        await prisma.medicationReminder.deleteMany();
        await prisma.user.deleteMany();
    });

    it('envia alarme e incrementa attempts', async () => {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '2';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '30';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';

        const { user, reminder } = await seedUserAndReminder();
        const ev = await prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 60 * 1000)
            }
        });

        const sendCalls: Array<{ userId: string; eventId: string }> = [];
        const mockProvider = {
            sendAlarm: async (userId: string, intakeEventId: string) => {
                sendCalls.push({ userId, eventId: intakeEventId });
            },
            sendSosBulk: async () => ({ sent: 0 })
        };
        const processPendingAlarms = loadProcessorWithMock(mockProvider);

        const res = await processPendingAlarms();
        expect(res.sent).toBe(1);
        expect(res.missed).toBe(0);

        const updated = await prisma.intakeEvent.findUniqueOrThrow({ where: { id: ev.id } });
        expect(updated.attempts).toBe(1);
        expect(sendCalls.length).toBe(1);
    });

    it('faz retry até MAX_ATTEMPTS e depois para', async () => {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '2';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '30';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';

        const { user, reminder } = await seedUserAndReminder();
        await prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 2 * 60 * 1000)
            }
        });

        const sendCalls: string[] = [];
        const mockProvider = {
            sendAlarm: async (_userId: string, intakeEventId: string) => {
                sendCalls.push(intakeEventId);
            },
            sendSosBulk: async () => ({ sent: 0 })
        };
        const processPendingAlarms = loadProcessorWithMock(mockProvider);
        await processPendingAlarms(); // attempts 1
        await processPendingAlarms(); // attempts 2
        // Terceira rodada não deve enviar (já atingiu MAX_ATTEMPTS)
        const res3 = await processPendingAlarms();

        expect(sendCalls.length).toBe(2);
        expect(res3.sent === 0).toBeTruthy();
    });

    it('marca MISSED quando passa da janela', async () => {
        process.env.ALARM_RETRY_INTERVAL_MIN = '1';
        process.env.ALARM_MAX_ATTEMPTS = '3';
        process.env.ALARM_MARK_MISSED_AFTER_MIN = '1';
        process.env.ALARM_SCAN_WINDOW_HOURS = '6';

        const { user, reminder } = await seedUserAndReminder();
        const ev = await prisma.intakeEvent.create({
            data: {
                userId: user.id,
                medicationReminderId: reminder.id,
                scheduledAt: new Date(Date.now() - 5 * 60 * 1000)
            }
        });

        const processPendingAlarms = loadProcessorWithMock({
            sendAlarm: async () => { throw new Error('não deve ser chamado'); },
            sendSosBulk: async () => ({ sent: 0 })
        });
        const res = await processPendingAlarms();

        expect(res.missed).toBeGreaterThanOrEqual(1);
        const updated = await prisma.intakeEvent.findUniqueOrThrow({ where: { id: ev.id } });
        expect(updated.status).toBe('MISSED');
    });
});
