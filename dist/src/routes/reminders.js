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
// Esquemas de validação
const scheduleSchema = zod_1.z.object({
    ingestionTimeMinutes: zod_1.z.number().int().min(0).max(1439),
    daysOfWeekBitmask: zod_1.z.number().int().min(0).max(127).optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true)
});
const createReminderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    purpose: zod_1.z.string().max(255).optional(),
    description: zod_1.z.string().optional(),
    pricePaid: zod_1.z.string().optional(), // Decimal como string
    photoUrl: zod_1.z.string().url().optional(),
    schedules: zod_1.z.array(scheduleSchema).min(1)
});
const updateReminderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    purpose: zod_1.z.string().max(255).optional(),
    description: zod_1.z.string().optional(),
    pricePaid: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().optional()
});
const updateScheduleSchema = zod_1.z.object({
    ingestionTimeMinutes: zod_1.z.number().int().min(0).max(1439).optional(),
    daysOfWeekBitmask: zod_1.z.number().int().min(0).max(127).optional(),
    isActive: zod_1.z.boolean().optional()
});
// Middleware de auth aplicado a todas as rotas abaixo
router.use(auth_1.authMiddleware);
// Criar reminder + schedules
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = createReminderSchema.parse(req.body);
        const reminder = yield prisma_1.prisma.medicationReminder.create({
            data: {
                userId: req.userId,
                name: data.name,
                purpose: data.purpose,
                description: data.description,
                pricePaid: data.pricePaid ? data.pricePaid : undefined,
                photoUrl: data.photoUrl,
                schedules: {
                    create: data.schedules.map(s => {
                        var _a, _b;
                        return ({
                            ingestionTimeMinutes: s.ingestionTimeMinutes,
                            daysOfWeekBitmask: (_a = s.daysOfWeekBitmask) !== null && _a !== void 0 ? _a : 0,
                            isActive: (_b = s.isActive) !== null && _b !== void 0 ? _b : true
                        });
                    })
                }
            },
            include: { schedules: true }
        });
        res.status(201).json(reminder);
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
// Listar reminders do usuário
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reminders = yield prisma_1.prisma.medicationReminder.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: { schedules: true }
        });
        res.json(reminders);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Obter reminder específico
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reminder = yield prisma_1.prisma.medicationReminder.findFirst({
            where: { id: req.params.id, userId: req.userId },
            include: { schedules: true }
        });
        if (!reminder) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        res.json(reminder);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Atualizar reminder (metadados)
router.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const data = updateReminderSchema.parse(req.body);
        const r = yield prisma_1.prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        const updated = yield prisma_1.prisma.medicationReminder.update({
            where: { id: r.id },
            data: {
                name: (_a = data.name) !== null && _a !== void 0 ? _a : r.name,
                purpose: (_b = data.purpose) !== null && _b !== void 0 ? _b : r.purpose,
                description: (_c = data.description) !== null && _c !== void 0 ? _c : r.description,
                pricePaid: (_d = data.pricePaid) !== null && _d !== void 0 ? _d : r.pricePaid,
                photoUrl: (_e = data.photoUrl) !== null && _e !== void 0 ? _e : r.photoUrl,
                isActive: (_f = data.isActive) !== null && _f !== void 0 ? _f : r.isActive
            },
            include: { schedules: true }
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
// Adicionar schedule a um reminder
router.post('/:id/schedules', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const data = scheduleSchema.parse(req.body);
        const r = yield prisma_1.prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        const schedule = yield prisma_1.prisma.medicationSchedule.create({
            data: {
                medicationReminderId: r.id,
                ingestionTimeMinutes: data.ingestionTimeMinutes,
                daysOfWeekBitmask: (_a = data.daysOfWeekBitmask) !== null && _a !== void 0 ? _a : 0,
                isActive: (_b = data.isActive) !== null && _b !== void 0 ? _b : true
            }
        });
        res.status(201).json(schedule);
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
// Editar schedule
router.patch('/schedules/:scheduleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const data = updateScheduleSchema.parse(req.body);
        const schedule = yield prisma_1.prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        const updated = yield prisma_1.prisma.medicationSchedule.update({
            where: { id: schedule.id },
            data: {
                ingestionTimeMinutes: (_a = data.ingestionTimeMinutes) !== null && _a !== void 0 ? _a : schedule.ingestionTimeMinutes,
                daysOfWeekBitmask: (_b = data.daysOfWeekBitmask) !== null && _b !== void 0 ? _b : schedule.daysOfWeekBitmask,
                isActive: (_c = data.isActive) !== null && _c !== void 0 ? _c : schedule.isActive
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
// Remover schedule
router.delete('/schedules/:scheduleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedule = yield prisma_1.prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        yield prisma_1.prisma.medicationSchedule.delete({ where: { id: schedule.id } });
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
exports.default = router;
