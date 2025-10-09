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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPendingAlarms = processPendingAlarms;
exports.startAlarmProcessor = startAlarmProcessor;
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
const logger_1 = require("../lib/logger");
const als_1 = require("../lib/als");
const notifications_1 = require("./notifications");
// Configurações (parametrizáveis via env)
const RETRY_INTERVAL_MIN = Number((_a = process.env.ALARM_RETRY_INTERVAL_MIN) !== null && _a !== void 0 ? _a : 15);
const MAX_ATTEMPTS = Number((_b = process.env.ALARM_MAX_ATTEMPTS) !== null && _b !== void 0 ? _b : 3);
const MARK_MISSED_AFTER_MIN = Number((_c = process.env.ALARM_MARK_MISSED_AFTER_MIN) !== null && _c !== void 0 ? _c : 45);
const SCAN_WINDOW_HOURS = Number((_d = process.env.ALARM_SCAN_WINDOW_HOURS) !== null && _d !== void 0 ? _d : 6);
function dispatchAlarm(eventId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notify = (0, notifications_1.getNotificationProvider)();
        yield notify.sendAlarm(userId, eventId);
    });
}
function processPendingAlarms() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const windowStart = new Date(now.getTime() - SCAN_WINDOW_HOURS * 60 * 60 * 1000);
        const pending = yield prisma_1.prisma.intakeEvent.findMany({
            where: {
                status: 'PENDING',
                scheduledAt: { gte: windowStart, lte: now }
            },
            select: { id: true, scheduledAt: true, attempts: true, userId: true },
            take: 500,
            orderBy: { scheduledAt: 'asc' }
        });
        let sent = 0;
        let missed = 0;
        for (const ev of pending) {
            const minutesSince = (0, date_fns_1.differenceInMinutes)(now, ev.scheduledAt);
            // Marcar MISSED se passou da janela
            if (minutesSince >= MARK_MISSED_AFTER_MIN || (ev.attempts >= MAX_ATTEMPTS && minutesSince >= RETRY_INTERVAL_MIN * (MAX_ATTEMPTS))) {
                try {
                    yield prisma_1.prisma.intakeEvent.update({
                        where: { id: ev.id },
                        data: { status: 'MISSED' }
                    });
                    missed++;
                }
                catch (e) {
                    // ignorar concorrência
                }
                continue;
            }
            // Decidir se precisa enviar novo alarme
            const nextThreshold = ev.attempts * RETRY_INTERVAL_MIN; // attempts 0 => 0; 1=>15;2=>30
            if (ev.attempts < MAX_ATTEMPTS && minutesSince >= nextThreshold) {
                try {
                    yield prisma_1.prisma.intakeEvent.update({
                        where: { id: ev.id },
                        data: { attempts: { increment: 1 } }
                    });
                    yield dispatchAlarm(ev.id, ev.userId);
                    sent++;
                }
                catch (e) {
                    // possivelmente outro processo já tratou
                }
            }
        }
        return { sent, missed };
    });
}
let running = false;
function startAlarmProcessor(intervalMs = 60 * 1000) {
    if (running)
        return;
    running = true;
    const loop = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { sent, missed } = yield processPendingAlarms();
            if (sent || missed) {
                logger_1.logger.info({ sent, missed, correlationId: (0, als_1.getCorrelationId)() }, '[alarmProcessor] resumo');
            }
        }
        catch (e) {
            console.error('[alarmProcessor] erro', e);
        }
        finally {
            setTimeout(loop, intervalMs);
        }
    });
    loop();
}
