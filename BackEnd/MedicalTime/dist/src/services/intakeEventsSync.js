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
exports.resyncUpcomingEventsForReminder = resyncUpcomingEventsForReminder;
exports.resyncUpcomingEventsForSchedule = resyncUpcomingEventsForSchedule;
const prisma_1 = require("../lib/prisma");
const intakeScheduler_1 = require("./intakeScheduler");
function deleteUpcomingEvents(where) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const { count } = yield prisma_1.prisma.intakeEvent.deleteMany({
            where: Object.assign(Object.assign({}, where), { scheduledAt: { gte: now }, status: { not: 'TAKEN' } })
        });
        return count;
    });
}
function resyncUpcomingEventsForReminder(reminderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const reminder = yield prisma_1.prisma.medicationReminder.findUnique({
            where: { id: reminderId },
            select: { id: true, isActive: true }
        });
        if (!reminder)
            return { deleted: 0, created: 0 };
        const deleted = yield deleteUpcomingEvents({ medicationReminderId: reminder.id });
        if (!reminder.isActive)
            return { deleted, created: 0 };
        const { created } = yield (0, intakeScheduler_1.generateUpcomingEventsForReminder)(reminder.id);
        return { deleted, created };
    });
}
function resyncUpcomingEventsForSchedule(scheduleId) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleted = yield deleteUpcomingEvents({ medicationScheduleId: scheduleId });
        const schedule = yield prisma_1.prisma.medicationSchedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                isActive: true,
                medicationReminder: { select: { id: true, isActive: true } }
            }
        });
        if (!schedule || !schedule.isActive || !schedule.medicationReminder.isActive) {
            return { deleted, created: 0 };
        }
        const { created } = yield (0, intakeScheduler_1.generateUpcomingEventsForSchedule)(schedule.id);
        return { deleted, created };
    });
}
