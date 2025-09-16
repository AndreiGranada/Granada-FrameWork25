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
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
const registerSchema = zod_1.z.object({
    platform: zod_1.z.enum(['ANDROID', 'IOS', 'WEB']),
    pushToken: zod_1.z.string().min(10).max(400)
});
const updateSchema = zod_1.z.object({
    isActive: zod_1.z.boolean().optional(),
    pushToken: zod_1.z.string().min(10).max(400).optional()
});
// Registrar / atualizar dispositivo
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = registerSchema.parse(req.body);
        const existing = yield prisma_1.prisma.device.findUnique({ where: { pushToken: data.pushToken } });
        if (existing) {
            if (existing.userId !== req.userId) {
                res.status(409).json({ error: 'Token de push já associado a outro usuário' });
                return;
            }
            const updated = yield prisma_1.prisma.device.update({
                where: { id: existing.id },
                data: { platform: data.platform, isActive: true, lastSeenAt: new Date() }
            });
            res.json(updated);
            return;
        }
        const created = yield prisma_1.prisma.device.create({
            data: {
                userId: req.userId,
                platform: data.platform,
                pushToken: data.pushToken,
                isActive: true,
                lastSeenAt: new Date()
            }
        });
        res.status(201).json(created);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'Token de push já usado' });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Listar dispositivos do usuário
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const list = yield prisma_1.prisma.device.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
        res.json(list);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Atualizar dispositivo
router.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const data = updateSchema.parse(req.body);
        const device = yield prisma_1.prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        // Se pushToken novo já existe em outro device
        if (data.pushToken) {
            const exists = yield prisma_1.prisma.device.findUnique({ where: { pushToken: data.pushToken } });
            if (exists && exists.id !== device.id) {
                res.status(409).json({ error: 'Token já em uso' });
                return;
            }
        }
        const updated = yield prisma_1.prisma.device.update({
            where: { id: device.id },
            data: {
                pushToken: (_a = data.pushToken) !== null && _a !== void 0 ? _a : device.pushToken,
                isActive: (_b = data.isActive) !== null && _b !== void 0 ? _b : device.isActive,
                lastSeenAt: new Date()
            }
        });
        res.json(updated);
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
// Desativar (soft delete)
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield prisma_1.prisma.device.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!device) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        yield prisma_1.prisma.device.update({ where: { id: device.id }, data: { isActive: false } });
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
exports.default = router;
