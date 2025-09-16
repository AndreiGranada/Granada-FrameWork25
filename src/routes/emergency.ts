import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
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
            try { await ensureActiveLimit(req.userId!); } catch { res.status(400).json({ error: 'Limite de 5 contatos ativos atingido' }); return; }
        }
        const created = await prisma.emergencyContact.create({
            data: { userId: req.userId!, name: data.name, phone: data.phone, priority: data.priority, isActive: data.isActive }
        });
        res.status(201).json(created);
    } catch (err: any) {
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        if (err.code === 'P2002') { res.status(409).json({ error: 'Telefone já cadastrado' }); return; }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// List contacts
router.get('/emergency-contacts', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.userId }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] });
        res.json(contacts);
    } catch (err) {
        console.error(err); res.status(500).json({ error: 'Erro interno' });
    }
});

// Update contact
router.patch('/emergency-contacts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = updateContactSchema.parse(req.body);
        const contact = await prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) { res.status(404).json({ error: 'Não encontrado' }); return; }

        if (data.isActive === true && !contact.isActive) {
            try { await ensureActiveLimit(req.userId!); } catch { res.status(400).json({ error: 'Limite de 5 contatos ativos atingido' }); return; }
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
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        if (err.code === 'P2002') { res.status(409).json({ error: 'Telefone já cadastrado' }); return; }
        console.error(err); res.status(500).json({ error: 'Erro interno' });
    }
});

// Delete contact
router.delete('/emergency-contacts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const contact = await prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) { res.status(404).json({ error: 'Não encontrado' }); return; }
        await prisma.emergencyContact.delete({ where: { id: contact.id } });
        res.status(204).send();
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

// SOS endpoint
router.post('/sos', sosLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.userId, isActive: true }, orderBy: [{ priority: 'asc' }], take: 5 });
        if (!contacts.length) { res.status(400).json({ error: 'Nenhum contato ativo cadastrado' }); return; }

        const base = message || 'S.O.S. Necessito de ajuda agora.';
        const notify = getNotificationProvider();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text: base }));
        const result = await notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    } catch (err: any) {
        if (err instanceof z.ZodError) { res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() }); return; }
        console.error(err); res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
