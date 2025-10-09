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
const intakeEventsSync_1 = require("../services/intakeEventsSync");
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
        yield (0, intakeEventsSync_1.resyncUpcomingEventsForReminder)(reminder.id);
        res.status(201).json(reminder);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Listar reminders do usuário
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reminders = yield prisma_1.prisma.medicationReminder.findMany({
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
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Obter reminder específico
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reminder = yield prisma_1.prisma.medicationReminder.findFirst({
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
        if (!reminder)
            return errors_1.errorHelpers.notFound(res, 'Reminder não encontrado');
        res.json(reminder);
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Atualizar reminder (metadados)
router.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const data = updateReminderSchema.parse(req.body);
        const r = yield prisma_1.prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r)
            return errors_1.errorHelpers.notFound(res, 'Reminder não encontrado');
        const toggledActive = typeof data.isActive !== 'undefined' && data.isActive !== r.isActive;
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
            yield (0, intakeEventsSync_1.resyncUpcomingEventsForReminder)(updated.id);
        }
        res.json(updated);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Adicionar schedule a um reminder
router.post('/:id/schedules', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const data = scheduleSchema.parse(req.body);
        const r = yield prisma_1.prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!r)
            return errors_1.errorHelpers.notFound(res, 'Reminder não encontrado');
        const createdSchedule = yield prisma_1.prisma.medicationSchedule.create({
            data: {
                medicationReminderId: r.id,
                ingestionTimeMinutes: data.ingestionTimeMinutes,
                daysOfWeekBitmask: (_a = data.daysOfWeekBitmask) !== null && _a !== void 0 ? _a : 0,
                isActive: (_b = data.isActive) !== null && _b !== void 0 ? _b : true
            },
            select: { id: true }
        });
        yield (0, intakeEventsSync_1.resyncUpcomingEventsForSchedule)(createdSchedule.id);
        const updatedReminder = yield prisma_1.prisma.medicationReminder.findUnique({
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
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
        if (!schedule)
            return errors_1.errorHelpers.notFound(res, 'Schedule não encontrado');
        yield prisma_1.prisma.medicationSchedule.update({
            where: { id: schedule.id },
            data: {
                ingestionTimeMinutes: (_a = data.ingestionTimeMinutes) !== null && _a !== void 0 ? _a : schedule.ingestionTimeMinutes,
                daysOfWeekBitmask: (_b = data.daysOfWeekBitmask) !== null && _b !== void 0 ? _b : schedule.daysOfWeekBitmask,
                isActive: (_c = data.isActive) !== null && _c !== void 0 ? _c : schedule.isActive
            }
        });
        yield (0, intakeEventsSync_1.resyncUpcomingEventsForSchedule)(schedule.id);
        const reminder = yield prisma_1.prisma.medicationReminder.findUnique({
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Remover schedule
router.delete('/schedules/:scheduleId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedule = yield prisma_1.prisma.medicationSchedule.findFirst({
            where: { id: req.params.scheduleId, medicationReminder: { userId: req.userId } }
        });
        if (!schedule)
            return errors_1.errorHelpers.notFound(res, 'Schedule não encontrado');
        yield prisma_1.prisma.medicationSchedule.delete({ where: { id: schedule.id } });
        yield (0, intakeEventsSync_1.resyncUpcomingEventsForSchedule)(schedule.id);
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Soft delete de reminder (desativar reminder e seus schedules)
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reminder = yield prisma_1.prisma.medicationReminder.findFirst({ where: { id: req.params.id, userId: req.userId } });
        if (!reminder)
            return errors_1.errorHelpers.notFound(res, 'Reminder não encontrado');
        if (!reminder.isActive) {
            // idempotente: já inativo -> 204
            res.status(204).send();
            return;
        }
        yield prisma_1.prisma.$transaction([
            prisma_1.prisma.medicationReminder.update({ where: { id: reminder.id }, data: { isActive: false } }),
            prisma_1.prisma.medicationSchedule.updateMany({ where: { medicationReminderId: reminder.id }, data: { isActive: false } })
        ]);
        yield (0, intakeEventsSync_1.resyncUpcomingEventsForReminder)(reminder.id);
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
exports.default = router;
