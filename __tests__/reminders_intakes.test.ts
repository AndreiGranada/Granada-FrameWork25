import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

async function auth() {
    const email = 'r@test.com';
    await request(app).post('/auth/register').send({ email, password: 'abcdef', name: 'R' });
    const login = await request(app).post('/auth/login').send({ email, password: 'abcdef' });
    return { token: login.body.token, userId: login.body.user?.id };
}

describe('Reminders & Intakes', () => {
    it('create reminder with schedules, list, and mark intake taken (simulado)', async () => {
        const { token, userId } = await auth();

        const createResp = await request(app)
            .post('/reminders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Vitamina C',
                schedules: [
                    { ingestionTimeMinutes: 480 }, // 08:00
                ]
            });
        expect(createResp.status).toBe(201);
        const reminderId = createResp.body.id;
        expect(reminderId).toBeDefined();

        // Invocar manualmente geração de eventos para teste (sem esperar job)
        // Criar intake diretamente para simular job
        const schedule = await prisma.medicationSchedule.findFirstOrThrow({ where: { medicationReminderId: reminderId } });
        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // daqui 5 min
        const intake = await prisma.intakeEvent.create({
            data: { userId, medicationReminderId: reminderId, medicationScheduleId: schedule.id, scheduledAt }
        });

        // Marcar taken
        const takenResp = await request(app)
            .post(`/intakes/${intake.id}/taken`)
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(takenResp.status).toBe(200);
        expect(takenResp.body.status).toBe('TAKEN');
    });
});
