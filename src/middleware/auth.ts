import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
    const token = auth.substring(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret) as { sub?: string };
        if (!payload.sub) {
            res.status(401).json({ error: 'Token inválido' });
            return;
        }
        req.userId = payload.sub;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
