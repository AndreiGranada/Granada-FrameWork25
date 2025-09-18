import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { errorHelpers, mapZodError } from '../lib/errors';
import { sosLimiter } from '../middleware/rateLimit';
import { getNotificationProvider } from '../services/notifications';

const router = Router();
router.use(authMiddleware);

// Schemas
const createContactSchema = z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(5).max(25),
    priority: z.number().int().min(0).max(100).optional().default(0),
    isActive: z.boolean().optional().default(true)
});

const updateContactSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().min(5).max(25).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional()
});

const sosSchema = z.object({
    message: z.string().max(500).optional()
});

// Helpers
async function ensureActiveLimit(userId: string) {
    const count = await prisma.emergencyContact.count({ where: { userId, isActive: true } });
    if (count >= 5) {
        throw new Error('LIMIT');
    }
}

// Create contact
router.post('/emergency-contacts', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = createContactSchema.parse(req.body);
        if (data.isActive) {
            try { await ensureActiveLimit(req.userId!); } catch { return errorHelpers.badRequest(res, 'Limite de 5 contatos ativos atingido'); }
        }
        const created = await prisma.emergencyContact.create({
            data: { userId: req.userId!, name: data.name, phone: data.phone, priority: data.priority, isActive: data.isActive }
        });
        res.status(201).json(created);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        if (err.code === 'P2002') return errorHelpers.conflict(res, 'Telefone já cadastrado');
        console.error(err);
        errorHelpers.internal(res);
    }
});

// List contacts
router.get('/emergency-contacts', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.userId }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] });
        res.json(contacts);
    } catch (err) {
        console.error(err); errorHelpers.internal(res);
    }
});

// Update contact
router.patch('/emergency-contacts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateContactSchema.parse(req.body);
        const contact = await prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) return errorHelpers.notFound(res, 'Contato não encontrado');

        if (data.isActive === true && !contact.isActive) {
            try { await ensureActiveLimit(req.userId!); } catch { return errorHelpers.badRequest(res, 'Limite de 5 contatos ativos atingido'); }
        }

        const updated = await prisma.emergencyContact.update({
            where: { id: contact.id },
            data: {
                name: data.name ?? contact.name,
                phone: data.phone ?? contact.phone,
                priority: data.priority ?? contact.priority,
                isActive: data.isActive ?? contact.isActive
            }
        });
        res.json(updated);
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        if (err.code === 'P2002') return errorHelpers.conflict(res, 'Telefone já cadastrado');
        console.error(err); errorHelpers.internal(res);
    }
});

// Delete contact
router.delete('/emergency-contacts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const contact = await prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) return errorHelpers.notFound(res, 'Contato não encontrado');
        await prisma.emergencyContact.delete({ where: { id: contact.id } });
        res.status(204).send();
    } catch (err) { console.error(err); errorHelpers.internal(res); }
});

// SOS endpoint
router.post('/sos', sosLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.userId, isActive: true }, orderBy: [{ priority: 'asc' }], take: 5 });
        if (!contacts.length) return errorHelpers.badRequest(res, 'Nenhum contato ativo cadastrado');

        const base = message || 'S.O.S. Necessito de ajuda agora.';
        const notify = getNotificationProvider();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text: base }));
        const result = await notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    } catch (err: any) {
        if (err instanceof z.ZodError) return errorHelpers.badRequest(res, 'Falha de validação', mapZodError(err));
        console.error(err); errorHelpers.internal(res);
    }
});

export default router;
