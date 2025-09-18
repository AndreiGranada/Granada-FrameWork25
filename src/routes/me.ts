import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { errorHelpers, mapZodError } from '../lib/errors';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const router = Router();

// GET /me - retorna dados públicos do usuário autenticado
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) return errorHelpers.unauthorized(res);
        const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, timezone: true } });
        if (!user) return errorHelpers.notFound(res, 'Usuário não encontrado');
        res.json({ user });
    } catch (e) {
        console.error(e);
        errorHelpers.internal(res);
    }
});

export default router;
// PATCH /me - atualizar perfil / trocar senha
const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).max(60).optional(),
    passwordCurrent: z.string().min(6).optional(),
    passwordNew: z.string().min(6).optional()
}).refine(d => !!(d.name || d.timezone || (d.passwordCurrent && d.passwordNew)), {
    message: 'Enviar ao menos um campo (name, timezone ou passwordCurrent+passwordNew)'
}).refine(d => {
    if (d.passwordCurrent || d.passwordNew) {
        return !!(d.passwordCurrent && d.passwordNew);
    }
    return true;
}, { message: 'Para trocar a senha envie passwordCurrent e passwordNew' });

router.patch('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) return errorHelpers.unauthorized(res);
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(parsed.error));
        const { name, timezone, passwordCurrent, passwordNew } = parsed.data;
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return errorHelpers.notFound(res, 'Usuário não encontrado');

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (timezone !== undefined) data.timezone = timezone;

        if (passwordCurrent || passwordNew) {
            const ok = await bcrypt.compare(passwordCurrent || '', user.passwordHash);
            if (!ok) return errorHelpers.conflict(res, 'Senha atual incorreta');
            const hash = await bcrypt.hash(passwordNew!, 10);
            data.passwordHash = hash;
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data,
            select: { id: true, email: true, name: true, timezone: true }
        });
        res.json({ user: updated });
    } catch (e) {
        console.error(e);
        errorHelpers.internal(res);
    }
});
