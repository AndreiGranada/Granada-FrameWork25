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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../lib/errors");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
const GRACE_PERIOD_MINUTES = Number((_a = process.env.INTAKE_GRACE_PERIOD_MIN) !== null && _a !== void 0 ? _a : 15);
const GRACE_PERIOD_MS = GRACE_PERIOD_MINUTES * 60 * 1000;
// Query schemas
const listSchema = zod_1.z.object({
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    hours: zod_1.z.string().regex(/^\d+$/).optional(),
    status: zod_1.z.enum(['PENDING', 'TAKEN', 'MISSED']).optional()
});
// GET /intakes => lista eventos no intervalo
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = listSchema.parse(req.query);
        const now = new Date();
        const from = parsed.from ? new Date(parsed.from) : now;
        let to;
        if (parsed.to) {
            to = new Date(parsed.to);
        }
        else if (parsed.hours) {
            to = (0, date_fns_1.addHours)(from, Number(parsed.hours));
        }
        else {
            to = (0, date_fns_1.addHours)(from, 24); // default
        }
        const where = {
            userId: req.userId,
            scheduledAt: { gte: from, lte: to }
        };
        if (parsed.status)
            where.status = parsed.status;
        const eventsRaw = yield prisma_1.prisma.intakeEvent.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        const events = eventsRaw.map(e => ({
            id: e.id,
            medicationReminderId: e.medicationReminderId,
            medicationScheduleId: e.medicationScheduleId,
            scheduledAt: e.scheduledAt,
            status: e.status,
            attempts: e.attempts,
            takenAt: e.takenAt,
            graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
            reminder: e.medicationReminder ? {
                id: e.medicationReminder.id,
                name: e.medicationReminder.name,
                photoUrl: e.medicationReminder.photoUrl
            } : undefined,
            schedule: e.medicationSchedule ? {
                id: e.medicationSchedule.id,
                ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes
            } : null
        }));
        res.json(events);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Parâmetros inválidos', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// GET /intakes/history
// Modos:
//  - Legacy: ?days=7 (retorna array simples)
//  - Paginado (novo): ?limit=50&cursor=<scheduledAt_iso> (retorna envelope { data, pageInfo }) ordenado desc por scheduledAt
const historySchema = zod_1.z.object({
    days: zod_1.z.string().regex(/^[\d]+$/).optional(),
    limit: zod_1.z.string().regex(/^[\d]+$/).optional(),
    cursor: zod_1.z.string().datetime().optional()
});
router.get('/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { days, limit, cursor } = historySchema.parse(req.query);
        // Se limit for enviado => modo paginado
        if (limit) {
            const take = Math.min(Number(limit), 200) + 1; // pegar 1 extra para saber se há next
            const where = { userId: req.userId };
            if (cursor) {
                // scheduledAt < cursor (ordenado desc)
                where.scheduledAt = { lt: new Date(cursor) };
            }
            const eventsRaw = yield prisma_1.prisma.intakeEvent.findMany({
                where,
                orderBy: { scheduledAt: 'desc' },
                take,
                include: {
                    medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                    medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
                }
            });
            const hasMore = eventsRaw.length === take;
            const slice = hasMore ? eventsRaw.slice(0, -1) : eventsRaw;
            const mapped = slice.map(e => ({
                id: e.id,
                medicationReminderId: e.medicationReminderId,
                medicationScheduleId: e.medicationScheduleId,
                scheduledAt: e.scheduledAt,
                status: e.status,
                attempts: e.attempts,
                takenAt: e.takenAt,
                graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
                reminder: e.medicationReminder ? { id: e.medicationReminder.id, name: e.medicationReminder.name, photoUrl: e.medicationReminder.photoUrl } : undefined,
                schedule: e.medicationSchedule ? { id: e.medicationSchedule.id, ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes } : null
            }));
            res.json({ data: mapped, pageInfo: { hasMore, nextCursor: hasMore ? mapped[mapped.length - 1].scheduledAt : null } });
            return;
        }
        // Legacy array simples baseado em days
        const d = Math.min(days ? Number(days) : 7, 90);
        const to = new Date();
        const from = new Date(to.getTime() - d * 24 * 60 * 60 * 1000);
        const eventsRaw = yield prisma_1.prisma.intakeEvent.findMany({
            where: { userId: req.userId, scheduledAt: { gte: from, lte: to } },
            orderBy: { scheduledAt: 'desc' },
            take: 500,
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        const events = eventsRaw.map(e => ({
            id: e.id,
            medicationReminderId: e.medicationReminderId,
            medicationScheduleId: e.medicationScheduleId,
            scheduledAt: e.scheduledAt,
            status: e.status,
            attempts: e.attempts,
            takenAt: e.takenAt,
            graceEndsAt: new Date(e.scheduledAt.getTime() + GRACE_PERIOD_MS),
            reminder: e.medicationReminder ? { id: e.medicationReminder.id, name: e.medicationReminder.name, photoUrl: e.medicationReminder.photoUrl } : undefined,
            schedule: e.medicationSchedule ? { id: e.medicationSchedule.id, ingestionTimeMinutes: e.medicationSchedule.ingestionTimeMinutes } : null
        }));
        res.json(events);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Parâmetros inválidos', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
// Marcar evento como tomado
router.post('/:id/taken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield prisma_1.prisma.intakeEvent.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!event)
            return errors_1.errorHelpers.notFound(res, 'Evento não encontrado');
        if (event.status === 'TAKEN')
            return errors_1.errorHelpers.conflict(res, 'Já marcado como tomado');
        if (event.status === 'MISSED')
            return errors_1.errorHelpers.conflict(res, 'Evento perdido, não pode ser tomado');
        const updated = yield prisma_1.prisma.intakeEvent.update({
            where: { id: event.id },
            data: { status: 'TAKEN', takenAt: new Date() },
            select: {
                id: true,
                medicationReminderId: true,
                medicationScheduleId: true,
                scheduledAt: true,
                status: true,
                attempts: true,
                takenAt: true
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
exports.default = router;
