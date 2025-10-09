import request from 'supertest';
import appFactory from '../index';
import { prisma } from '../src/lib/prisma';
import { subDays, addMinutes } from 'date-fns';
import { generateUpcomingIntakeEvents } from '../src/services/intakeScheduler';
import { runCleanup } from '../src/services/cleanup';

const app = appFactory;

async function registerAndLogin(email: string, password = 'secret') {
    await request(app).post('/auth/register').send({ name: 'Test', email, password });
    const login = await request(app).post('/auth/login').send({ email, password });
    const token = login.body.token as string;
    const userId = login.body.user.id as string;
    return { token, userId };
}

describe('Scheduler & Cleanup', () => {
    it('gera IntakeEvents para schedules ativos e não duplica', async () => {
        const { userId, token } = await registerAndLogin(`user${Date.now()}@t.com`);

        // cria reminder + schedule (08:00 todos os dias)
        const reminder = await request(app)
            .post('/reminders')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Med A', schedules: [{ ingestionTimeMinutes: 480 }] })
            .expect(201);

        expect(reminder.body.id).toBeTruthy();

        const already = await prisma.intakeEvent.count({ where: { userId } });
        expect(already).toBeGreaterThan(0);

        await prisma.intakeEvent.deleteMany({ where: { userId } });

        const before = await prisma.intakeEvent.count({ where: { userId } });
        expect(before).toBe(0);

        const r1 = await generateUpcomingIntakeEvents();
        const after1 = await prisma.intakeEvent.count({ where: { userId } });
        const r2 = await generateUpcomingIntakeEvents();
        const after2 = await prisma.intakeEvent.count({ where: { userId } });

        expect(r1.created).toBeGreaterThan(0);
        expect(after1).toBeGreaterThan(before);
        // segunda chamada não deve criar duplicados
        expect(r2.created).toBe(0);
        expect(after2).toBe(after1);
    });

    it('cleanup remove tokens expirados/usados e intakes antigos', async () => {
        const { userId } = await registerAndLogin(`user${Date.now()}@t.com`);

        // Criar intake antigo (>90d)
        await prisma.intakeEvent.create({
            data: {
                userId,
                medicationReminderId: (await prisma.medicationReminder.create({
                    data: { userId, name: 'MedX' }
                })).id,
                scheduledAt: subDays(new Date(), 91)
            }
        });

        // Criar password reset expirado e usado há > 1 dia
        await prisma.passwordResetToken.createMany({
            data: [
                { userId, token: `t-${Date.now()}-exp`, expiresAt: subDays(new Date(), 1) },
                { userId, token: `t-${Date.now()}-used`, expiresAt: addMinutes(new Date(), 10), usedAt: subDays(new Date(), 2) }
            ] as any
        });

        const res = await runCleanup();

        expect(res.removedIntakeEvents).toBeGreaterThanOrEqual(1);
        expect(res.removedResetTokens).toBeGreaterThanOrEqual(2);
    });
});
