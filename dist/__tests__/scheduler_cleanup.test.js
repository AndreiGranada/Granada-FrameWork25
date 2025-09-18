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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const prisma_1 = require("../src/lib/prisma");
const date_fns_1 = require("date-fns");
const intakeScheduler_1 = require("../src/services/intakeScheduler");
const cleanup_1 = require("../src/services/cleanup");
const app = index_1.default;
function registerAndLogin(email_1) {
    return __awaiter(this, arguments, void 0, function* (email, password = 'secret') {
        yield (0, supertest_1.default)(app).post('/auth/register').send({ name: 'Test', email, password });
        const login = yield (0, supertest_1.default)(app).post('/auth/login').send({ email, password });
        const token = login.body.token;
        const userId = login.body.user.id;
        return { token, userId };
    });
}
describe('Scheduler & Cleanup', () => {
    it('gera IntakeEvents para schedules ativos e não duplica', () => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, token } = yield registerAndLogin(`user${Date.now()}@t.com`);
        // cria reminder + schedule (08:00 todos os dias)
        const reminder = yield (0, supertest_1.default)(app)
            .post('/reminders')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Med A', schedules: [{ ingestionTimeMinutes: 480 }] })
            .expect(201);
        expect(reminder.body.id).toBeTruthy();
        const before = yield prisma_1.prisma.intakeEvent.count({ where: { userId } });
        const r1 = yield (0, intakeScheduler_1.generateUpcomingIntakeEvents)();
        const after1 = yield prisma_1.prisma.intakeEvent.count({ where: { userId } });
        const r2 = yield (0, intakeScheduler_1.generateUpcomingIntakeEvents)();
        const after2 = yield prisma_1.prisma.intakeEvent.count({ where: { userId } });
        expect(r1.created).toBeGreaterThan(0);
        expect(after1).toBeGreaterThan(before);
        // segunda chamada não deve criar duplicados
        expect(r2.created).toBe(0);
        expect(after2).toBe(after1);
    }));
    it('cleanup remove tokens expirados/usados e intakes antigos', () => __awaiter(void 0, void 0, void 0, function* () {
        const { userId } = yield registerAndLogin(`user${Date.now()}@t.com`);
        // Criar intake antigo (>90d)
        yield prisma_1.prisma.intakeEvent.create({
            data: {
                userId,
                medicationReminderId: (yield prisma_1.prisma.medicationReminder.create({
                    data: { userId, name: 'MedX' }
                })).id,
                scheduledAt: (0, date_fns_1.subDays)(new Date(), 91)
            }
        });
        // Criar password reset expirado e usado há > 1 dia
        yield prisma_1.prisma.passwordResetToken.createMany({
            data: [
                { userId, token: `t-${Date.now()}-exp`, expiresAt: (0, date_fns_1.subDays)(new Date(), 1) },
                { userId, token: `t-${Date.now()}-used`, expiresAt: (0, date_fns_1.addMinutes)(new Date(), 10), usedAt: (0, date_fns_1.subDays)(new Date(), 2) }
            ]
        });
        const res = yield (0, cleanup_1.runCleanup)();
        expect(res.removedIntakeEvents).toBeGreaterThanOrEqual(1);
        expect(res.removedResetTokens).toBeGreaterThanOrEqual(2);
    }));
});
