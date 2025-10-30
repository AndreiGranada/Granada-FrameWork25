import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { errorHelpers, mapZodError } from '../lib/errors';
import { resyncUpcomingEventsForReminder, resyncUpcomingEventsForSchedule } from '../services/intakeEventsSync';

const router = Router();

// Esquemas de validação
const scheduleSchema = z.object({
    ingestionTimeMinutes: z.number().int().min(0).max(1439),
    daysOfWeekBitmask: z.number().int().min(0).max(127).optional().default(0),
    isActive: z.boolean().optional().default(true)
});

const createReminderSchema = z.object({
    name: z.string().min(1).max(120),
    purpose: z.string().max(255).optional(),
    description: z.string().optional(),
    pricePaid: z.string().optional(), // Decimal como string
    photoUrl: z.string().url().optional(),
    // Permite criar lembrete sem horários inicialmente (UI adiciona depois)
    schedules: z.array(scheduleSchema).optional().default([])
});

const updateReminderSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    purpose: z.string().max(255).optional(),
    description: z.string().optional(),
    pricePaid: z.string().optional(),
    photoUrl: z.string().url().optional(),
    isActive: z.boolean().optional()
});

const updateScheduleSchema = z.object({
    ingestionTimeMinutes: z.number().int().min(0).max(1439).optional(),
    daysOfWeekBitmask: z.number().int().min(0).max(127).optional(),
    isActive: z.boolean().optional()
});

// Middleware de auth aplicado a todas as rotas abaixo
router.use(authMiddleware);

// Criar reminder + schedules
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = createReminderSchema.parse(req.body);
        const reminder = await prisma.medicationReminder.create({
            data: {
                userId: req.userId!,
                name: data.name,
                purpose: data.purpose,
                description: data.description,
                pricePaid: data.pricePaid ? data.pricePaid : undefined,
                photoUrl: data.photoUrl,
                schedules: {
                    create: data.schedules.map(s => ({
                        ingestionTimeMinutes: s.ingestionTimeMinutes,
                        daysOfWeekBitmask: s.daysOfWeekBitmask ?? 0,
                        isActive: s.isActive ?? true
                    }))
                }
            },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        await resyncUpcomingEventsForReminder(reminder.id);
        res.status(201).json(reminder);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Listar reminders do usuário
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminders = await prisma.medicationReminder.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        res.json(reminders);
    } catch (err) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Obter reminder específico
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminder = await prisma.medicationReminder.findFirst({
            where: { id: req.params.id, userId: req.userId },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        if (!reminder) return errorHelpers.notFound(res, 'Reminder não encontrado');
        res.json(reminder);
    } catch (err) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Atualizar reminder (metadados)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateReminderSchema.parse(req.body);
        const r = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) return errorHelpers.notFound(res, 'Reminder não encontrado');
        const toggledActive = typeof data.isActive !== 'undefined' && data.isActive !== r.isActive;
        const updated = await prisma.medicationReminder.update({
            where: { id: r.id },
            data: {
                name: data.name ?? r.name,
                purpose: data.purpose ?? r.purpose,
                description: data.description ?? r.description,
                pricePaid: data.pricePaid ?? r.pricePaid,
                photoUrl: data.photoUrl ?? r.photoUrl,
                isActive: data.isActive ?? r.isActive
            },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        if (toggledActive) {
            await resyncUpcomingEventsForReminder(updated.id);
        }
        res.json(updated);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Adicionar schedule a um reminder
router.post('/:id/schedules', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = scheduleSchema.parse(req.body);
        const r = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) return errorHelpers.notFound(res, 'Reminder não encontrado');
        const createdSchedule = await prisma.medicationSchedule.create({
            data: {
                medicationReminderId: r.id,
                ingestionTimeMinutes: data.ingestionTimeMinutes,
                daysOfWeekBitmask: data.daysOfWeekBitmask ?? 0,
                isActive: data.isActive ?? true
            },
            select: { id: true }
        });
        await resyncUpcomingEventsForSchedule(createdSchedule.id);
        const updatedReminder = await prisma.medicationReminder.findUnique({
            where: { id: r.id },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        res.status(201).json(updatedReminder);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Editar schedule
router.patch('/schedules/:scheduleId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateScheduleSchema.parse(req.body);
        const schedule = await prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) return errorHelpers.notFound(res, 'Schedule não encontrado');
        await prisma.medicationSchedule.update({
            where: { id: schedule.id },
            data: {
                ingestionTimeMinutes: data.ingestionTimeMinutes ?? schedule.ingestionTimeMinutes,
                daysOfWeekBitmask: data.daysOfWeekBitmask ?? schedule.daysOfWeekBitmask,
                isActive: data.isActive ?? schedule.isActive
            }
        });
        await resyncUpcomingEventsForSchedule(schedule.id);
        const reminder = await prisma.medicationReminder.findUnique({
            where: { id: schedule.medicationReminderId },
            select: {
                id: true,
                name: true,
                purpose: true,
                description: true,
                pricePaid: true,
                photoUrl: true,
                isActive: true,
                schedules: {
                    select: {
                        id: true,
                        ingestionTimeMinutes: true,
                        daysOfWeekBitmask: true,
                        isActive: true
                    }
                }
            }
        });
        res.json(reminder);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Remover schedule
router.delete('/schedules/:scheduleId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const schedule = await prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) return errorHelpers.notFound(res, 'Schedule não encontrado');
        await prisma.medicationSchedule.delete({ where: { id: schedule.id } });
        await resyncUpcomingEventsForSchedule(schedule.id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

// Soft delete de reminder (desativar reminder e seus schedules)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminder = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!reminder) return errorHelpers.notFound(res, 'Reminder não encontrado');
        if (!reminder.isActive) {
            // idempotente: já inativo -> 204
            res.status(204).send();
            return;
        }
        await prisma.$transaction([
            prisma.medicationReminder.update({ where: { id: reminder.id }, data: { isActive: false } }),
            prisma.medicationSchedule.updateMany({ where: { medicationReminderId: reminder.id }, data: { isActive: false } })
        ]);
        await resyncUpcomingEventsForReminder(reminder.id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        errorHelpers.internal(res);
    }
});

export default router;
