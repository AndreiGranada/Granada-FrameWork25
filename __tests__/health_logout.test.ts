import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Health e Logout', () => {
    test('GET /health retorna status e componentes', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('time');
    });

    test('POST /auth/logout retorna message', async () => {
        // Registrar usuário para obter token
        const reg = await request(app).post('/auth/register').send({ email: 'logout@test.com', password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });
});