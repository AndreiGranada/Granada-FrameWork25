import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { errorHelpers } from '../lib/errors';

function parseDuration(input: string | undefined, defMs: number): number {
    if (!input || input.trim() === '') return defMs;
    const s = input.trim().toLowerCase();
    // número puro => ms
    if (/^\d+$/.test(s)) return Number(s);
    const match = s.match(/^(\d+)(ms|s|m|h)$/);
    if (!match) return defMs;
    const val = Number(match[1]);
    const unit = match[2];
    switch (unit) {
        case 'ms': return val;
        case 's': return val * 1000;
        case 'm': return val * 60 * 1000;
        case 'h': return val * 60 * 60 * 1000;
        default: return defMs;
    }
}

const authWindowMs = parseDuration(process.env.RATE_LIMIT_AUTH_WINDOW, 15 * 60 * 1000);
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? 50);

export const authLimiter = rateLimit({
    windowMs: authWindowMs,
    limit: Number.isFinite(authMax) && authMax > 0 ? authMax : 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, res: Response, _next: NextFunction, options) => {
        const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return errorHelpers.rateLimit(res, 'Muitas requisições de autenticação. Tente novamente mais tarde.', retryAfterSeconds);
    }
});

const sosWindowMs = parseDuration(process.env.RATE_LIMIT_SOS_WINDOW, 10 * 60 * 1000);
const sosMax = Number(process.env.RATE_LIMIT_SOS_MAX ?? 10);

export const sosLimiter = rateLimit({
    windowMs: sosWindowMs,
    limit: Number.isFinite(sosMax) && sosMax > 0 ? sosMax : 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, res: Response, _next: NextFunction, options) => {
        const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return errorHelpers.rateLimit(res, 'Muitas requisições S.O.S. Tente novamente mais tarde.', retryAfterSeconds);
    }
});
