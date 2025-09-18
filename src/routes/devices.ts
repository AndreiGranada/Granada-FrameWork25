import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { errorHelpers, mapZodError } from '../lib/errors';
import { Platform } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

const registerSchema = z.object({
    platform: z.enum(['ANDROID', 'IOS']),
    pushToken: z.string().min(10).max(400)
});

const updateSchema = z.object({
    isActive: z.boolean().optional(),
    pushToken: z.string().min(10).max(400).optional()
});

// Registrar / atualizar dispositivo
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = registerSchema.parse(req.body);

        const existing = await prisma.device.findUnique({ where: { pushToken: data.pushToken } });
        if (existing) {
            if (existing.userId !== req.userId) return errorHelpers.conflict(res, 'Token de push já associado a outro usuário');
            const updated = await prisma.device.update({
                where: { id: existing.id },
                data: { platform: data.platform as Platform, isActive: true, lastSeenAt: new Date() }
            });
            res.json(updated);
            return;
        }

        const created = await prisma.device.create({
            data: {
                userId: req.userId!,
                platform: data.platform as Platform,
                pushToken: data.pushToken,
                isActive: true,
                lastSeenAt: new Date()
            }
        });
        res.status(201).json(created);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        if (err.code === 'P2002') return errorHelpers.conflict(res, 'Token de push já usado');
        console.error(err); return errorHelpers.internal(res);
    }
});

// Listar dispositivos do usuário
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const list = await prisma.device.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
        res.json(list);
    } catch (err) { console.error(err); errorHelpers.internal(res); }
});

// Atualizar dispositivo
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateSchema.parse(req.body);
        const device = await prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) return errorHelpers.notFound(res, 'Dispositivo não encontrado');

        // Se pushToken novo já existe em outro device
        if (data.pushToken) {
            const exists = await prisma.device.findUnique({ where: { pushToken: data.pushToken } });
            if (exists && exists.id !== device.id) return errorHelpers.conflict(res, 'Token já em uso');
        }

        const updated = await prisma.device.update({
            where: { id: device.id },
            data: {
                pushToken: data.pushToken ?? device.pushToken,
                isActive: data.isActive ?? device.isActive,
                lastSeenAt: new Date()
            }
        });
        res.json(updated);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err); errorHelpers.internal(res);
    }
});

// Desativar (soft delete)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const device = await prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) return errorHelpers.notFound(res, 'Dispositivo não encontrado');
        await prisma.device.update({ where: { id: device.id }, data: { isActive: false } });
        res.status(204).send();
    } catch (err) { console.error(err); errorHelpers.internal(res); }
});

export default router;
