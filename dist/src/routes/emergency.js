"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const notifications_1 = require("../services/notifications");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Schemas
const createContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().min(5).max(25),
    priority: zod_1.z.number().int().min(0).max(100).optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true)
});
const updateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    phone: zod_1.z.string().min(5).max(25).optional(),
    priority: zod_1.z.number().int().min(0).max(100).optional(),
    isActive: zod_1.z.boolean().optional()
});
const sosSchema = zod_1.z.object({
    message: zod_1.z.string().max(500).optional()
});
// Helpers
function ensureActiveLimit(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const count = yield prisma_1.prisma.emergencyContact.count({ where: { userId, isActive: true } });
        if (count >= 5) {
            throw new Error('LIMIT');
        }
    });
}
// Create contact
router.post('/emergency-contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = createContactSchema.parse(req.body);
        if (data.isActive) {
            try {
                yield ensureActiveLimit(req.userId);
            }
            catch (_a) {
                res.status(400).json({ error: 'Limite de 5 contatos ativos atingido' });
                return;
            }
        }
        const created = yield prisma_1.prisma.emergencyContact.create({
            data: { userId: req.userId, name: data.name, phone: data.phone, priority: data.priority, isActive: data.isActive }
        });
        res.status(201).json(created);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'Telefone já cadastrado' });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// List contacts
router.get('/emergency-contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contacts = yield prisma_1.prisma.emergencyContact.findMany({ where: { userId: req.userId }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] });
        res.json(contacts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Update contact
router.patch('/emergency-contacts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const data = updateContactSchema.parse(req.body);
        const contact = yield prisma_1.prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        if (data.isActive === true && !contact.isActive) {
            try {
                yield ensureActiveLimit(req.userId);
            }
            catch (_e) {
                res.status(400).json({ error: 'Limite de 5 contatos ativos atingido' });
                return;
            }
        }
        const updated = yield prisma_1.prisma.emergencyContact.update({
            where: { id: contact.id },
            data: {
                name: (_a = data.name) !== null && _a !== void 0 ? _a : contact.name,
                phone: (_b = data.phone) !== null && _b !== void 0 ? _b : contact.phone,
                priority: (_c = data.priority) !== null && _c !== void 0 ? _c : contact.priority,
                isActive: (_d = data.isActive) !== null && _d !== void 0 ? _d : contact.isActive
            }
        });
        res.json(updated);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'Telefone já cadastrado' });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Delete contact
router.delete('/emergency-contacts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contact = yield prisma_1.prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        yield prisma_1.prisma.emergencyContact.delete({ where: { id: contact.id } });
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// SOS endpoint
router.post('/sos', rateLimit_1.sosLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = yield prisma_1.prisma.emergencyContact.findMany({ where: { userId: req.userId, isActive: true }, orderBy: [{ priority: 'asc' }], take: 5 });
        if (!contacts.length) {
            res.status(400).json({ error: 'Nenhum contato ativo cadastrado' });
            return;
        }
        const base = message || 'S.O.S. Necessito de ajuda agora.';
        const notify = (0, notifications_1.getNotificationProvider)();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text: base }));
        const result = yield notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
exports.default = router;
