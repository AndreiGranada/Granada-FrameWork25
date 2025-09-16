import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const router = Router();

// GET /me - retorna dados públicos do usuário autenticado
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, timezone: true } });
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }
        res.json({ user });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro interno' });
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
        if (!req.userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Parâmetros inválidos', issues: parsed.error.flatten() });
            return;
        }
        const { name, timezone, passwordCurrent, passwordNew } = parsed.data;
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (timezone !== undefined) data.timezone = timezone;

        if (passwordCurrent || passwordNew) {
            const ok = await bcrypt.compare(passwordCurrent || '', user.passwordHash);
            if (!ok) {
                res.status(409).json({ error: 'Senha atual incorreta' });
                return;
            }
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
        res.status(500).json({ error: 'Erro interno' });
    }
});
