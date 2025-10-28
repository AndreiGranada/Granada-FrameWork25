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
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const notifications_1 = require("../services/notifications");
const errors_1 = require("../lib/errors");
const mail_1 = require("../services/mail");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
const sosSchema = zod_1.z.object({
    message: zod_1.z.string().max(500).optional()
});
const alarmSchema = zod_1.z.object({
    intakeEventId: zod_1.z.string().uuid().optional()
});
const mailSchema = zod_1.z.object({
    to: zod_1.z.string().email(),
    subject: zod_1.z.string().min(1).max(200).default('Teste de e-mail - MedicalTime'),
    text: zod_1.z.string().max(4000).optional(),
    html: zod_1.z.string().max(10000).optional()
}).refine((d) => d.text || d.html, { message: 'Forneça text ou html', path: ['text'] });
// Dispara SOS utilizando os contatos ativos do usuário (dev only)
router.post('/test-sos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = sosSchema.parse(req.body);
        const contacts = yield prisma_1.prisma.emergencyContact.findMany({
            where: { userId: req.userId, isActive: true },
            orderBy: [{ createdAt: 'asc' }],
            take: 5
        });
        if (!contacts.length)
            return errors_1.errorHelpers.badRequest(res, 'Nenhum contato ativo cadastrado');
        const text = message || 'S.O.S. (teste)';
        const notify = (0, notifications_1.getNotificationProvider)();
        const payload = contacts.map(c => ({ to: c.phone, name: c.name, text }));
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
// Dispara um alarme de ingestão (dev only)
router.post('/test-alarm', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { intakeEventId } = alarmSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
        let targetId = intakeEventId;
        if (!targetId) {
            const pending = yield prisma_1.prisma.intakeEvent.findFirst({
                where: { userId: req.userId, status: 'PENDING' },
                orderBy: { scheduledAt: 'asc' }
            });
            if (!pending)
                return errors_1.errorHelpers.badRequest(res, 'Nenhum IntakeEvent PENDING encontrado para o usuário. Informe intakeEventId.');
            targetId = pending.id;
        }
        const notify = (0, notifications_1.getNotificationProvider)();
        yield notify.sendAlarm(req.userId, targetId);
        res.json({ ok: true, intakeEventId: targetId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error(err);
        errors_1.errorHelpers.internal(res);
    }
}));
exports.default = router;
// Envia e-mail de teste via Mailtrap (dev only)
router.post('/test-mail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = mailSchema.parse(req.body);
        const info = yield (0, mail_1.sendEmail)({
            to: data.to,
            subject: data.subject,
            text: data.text,
            html: data.html
        });
        res.json({ ok: true, messageId: info === null || info === void 0 ? void 0 : info.messageId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(err));
        console.error('[DEV /test-mail] Erro:', err);
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev && (err === null || err === void 0 ? void 0 : err.message))
            return errors_1.errorHelpers.internal(res, `Erro interno: ${err.message}`);
        errors_1.errorHelpers.internal(res);
    }
}));
