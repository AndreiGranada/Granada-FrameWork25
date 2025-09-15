import crypto from 'crypto';
import { prisma } from '../lib/prisma';

// Gera token raw + persist hash (SHA-256) com expiração configurável
export async function issueRefreshToken(userId: string, ttlDays = 30) {
    const raw = crypto.randomBytes(48).toString('hex');
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: { userId, tokenHash, expiresAt }
    });
    return { refreshToken: raw, expiresAt };
}

export function sha256(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

// Valida, verifica expiração e rotação opcional
export async function rotateRefreshToken(oldTokenRaw: string, ttlDays = 30) {
    const hash = sha256(oldTokenRaw);
    const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
        return null; // inválido ou expirado
    }
    // revogar antigo e emitir novo atomicamente
    const newRaw = crypto.randomBytes(48).toString('hex');
    const newHash = sha256(newRaw);
    const newExpires = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
        prisma.refreshToken.update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } }),
        prisma.refreshToken.create({ data: { userId: existing.userId, tokenHash: newHash, expiresAt: newExpires } })
    ]);
    return { userId: existing.userId, refreshToken: newRaw, expiresAt: newExpires };
}

export async function revokeAllUserRefreshTokens(userId: string) {
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
