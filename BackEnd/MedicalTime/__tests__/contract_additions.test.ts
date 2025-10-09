import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('Contract additions/tests', () => {
    const app = createApp();

    afterAll(async () => { await prisma.$disconnect(); });

    test('GET /me retorna wrapper { user }', async () => {
        const email = 'contract+me@example.com';
        const reg = await request(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', email);
    });

    test('POST /devices reenvio mesmo pushToken retorna 200 (upsert)', async () => {
        const email = 'contract+device@example.com';
        const reg = await request(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const pushToken = 'ExponentPushToken[abc]';
        const first = await request(app).post('/devices').set('Authorization', `Bearer ${token}`).send({ platform: 'ANDROID', pushToken });
        expect([200, 201]).toContain(first.status);
        const second = await request(app).post('/devices').set('Authorization', `Bearer ${token}`).send({ platform: 'ANDROID', pushToken });
        expect(second.status).toBe(200);
    });

    test('POST /emergency/sos sem contatos ativos retorna 400', async () => {
        const email = 'contract+sos@example.com';
        const reg = await request(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = await request(app).post('/emergency/sos').set('Authorization', `Bearer ${token}`).send({});
        expect(res.status).toBe(400);
    });

    test('GET /intakes/history paginado última página nextCursor null', async () => {
        const email = 'contract+history@example.com';
        const reg = await request(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = await request(app).get('/intakes/history?limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        if (res.body.pageInfo) {
            expect(res.body.pageInfo.hasMore).toBe(false);
            expect(res.body.pageInfo.nextCursor).toBeNull();
        }
    });
});
