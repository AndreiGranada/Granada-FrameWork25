import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('PATCH /me', () => {
    it('atualiza nome e timezone', async () => {
        const email = 'user2@test.com';
        const password = 'secret123';
        const reg = await request(app).post('/auth/register').send({ email, password, name: 'Orig' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;

        const resp = await request(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Novo Nome', timezone: 'Europe/London' });
        expect(resp.status).toBe(200);
        expect(resp.body.user.name).toBe('Novo Nome');
        expect(resp.body.user.timezone).toBe('Europe/London');
    });

    it('troca senha com passwordCurrent/passwordNew', async () => {
        const email = 'user3@test.com';
        const password = 'secret123';
        const reg = await request(app).post('/auth/register').send({ email, password, name: 'User3' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;

        const change = await request(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ passwordCurrent: 'secret123', passwordNew: 'novaSenha789' });
        expect(change.status).toBe(200);

        // Login com nova senha deve funcionar
        const login = await request(app).post('/auth/login').send({ email, password: 'novaSenha789' });
        expect(login.status).toBe(200);
    });

    it('falha se passwordCurrent incorreta', async () => {
        const email = 'user4@test.com';
        const password = 'secret123';
        const reg = await request(app).post('/auth/register').send({ email, password, name: 'User4' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;

        const change = await request(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ passwordCurrent: 'errada', passwordNew: 'qualquer123' });
        expect([400, 409]).toContain(change.status);
    });
});
