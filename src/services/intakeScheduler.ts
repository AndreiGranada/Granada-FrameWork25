import { prisma } from '../lib/prisma';
import { startOfMinute, addMinutes, addDays } from 'date-fns';
import { logger } from '../lib/logger';

// Substituindo import nomeado por require para contornar tipos faltantes
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tzLib: any = require('date-fns-tz');
const toZonedTime = tzLib.toZonedTime || tzLib.utcToZonedTime;
const zonedTimeToUtc = tzLib.zonedTimeToUtc;

// Gera eventos para próximas 24h.
// Estratégia simples: para cada schedule ativo gerar 1 ocorrência por dia futuro que ainda não exista.
// Evita duplicar usando busca por (userId, scheduleId, scheduledAt) - podemos conferir existência.

export async function generateUpcomingIntakeEvents(): Promise<{ created: number }> {
    const now = new Date();
    const horizon = addDays(now, 1); // 24h

    // Buscar schedules ativos com reminder ativo
    const schedules = await prisma.medicationSchedule.findMany({
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
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
        const tz = user?.timezone || 'America/Sao_Paulo';

        // Percorrer cada minuto alvo (apenas um por dia no horizonte)
        // Calcular próximo horário local >= now até horizon.
        const localNow = toZonedTime(now, tz);

        // Converter ingestionTimeMinutes para próximo Date local de hoje/amanhã
        for (let d = 0; d <= 1; d++) {
            const baseDay = addDays(localNow, d);
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
            if (d === 0 && localCandidate < localNow) continue;

            const scheduledAtUtc = zonedTimeToUtc(localCandidate, tz);
            if (scheduledAtUtc > horizon) continue;

            // Verificar se já existe evento para esse schedule + horário (aprox mesma hora)
            const existing = await prisma.intakeEvent.findFirst({
                where: {
                    userId,
                    medicationScheduleId: schedule.id,
                    scheduledAt: scheduledAtUtc
                }
            });
            if (existing) continue;

            await prisma.intakeEvent.create({
                data: {
                    userId,
                    medicationReminderId: schedule.medicationReminderId,
                    medicationScheduleId: schedule.id,
                    scheduledAt: scheduledAtUtc
                }
            });
            created++;
        }
    }

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
                logger.info({ created }, '[intakeScheduler] eventos novos');
            }
        } catch (e) {
            console.error('[intakeScheduler] Erro:', e);
        } finally {
            setTimeout(tick, intervalMs);
        }
    };
    tick();
}
