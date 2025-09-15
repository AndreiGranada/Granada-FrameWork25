import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { addHours } from 'date-fns';

const router = Router();
router.use(authMiddleware);

// Query schemas
const listSchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    hours: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['PENDING', 'TAKEN', 'MISSED']).optional()
});

// GET /intakes => lista eventos no intervalo
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const parsed = listSchema.parse(req.query);
        const now = new Date();
        const from = parsed.from ? new Date(parsed.from) : now;
        let to: Date;
        if (parsed.to) {
            to = new Date(parsed.to);
        } else if (parsed.hours) {
            to = addHours(from, Number(parsed.hours));
        } else {
            to = addHours(from, 24); // default
        }

        const where: any = {
            userId: req.userId,
            scheduledAt: { gte: from, lte: to }
        };
        if (parsed.status) where.status = parsed.status;

        const events = await prisma.intakeEvent.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        res.json(events);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Parâmetros inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// GET /intakes/history?days=7 => histórico passado (limite 90)
const historySchema = z.object({ days: z.string().regex(/^\d+$/).optional() });
router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { days } = historySchema.parse(req.query);
        const d = Math.min(days ? Number(days) : 7, 90);
        const to = new Date();
        const from = new Date(to.getTime() - d * 24 * 60 * 60 * 1000);
        const events = await prisma.intakeEvent.findMany({
            where: { userId: req.userId, scheduledAt: { gte: from, lte: to } },
            orderBy: { scheduledAt: 'desc' },
            take: 500
        });
        res.json(events);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Parâmetros inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Marcar evento como tomado
router.post('/:id/taken', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const event = await prisma.intakeEvent.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!event) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        if (event.status === 'TAKEN') {
            res.status(409).json({ error: 'Já marcado como tomado' });
            return;
        }
        if (event.status === 'MISSED') {
            res.status(409).json({ error: 'Evento perdido, não pode ser tomado' });
            return;
        }

        const updated = await prisma.intakeEvent.update({
            where: { id: event.id },
            data: { status: 'TAKEN', takenAt: new Date() }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
