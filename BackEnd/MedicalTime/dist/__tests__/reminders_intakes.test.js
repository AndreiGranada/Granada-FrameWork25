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
const app_1 = require("../src/app");
const prisma_1 = require("../src/lib/prisma");
const app = (0, app_1.createApp)();
function auth() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const email = 'r@test.com';
        yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password: 'abcdef', name: 'R' });
        const login = yield (0, supertest_1.default)(app).post('/auth/login').send({ email, password: 'abcdef' });
        return { token: login.body.token, userId: (_a = login.body.user) === null || _a === void 0 ? void 0 : _a.id };
    });
}
describe('Reminders & Intakes', () => {
    it('create reminder with schedules, list, and mark intake taken (simulado)', () => __awaiter(void 0, void 0, void 0, function* () {
        const { token, userId } = yield auth();
        const createResp = yield (0, supertest_1.default)(app)
            .post('/reminders')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'Vitamina C',
            schedules: [
                { ingestionTimeMinutes: 480 }, // 08:00
            ]
        });
        expect(createResp.status).toBe(201);
        const reminderId = createResp.body.id;
        expect(reminderId).toBeDefined();
        // Invocar manualmente geração de eventos para teste (sem esperar job)
        // Criar intake diretamente para simular job
        const schedule = yield prisma_1.prisma.medicationSchedule.findFirstOrThrow({ where: { medicationReminderId: reminderId } });
        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // daqui 5 min
        const intake = yield prisma_1.prisma.intakeEvent.create({
            data: { userId, medicationReminderId: reminderId, medicationScheduleId: schedule.id, scheduledAt }
        });
        // Marcar taken
        const takenResp = yield (0, supertest_1.default)(app)
            .post(`/intakes/${intake.id}/taken`)
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(takenResp.status).toBe(200);
        expect(takenResp.body.status).toBe('TAKEN');
    }));
});
