import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { errorHelpers, mapZodError } from '../lib/errors';
import { addHours } from 'date-fns';

const router = Router();
router.use(authMiddleware);

const GRACE_PERIOD_MINUTES = Number(process.env.INTAKE_GRACE_PERIOD_MIN ?? 15);
const GRACE_PERIOD_MS = GRACE_PERIOD_MINUTES * 60 * 1000;

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

        const eventsRaw = await prisma.intakeEvent.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        const events = eventsRaw.map(e => ({
            id: e.id,
            medicationReminderId: e.medicationReminderId,
            medicationScheduleId: e.medicationScheduleId,
            scheduledAt: e.scheduledAt,
            status: e.status,
            attempts: e.attempts,
            takenAt: e.takenAt,
            graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
            reminder: e.medicationReminder ? {
                id: e.medicationReminder.id,
                name: e.medicationReminder.name,
                photoUrl: e.medicationReminder.photoUrl
            } : undefined,
            schedule: e.medicationSchedule ? {
                id: e.medicationSchedule.id,
                ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes
            } : null
        }));
        res.json(events);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Parâmetros inválidos', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// GET /intakes/history
// Modos:
//  - Legacy: ?days=7 (retorna array simples)
//  - Paginado (novo): ?limit=50&cursor=<scheduledAt_iso> (retorna envelope { data, pageInfo }) ordenado desc por scheduledAt
const historySchema = z.object({
    days: z.string().regex(/^[\d]+$/).optional(),
    limit: z.string().regex(/^[\d]+$/).optional(),
    cursor: z.string().datetime().optional()
});
router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { days, limit, cursor } = historySchema.parse(req.query);

        // Se limit for enviado => modo paginado
        if (limit) {
            const take = Math.min(Number(limit), 200) + 1; // pegar 1 extra para saber se há next
            const where: any = { userId: req.userId };
            if (cursor) {
                // scheduledAt < cursor (ordenado desc)
                where.scheduledAt = { lt: new Date(cursor) };
            }
            const eventsRaw = await prisma.intakeEvent.findMany({
                where,
                orderBy: { scheduledAt: 'desc' },
                take,
                include: {
                    medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                    medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
                }
            });
            const hasMore = eventsRaw.length === take;
            const slice = hasMore ? eventsRaw.slice(0, -1) : eventsRaw;
            const mapped = slice.map(e => ({
                id: e.id,
                medicationReminderId: e.medicationReminderId,
                medicationScheduleId: e.medicationScheduleId,
                scheduledAt: e.scheduledAt,
                status: e.status,
                attempts: e.attempts,
                takenAt: e.takenAt,
                graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
                reminder: e.medicationReminder ? { id: e.medicationReminder.id, name: e.medicationReminder.name, photoUrl: e.medicationReminder.photoUrl } : undefined,
                schedule: e.medicationSchedule ? { id: e.medicationSchedule.id, ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes } : null
            }));
            res.json({ data: mapped, pageInfo: { hasMore, nextCursor: hasMore ? mapped[mapped.length - 1].scheduledAt : null } });
            return;
        }

        // Legacy array simples baseado em days
        const d = Math.min(days ? Number(days) : 7, 90);
        const to = new Date();
        const from = new Date(to.getTime() - d * 24 * 60 * 60 * 1000);
        const eventsRaw = await prisma.intakeEvent.findMany({
            where: { userId: req.userId, scheduledAt: { gte: from, lte: to } },
            orderBy: { scheduledAt: 'desc' },
            take: 500,
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        const events = eventsRaw.map(e => ({
            id: e.id,
            medicationReminderId: e.medicationReminderId,
            medicationScheduleId: e.medicationScheduleId,
            scheduledAt: e.scheduledAt,
            status: e.status,
            attempts: e.attempts,
            takenAt: e.takenAt,
            graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
            reminder: e.medicationReminder ? { id: e.medicationReminder.id, name: e.medicationReminder.name, photoUrl: e.medicationReminder.photoUrl } : undefined,
            schedule: e.medicationSchedule ? { id: e.medicationSchedule.id, ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes } : null
        }));
        res.json(events);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Parâmetros inválidos', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Marcar evento como tomado
router.post('/:id/taken', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const event = await prisma.intakeEvent.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!event) return errorHelpers.notFound(res, 'Evento não encontrado');
        if (event.status === 'TAKEN') return errorHelpers.conflict(res, 'Já marcado como tomado');
        if (event.status === 'MISSED') return errorHelpers.conflict(res, 'Evento perdido, não pode ser tomado');

        const updated = await prisma.intakeEvent.update({
            where: { id: event.id },
            data: { status: 'TAKEN', takenAt: new Date() },
            select: {
                id: true,
                medicationReminderId: true,
                medicationScheduleId: true,
                scheduledAt: true,
                status: true,
                attempts: true,
                takenAt: true
            }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

export default router;
