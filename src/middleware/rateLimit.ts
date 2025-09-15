import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições de autenticação. Tente novamente mais tarde.' }
});

export const sosLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 min
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições S.O.S. Tente novamente mais tarde.' }
});
