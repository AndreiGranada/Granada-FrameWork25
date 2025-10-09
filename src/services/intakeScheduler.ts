import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getCorrelationId } from '../lib/als';

// Gera eventos para próximas 24h.
// Estratégia simples: para cada schedule ativo gerar 1 ocorrência por dia futuro que ainda não exista.
// Evita duplicar usando busca por (userId, scheduleId, scheduledAt) - podemos conferir existência.

const WEEKDAY_BITMASK = [1, 2, 4, 8, 16, 32, 64] as const;

type ScheduleWithReminder = Prisma.MedicationScheduleGetPayload<{
    include: { medicationReminder: { select: { userId: true } } };
}>;

async function resolveTimezone(userId: string, cache: Map<string, string>) {
    if (cache.has(userId)) return cache.get(userId)!;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
    const tz = user?.timezone || 'America/Sao_Paulo';
    cache.set(userId, tz);
    return tz;
}

async function generateEventsForSchedules(schedules: ScheduleWithReminder[], now: Date, horizon: Date) {
    let created = 0;
    const timezoneCache = new Map<string, string>();

    for (const schedule of schedules) {
        const userId = schedule.medicationReminder.userId;
        const tz = await resolveTimezone(userId, timezoneCache);
        const localNow = toZonedTime(now, tz);

        for (let d = 0; d <= 1; d++) {
            const baseDay = addDays(localNow, d);
            const localCandidate = new Date(baseDay);
            localCandidate.setHours(0, 0, 0, 0);
            const minutes = schedule.ingestionTimeMinutes;
            localCandidate.setMinutes(minutes % 60, 0, 0);
            localCandidate.setHours(Math.floor(minutes / 60));

            const weekday = localCandidate.getDay();
            const bit = WEEKDAY_BITMASK[weekday];
            if (schedule.daysOfWeekBitmask !== 0 && (schedule.daysOfWeekBitmask & bit) === 0) {
                continue;
            }

            if (d === 0 && localCandidate < localNow) continue;

            const scheduledAtUtc = fromZonedTime(localCandidate, tz);
            if (scheduledAtUtc > horizon) continue;

            const existing = await prisma.intakeEvent.findFirst({
                where: {
                    userId,
                    medicationScheduleId: schedule.id,
                    scheduledAt: scheduledAtUtc
                }
            });
            if (existing) continue;

            try {
                await prisma.intakeEvent.create({
                    data: {
                        userId,
                        medicationReminderId: schedule.medicationReminderId,
                        medicationScheduleId: schedule.id,
                        scheduledAt: scheduledAtUtc
                    }
                });
                created++;
            } catch (e: any) {
                if (e?.code !== 'P2002') throw e;
            }
        }
    }

    return created;
}

export async function generateUpcomingIntakeEvents(): Promise<{ created: number }> {
    const now = new Date();
    const horizon = addDays(now, 1);

    const schedules = await prisma.medicationSchedule.findMany({
        where: {
            isActive: true,
            medicationReminder: { isActive: true }
        },
        include: { medicationReminder: { select: { userId: true } } }
    });

    const created = await generateEventsForSchedules(schedules, now, horizon);
    return { created };
}

export async function generateUpcomingEventsForReminder(reminderId: string): Promise<{ created: number }> {
    const now = new Date();
    const horizon = addDays(now, 1);

    const schedules = await prisma.medicationSchedule.findMany({
        where: {
            medicationReminderId: reminderId,
            isActive: true,
            medicationReminder: { isActive: true }
        },
        include: { medicationReminder: { select: { userId: true } } }
    });

    const created = await generateEventsForSchedules(schedules, now, horizon);
    return { created };
}

export async function generateUpcomingEventsForSchedule(scheduleId: string): Promise<{ created: number }> {
    const now = new Date();
    const horizon = addDays(now, 1);

    const schedule = await prisma.medicationSchedule.findFirst({
        where: {
            id: scheduleId,
            isActive: true,
            medicationReminder: { isActive: true }
        },
        include: { medicationReminder: { select: { userId: true } } }
    });

    if (!schedule) return { created: 0 };

    const created = await generateEventsForSchedules([schedule], now, horizon);
    return { created };
}

let running = false;
export function startIntakeScheduler(intervalMs = 5 * 60 * 1000) { // a cada 5 min
    if (running) return;
    running = true;
    const tick = async () => {
        try {
            const { created } = await generateUpcomingIntakeEvents();
            if (created > 0) {
                logger.info({ created, correlationId: getCorrelationId() }, '[intakeScheduler] eventos novos');
            }
        } catch (e) {
            console.error('[intakeScheduler] Erro:', e);
        } finally {
            setTimeout(tick, intervalMs);
        }
    };
    tick();
}
