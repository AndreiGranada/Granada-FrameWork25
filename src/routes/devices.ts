import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Platform } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

const registerSchema = z.object({
    platform: z.enum(['ANDROID', 'IOS', 'WEB']),
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
            if (existing.userId !== req.userId) {
                res.status(409).json({ error: 'Token de push já associado a outro usuário' });
                return;
            }
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
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        if (err.code === 'P2002') { res.status(409).json({ error: 'Token de push já usado' }); return; }
        console.error(err); res.status(500).json({ error: 'Erro interno' });
    }
});

// Listar dispositivos do usuário
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const list = await prisma.device.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
        res.json(list);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

// Atualizar dispositivo
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateSchema.parse(req.body);
        const device = await prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) { res.status(404).json({ error: 'Não encontrado' }); return; }

        // Se pushToken novo já existe em outro device
        if (data.pushToken) {
            const exists = await prisma.device.findUnique({ where: { pushToken: data.pushToken } });
            if (exists && exists.id !== device.id) {
                res.status(409).json({ error: 'Token já em uso' });
                return;
            }
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
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        console.error(err); res.status(500).json({ error: 'Erro interno' });
    }
});

// Desativar (soft delete)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const device = await prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) { res.status(404).json({ error: 'Não encontrado' }); return; }
        await prisma.device.update({ where: { id: device.id }, data: { isActive: false } });
        res.status(204).send();
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

export default router;
