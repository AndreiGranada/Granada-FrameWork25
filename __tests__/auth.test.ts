import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Auth Flow', () => {
    it('register -> login -> refresh', async () => {
        const email = 'user@test.com';
        const password = 'secret123';

        const reg = await request(app).post('/auth/register').send({ email, password, name: 'Test' });
        expect(reg.status).toBe(201);
        expect(reg.body.token).toBeDefined();
        expect(reg.body.refreshToken).toBeDefined();

        const login = await request(app).post('/auth/login').send({ email, password });
        expect(login.status).toBe(200);
        expect(login.body.token).toBeDefined();
        expect(login.body.refreshToken).toBeDefined();

        const refresh = await request(app).post('/auth/refresh').send({ refreshToken: login.body.refreshToken });
        expect(refresh.status).toBe(200);
        expect(refresh.body.token).toBeDefined();
        expect(refresh.body.refreshToken).toBeDefined();
    });

    it('rejects invalid login', async () => {
        const r = await request(app).post('/auth/login').send({ email: 'nao@existe.com', password: 'x' });
        expect([400, 401]).toContain(r.status); // pode ser validação ou credenciais
    });
});
