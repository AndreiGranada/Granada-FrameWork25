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
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
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
        const events = yield prisma_1.prisma.intakeEvent.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                medicationReminder: { select: { id: true, name: true, photoUrl: true } },
                medicationSchedule: { select: { id: true, ingestionTimeMinutes: true } }
            }
        });
        res.json(events);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Parâmetros inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// GET /intakes/history?days=7 => histórico passado (limite 90)
const historySchema = zod_1.z.object({ days: zod_1.z.string().regex(/^\d+$/).optional() });
router.get('/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { days } = historySchema.parse(req.query);
        const d = Math.min(days ? Number(days) : 7, 90);
        const to = new Date();
        const from = new Date(to.getTime() - d * 24 * 60 * 60 * 1000);
        const events = yield prisma_1.prisma.intakeEvent.findMany({
            where: { userId: req.userId, scheduledAt: { gte: from, lte: to } },
            orderBy: { scheduledAt: 'desc' },
            take: 500
        });
        res.json(events);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Parâmetros inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Marcar evento como tomado
router.post('/:id/taken', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield prisma_1.prisma.intakeEvent.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!event) {
            res.status(404).json({ error: 'Não encontrado' });
            return;
        }
        if (event.status === 'TAKEN') {
            res.status(409).json({ error: 'Já marcado como tomado' });
            return;
        }
        if (event.status === 'MISSED') {
            res.status(409).json({ error: 'Evento perdido, não pode ser tomado' });
            return;
        }
        const updated = yield prisma_1.prisma.intakeEvent.update({
            where: { id: event.id },
            data: { status: 'TAKEN', takenAt: new Date() }
        });
        res.json(updated);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
exports.default = router;
