import request from 'supertest';
import app from '../index';
import { prisma } from '../src/lib/prisma';

// Mock do serviço de e-mail para capturar token
jest.mock('../src/services/mail', () => ({
    sendPasswordResetEmail: jest.fn(async (_to: string, _token: string) => undefined),
}));

const { sendPasswordResetEmail } = require('../src/services/mail');

describe('Forgot/Reset & Rate Limit', () => {
    it('forgot envia token e reset troca senha com token válido', async () => {
        const email = `u${Date.now()}@t.com`;
        const password = 'secret123';
        await request(app).post('/auth/register').send({ email, password });

        // forgot
        await request(app).post('/auth/forgot').send({ email }).expect(200);
        expect(sendPasswordResetEmail).toHaveBeenCalled();

        // capturar token criado no banco
        const prt = await prisma.passwordResetToken.findFirst({
            where: { user: { email } },
            orderBy: { createdAt: 'desc' },
        });
        expect(prt).toBeTruthy();

        // reset com token
        await request(app).post('/auth/reset').send({ token: prt!.token, password: 'newpass123' }).expect(200);

        // login com nova senha funciona; com antiga deve falhar
        await request(app).post('/auth/login').send({ email, password: 'newpass123' }).expect(200);
        await request(app).post('/auth/login').send({ email, password }).expect(401);
    });

    it('reset falha com token expirado ou usado', async () => {
        const email = `e${Date.now()}@t.com`;
        await request(app).post('/auth/register').send({ email, password: 'xpto123' });
        // criar token manual expirado
        const tokExp = await prisma.passwordResetToken.create({
            data: { user: { connect: { email } }, token: `t-exp-${Date.now()}`, expiresAt: new Date(Date.now() - 1000) } as any,
        });
        await request(app).post('/auth/reset').send({ token: tokExp.token, password: 'abc12345' }).expect(400);

        // criar token válido e marcar usado
        const tokUse = await prisma.passwordResetToken.create({
            data: { user: { connect: { email } }, token: `t-use-${Date.now()}`, expiresAt: new Date(Date.now() + 1000 * 60 * 10) } as any,
        });
        await prisma.passwordResetToken.update({ where: { id: tokUse.id }, data: { usedAt: new Date() } });
        await request(app).post('/auth/reset').send({ token: tokUse.token, password: 'abc12345' }).expect(400);
    });

    it('rate limit em /auth/register aplica após múltiplas tentativas', async () => {
        const emailBase = `r${Date.now()}`;
        // 60 tentativas de registro com e-mails diferentes devem bater no limit window
        let status429 = false;
        for (let i = 0; i < 60; i++) {
            const res = await request(app).post('/auth/register').send({ email: `${emailBase}-${i}@t.com`, password: 'abcdef' });
            if (res.status === 429) { status429 = true; break; }
        }
        expect(status429).toBe(true);
    });
});
