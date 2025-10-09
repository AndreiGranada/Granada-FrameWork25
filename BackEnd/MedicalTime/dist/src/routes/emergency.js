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
const errors_1 = require("../lib/errors");
const rateLimit_1 = require("../middleware/rateLimit");
const notifications_1 = require("../services/notifications");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Schemas
const createContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    phone: zod_1.z.string().min(5).max(25),
    customMessage: zod_1.z.string().min(1).max(500).optional(),
    isActive: zod_1.z.boolean().optional().default(true)
});
const updateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    phone: zod_1.z.string().min(5).max(25).optional(),
    customMessage: zod_1.z.string().min(1).max(500).optional().nullable(),
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
                return errors_1.errorHelpers.badRequest(res, 'Limite de 5 contatos ativos atingido');
            }
        }
        const created = yield prisma_1.prisma.emergencyContact.create({
            data: { userId: req.userId, name: data.name, phone: data.phone, customMessage: data.customMessage, isActive: data.isActive },
            select: { id: true, name: true, phone: true, customMessage: true, isActive: true }
        });
        res.status(201).json(created);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        if (err.code === 'P2002')
            return errors_1.errorHelpers.conflict(res, 'Telefone já cadastrado');
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// List contacts
router.get('/emergency-contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contacts = yield prisma_1.prisma.emergencyContact.findMany({
            where: { userId: req.userId },
            orderBy: [{ createdAt: 'asc' }],
            select: { id: true, name: true, phone: true, customMessage: true, isActive: true }
        });
        res.json(contacts);
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Update contact
router.patch('/emergency-contacts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const data = updateContactSchema.parse(req.body);
        const contact = yield prisma_1.prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact)
            return errors_1.errorHelpers.notFound(res, 'Contato não encontrado');
        if (data.isActive === true && !contact.isActive) {
            try {
                yield ensureActiveLimit(req.userId);
            }
            catch (_d) {
                return errors_1.errorHelpers.badRequest(res, 'Limite de 5 contatos ativos atingido');
            }
        }
        const updated = yield prisma_1.prisma.emergencyContact.update({
            where: { id: contact.id },
            data: {
                name: (_a = data.name) !== null && _a !== void 0 ? _a : contact.name,
                phone: (_b = data.phone) !== null && _b !== void 0 ? _b : contact.phone,
                customMessage: data.customMessage === undefined ? contact.customMessage : data.customMessage || null,
                isActive: (_c = data.isActive) !== null && _c !== void 0 ? _c : contact.isActive
            },
            select: { id: true, name: true, phone: true, customMessage: true, isActive: true }
        });
        res.json(updated);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        if (err.code === 'P2002')
            return errors_1.errorHelpers.conflict(res, 'Telefone já cadastrado');
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Delete contact
router.delete('/emergency-contacts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contact = yield prisma_1.prisma.emergencyContact.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!contact)
            return errors_1.errorHelpers.notFound(res, 'Contato não encontrado');
        yield prisma_1.prisma.emergencyContact.delete({ where: { id: contact.id } });
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// SOS endpoint
router.post('/sos', rateLimit_1.sosLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = yield prisma_1.prisma.emergencyContact.findMany({
            where: { userId: req.userId, isActive: true },
            orderBy: [{ createdAt: 'asc' }],
            take: 5,
            // Retornar apenas os campos documentados/publicados
            select: { id: true, name: true, phone: true, customMessage: true, isActive: true }
        });
        if (!contacts.length)
            return errors_1.errorHelpers.badRequest(res, 'Nenhum contato ativo cadastrado');
        const globalBase = message || 'S.O.S. Necessito de ajuda agora.';
        const notify = (0, notifications_1.getNotificationProvider)();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text: c.customMessage || globalBase }));
        const result = yield notify.sendSosBulk(payload);
        res.json({ sent: result.sent, contacts });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
exports.default = router;
