import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/mail';
import { addMinutes, isBefore } from 'date-fns';
import { authLimiter } from '../middleware/rateLimit';
import { issueRefreshToken, rotateRefreshToken, revokeAllUserRefreshTokens } from '../services/refreshToken';
import { errorHelpers, mapZodError } from '../lib/errors';

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
        if (existing) return errorHelpers.conflict(res, 'E-mail já cadastrado');

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
        res.status(201).json({
            user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
            token,
            refreshToken,
            refreshExpiresAt: expiresAt
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        // Mapeia violação de unicidade de e-mail para 409 (CONFLICT)
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            const target = (err.meta as any)?.target as string[] | undefined;
            if (!target || target.includes('email')) {
                return errorHelpers.conflict(res, 'E-mail já cadastrado');
            }
        }
        console.error(err);
        errorHelpers.internal(res);
    }
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) return errorHelpers.unauthorized(res, 'Credenciais inválidas');

        const ok = await bcrypt.compare(data.password, user.passwordHash);
        if (!ok) return errorHelpers.unauthorized(res, 'Credenciais inválidas');

        const token = signToken(user.id);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const { refreshToken, expiresAt } = await issueRefreshToken(user.id);
        res.json({
            user: { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
            token,
            refreshToken,
            refreshExpiresAt: expiresAt
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

router.post('/forgot', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = forgotSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
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
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

router.post('/reset', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, password } = resetSchema.parse(req.body);
        const prt = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!prt || prt.usedAt || isBefore(prt.expiresAt, new Date())) return errorHelpers.badRequest(res, 'Token inválido ou expirado');
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.$transaction([
            prisma.user.update({ where: { id: prt.userId }, data: { passwordHash } }),
            prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } })
        ]);
        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Refresh de token de acesso usando token de refresh rotacionado
const refreshSchema = z.object({ refreshToken: z.string().min(10) });
router.post('/refresh', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const rotated = await rotateRefreshToken(refreshToken);
        if (!rotated) return errorHelpers.unauthorized(res, 'Refresh token inválido');
        const accessToken = signToken(rotated.userId);
        // Carrega usuário para devolver junto (reduz necessidade de GET /me após refresh)
        const user = await prisma.user.findUnique({ where: { id: rotated.userId }, select: { id: true, email: true, name: true, timezone: true } });
        res.json({
            user,
            token: accessToken,
            refreshToken: rotated.refreshToken,
            refreshExpiresAt: rotated.expiresAt
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Logout global (revoga todos os refresh tokens do usuário autenticado)
router.post('/logout', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) return errorHelpers.unauthorized(res);
        const token = authHeader.substring(7);
        try {
            const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
            await revokeAllUserRefreshTokens(payload.sub);
            res.json({ message: 'Logout efetuado' });
        } catch {
            errorHelpers.unauthorized(res, 'Token inválido');
        }
    } catch (err: any) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

export default router;
