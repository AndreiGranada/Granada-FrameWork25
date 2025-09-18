import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorHelpers } from '../lib/errors';

export interface AuthRequest extends Request {
    userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return errorHelpers.unauthorized(res);
    const token = auth.substring(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret) as { sub?: string };
        if (!payload.sub) return errorHelpers.unauthorized(res, 'Token inválido');
        req.userId = payload.sub;
        next();
    } catch (e) {
        errorHelpers.unauthorized(res, 'Token inválido ou expirado');
    }
}
