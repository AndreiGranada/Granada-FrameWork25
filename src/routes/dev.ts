import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getNotificationProvider } from '../services/notifications';

const router = Router();
router.use(authMiddleware);

const sosSchema = z.object({
    message: z.string().max(500).optional()
});

const alarmSchema = z.object({
    intakeEventId: z.string().uuid().optional()
});

// Dispara SOS utilizando os contatos ativos do usuário (dev only)
router.post('/test-sos', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = await prisma.emergencyContact.findMany({
            where: { userId: req.userId, isActive: true },
            orderBy: [{ priority: 'asc' }],
            take: 5
        });
        if (!contacts.length) { res.status(400).json({ error: 'Nenhum contato ativo cadastrado' }); return; }
        const text = message || 'S.O.S. (teste)';
        const notify = getNotificationProvider();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text }));
        const result = await notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    } catch (err: any) {
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        // eslint-disable-next-line no-console
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Dispara um alarme de ingestão (dev only)
router.post('/test-alarm', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { intakeEventId } = alarmSchema.parse(req.body ?? {});
        let targetId = intakeEventId;
        if (!targetId) {
            const pending = await prisma.intakeEvent.findFirst({
                where: { userId: req.userId!, status: 'PENDING' },
                orderBy: { scheduledAt: 'asc' }
            });
            if (!pending) { res.status(400).json({ error: 'Nenhum IntakeEvent PENDING encontrado para o usuário. Informe intakeEventId.' }); return; }
            targetId = pending.id;
        }

        const notify = getNotificationProvider();
        await notify.sendAlarm(req.userId!, targetId);
        res.json({ ok: true, intakeEventId: targetId });
    } catch (err: any) {
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        // eslint-disable-next-line no-console
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
