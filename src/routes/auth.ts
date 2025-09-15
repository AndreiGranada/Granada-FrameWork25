import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/mail';
import { addMinutes, isBefore } from 'date-fns';
import { authLimiter } from '../middleware/rateLimit';
import { issueRefreshToken, rotateRefreshToken, revokeAllUserRefreshTokens } from '../services/refreshToken';

const router = Router();

const registerSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email(),
    password: z.string().min(6).max(100)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100)
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(6).max(100) });

function signToken(userId: string) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
}

router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = registerSchema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            res.status(409).json({ error: 'E-mail já cadastrado' });
            return;
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash
            }
        });

        const token = signToken(user.id);
        const { refreshToken, expiresAt } = await issueRefreshToken(user.id);
        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token, refreshToken, refreshExpiresAt: expiresAt });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const ok = await bcrypt.compare(data.password, user.passwordHash);
        if (!ok) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const token = signToken(user.id);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const { refreshToken, expiresAt } = await issueRefreshToken(user.id);
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token, refreshToken, refreshExpiresAt: expiresAt });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/forgot', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = forgotSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Resposta genérica para não revelar existência
            res.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
            return;
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = addMinutes(new Date(), 30);
        await prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt }
        });
        await sendPasswordResetEmail(user.email, token);
        res.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

router.post('/reset', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, password } = resetSchema.parse(req.body);
        const prt = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!prt || prt.usedAt || isBefore(prt.expiresAt, new Date())) {
            res.status(400).json({ error: 'Token inválido ou expirado' });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.$transaction([
            prisma.user.update({ where: { id: prt.userId }, data: { passwordHash } }),
            prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } })
        ]);
        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Refresh de token de acesso usando token de refresh rotacionado
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
router.post('/refresh', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const rotated = await rotateRefreshToken(refreshToken);
        if (!rotated) {
            res.status(401).json({ error: 'Refresh token inválido' });
            return;
        }
        const accessToken = signToken(rotated.userId);
        res.json({ token: accessToken, refreshToken: rotated.refreshToken, refreshExpiresAt: rotated.expiresAt });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Logout global (revoga todos os refresh tokens do usuário autenticado)
router.post('/logout', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
            await revokeAllUserRefreshTokens(payload.sub);
            res.json({ message: 'Logout efetuado' });
        } catch {
            res.status(401).json({ error: 'Token inválido' });
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
