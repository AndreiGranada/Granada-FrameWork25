import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
    schedules: z.array(scheduleSchema).min(1)
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
            include: { schedules: true }
        });
        res.status(201).json(reminder);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Listar reminders do usuário
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminders = await prisma.medicationReminder.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: { schedules: true }
        });
        res.json(reminders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Obter reminder específico
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminder = await prisma.medicationReminder.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: { schedules: true }
        });
        if (!reminder) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        res.json(reminder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Atualizar reminder (metadados)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateReminderSchema.parse(req.body);
        const r = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
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
            include: { schedules: true }
        });
        res.json(updated);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Adicionar schedule a um reminder
router.post('/:id/schedules', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = scheduleSchema.parse(req.body);
        const r = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        const schedule = await prisma.medicationSchedule.create({
            data: {
                medicationReminderId: r.id,
                ingestionTimeMinutes: data.ingestionTimeMinutes,
                daysOfWeekBitmask: data.daysOfWeekBitmask ?? 0,
                isActive: data.isActive ?? true
            }
        });
        res.status(201).json(schedule);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Editar schedule
router.patch('/schedules/:scheduleId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateScheduleSchema.parse(req.body);
        const schedule = await prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        const updated = await prisma.medicationSchedule.update({
            where: { id: schedule.id },
            data: {
                ingestionTimeMinutes: data.ingestionTimeMinutes ?? schedule.ingestionTimeMinutes,
                daysOfWeekBitmask: data.daysOfWeekBitmask ?? schedule.daysOfWeekBitmask,
                isActive: data.isActive ?? schedule.isActive
            }
        });
        res.json(updated);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Remover schedule
router.delete('/schedules/:scheduleId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const schedule = await prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        await prisma.medicationSchedule.delete({ where: { id: schedule.id } });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// Soft delete de reminder (desativar reminder e seus schedules)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reminder = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!reminder) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        if (!reminder.isActive) {
            // idempotente: já inativo -> 204
            res.status(204).send();
            return;
        }
        await prisma.$transaction([
            prisma.medicationReminder.update({ where: { id: reminder.id }, data: { isActive: false } }),
            prisma.medicationSchedule.updateMany({ where: { medicationReminderId: reminder.id }, data: { isActive: false } })
        ]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
