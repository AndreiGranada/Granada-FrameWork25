import { prisma } from '../../src/lib/prisma';
import jwt from 'jsonwebtoken';

export async function createUserAndToken(email: string) {
    const user = await prisma.user.create({ data: { email, passwordHash: 'dummy-hash', timezone: 'America/Sao_Paulo' } });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
    return { user, token };
}

export async function registerViaApi(app: any, email: string, password = 'secret123') {
    const res = await app.post('/auth/register').send({ email, password });
    return res.body;
}