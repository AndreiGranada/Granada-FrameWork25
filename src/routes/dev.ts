import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getNotificationProvider } from '../services/notifications';
import { errorHelpers, mapZodError } from '../lib/errors';

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
            orderBy: [{ createdAt: 'asc' }],
            take: 5
        });
        if (!contacts.length) return errorHelpers.badRequest(res, 'Nenhum contato ativo cadastrado');
        const text = message || 'S.O.S. (teste)';
        const notify = getNotificationProvider();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text }));
        const result = await notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
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
            if (!pending) return errorHelpers.badRequest(res, 'Nenhum IntakeEvent PENDING encontrado para o usuário. Informe intakeEventId.');
            targetId = pending.id;
        }

        const notify = getNotificationProvider();
        await notify.sendAlarm(req.userId!, targetId);
        res.json({ ok: true, intakeEventId: targetId });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

export default router;
