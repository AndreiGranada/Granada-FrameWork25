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
exports.generateUpcomingIntakeEvents = generateUpcomingIntakeEvents;
exports.startIntakeScheduler = startIntakeScheduler;
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
const logger_1 = require("../lib/logger");
const als_1 = require("../lib/als");
const date_fns_tz_1 = require("date-fns-tz");
// Gera eventos para próximas 24h.
// Estratégia simples: para cada schedule ativo gerar 1 ocorrência por dia futuro que ainda não exista.
// Evita duplicar usando busca por (userId, scheduleId, scheduledAt) - podemos conferir existência.
function generateUpcomingIntakeEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const horizon = (0, date_fns_1.addDays)(now, 1); // 24h
        // Buscar schedules ativos com reminder ativo
        const schedules = yield prisma_1.prisma.medicationSchedule.findMany({
            where: {
                isActive: true,
                medicationReminder: { isActive: true }
            },
            include: { medicationReminder: { select: { userId: true }, }, }
        });
        let created = 0;
        for (const schedule of schedules) {
            const userId = schedule.medicationReminder.userId;
            // Obter timezone do usuário
            const user = yield prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
            const tz = (user === null || user === void 0 ? void 0 : user.timezone) || 'America/Sao_Paulo';
            // Percorrer cada minuto alvo (apenas um por dia no horizonte)
            // Calcular próximo horário local >= now até horizon.
            const localNow = (0, date_fns_tz_1.toZonedTime)(now, tz);
            // Converter ingestionTimeMinutes para próximo Date local de hoje/amanhã
            for (let d = 0; d <= 1; d++) {
                const baseDay = (0, date_fns_1.addDays)(localNow, d);
                const localCandidate = new Date(baseDay);
                localCandidate.setHours(0, 0, 0, 0);
                const minutes = schedule.ingestionTimeMinutes;
                localCandidate.setMinutes(minutes % 60, 0, 0);
                localCandidate.setHours(Math.floor(minutes / 60));
                // Filtrar por bitmask de dias
                const weekday = localCandidate.getDay(); // 0=Dom
                const bit = [1, 2, 4, 8, 16, 32, 64][weekday];
                if (schedule.daysOfWeekBitmask !== 0 && (schedule.daysOfWeekBitmask & bit) === 0) {
                    continue;
                }
                // Se horário já passou e d==0, pular
                if (d === 0 && localCandidate < localNow)
                    continue;
                const scheduledAtUtc = (0, date_fns_tz_1.fromZonedTime)(localCandidate, tz);
                if (scheduledAtUtc > horizon)
                    continue;
                // Verificar se já existe evento para esse schedule + horário (aprox mesma hora)
                const existing = yield prisma_1.prisma.intakeEvent.findFirst({
                    where: {
                        userId,
                        medicationScheduleId: schedule.id,
                        scheduledAt: scheduledAtUtc
                    }
                });
                if (existing)
                    continue;
                try {
                    yield prisma_1.prisma.intakeEvent.create({
                        data: {
                            userId,
                            medicationReminderId: schedule.medicationReminderId,
                            medicationScheduleId: schedule.id,
                            scheduledAt: scheduledAtUtc
                        }
                    });
                    created++;
                }
                catch (e) {
                    // Em caso de corrida, a restrição única pode falhar; ignorar duplicata
                    if ((e === null || e === void 0 ? void 0 : e.code) !== 'P2002')
                        throw e;
                }
            }
        }
        return { created };
    });
}
let running = false;
function startIntakeScheduler(intervalMs = 5 * 60 * 1000) {
    if (running)
        return;
    running = true;
    const tick = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { created } = yield generateUpcomingIntakeEvents();
            if (created > 0) {
                logger_1.logger.info({ created, correlationId: (0, als_1.getCorrelationId)() }, '[intakeScheduler] eventos novos');
            }
        }
        catch (e) {
            console.error('[intakeScheduler] Erro:', e);
        }
        finally {
            setTimeout(tick, intervalMs);
        }
    });
    tick();
}
