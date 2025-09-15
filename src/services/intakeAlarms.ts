import { prisma } from '../lib/prisma';
import { differenceInMinutes } from 'date-fns';
import { logger } from '../lib/logger';

// Configurações (podem ir para env futuramente)
const RETRY_INTERVAL_MIN = 15;          // intervalo entre alarmes
const MAX_ATTEMPTS = 3;                 // total de disparos (1 inicial + 2 retries)
const MARK_MISSED_AFTER_MIN = 45;       // após 45 min do horário se ainda PENDING -> MISSED
const SCAN_WINDOW_HOURS = 6;            // não processar eventos muito antigos

async function dispatchAlarm(eventId: string) {
    // Placeholder: aqui integrar push notification / local notification / fila
    logger.info(`[alarmDispatcher] Disparando alarme para intakeEvent ${eventId}`);
}

export async function processPendingAlarms(): Promise<{ sent: number; missed: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - SCAN_WINDOW_HOURS * 60 * 60 * 1000);

    const pending = await prisma.intakeEvent.findMany({
        where: {
            status: 'PENDING',
            scheduledAt: { gte: windowStart, lte: now }
        },
        take: 500,
        orderBy: { scheduledAt: 'asc' }
    });

    let sent = 0; let missed = 0;

    for (const ev of pending) {
        const minutesSince = differenceInMinutes(now, ev.scheduledAt);

        // Marcar MISSED se passou da janela
        if (minutesSince >= MARK_MISSED_AFTER_MIN || (ev.attempts >= MAX_ATTEMPTS && minutesSince >= RETRY_INTERVAL_MIN * (MAX_ATTEMPTS))) {
            try {
                await prisma.intakeEvent.update({
                    where: { id: ev.id },
                    data: { status: 'MISSED' }
                });
                missed++;
            } catch (e) {
                // ignorar concorrência
            }
            continue;
        }

        // Decidir se precisa enviar novo alarme
        const nextThreshold = ev.attempts * RETRY_INTERVAL_MIN; // attempts 0 => 0; 1=>15;2=>30
        if (ev.attempts < MAX_ATTEMPTS && minutesSince >= nextThreshold) {
            try {
                await prisma.$transaction([
                    prisma.intakeEvent.update({
                        where: { id: ev.id },
                        data: { attempts: { increment: 1 } }
                    })
                ]);
                await dispatchAlarm(ev.id);
                sent++;
            } catch (e) {
                // possivelmente outro processo já tratou
            }
        }
    }

    return { sent, missed };
}

let running = false;
export function startAlarmProcessor(intervalMs = 60 * 1000) { // a cada 1 min
    if (running) return;
    running = true;
    const loop = async () => {
        try {
            const { sent, missed } = await processPendingAlarms();
            if (sent || missed) {
                logger.info(`[alarmProcessor] sent=${sent} missed=${missed}`);
            }
        } catch (e) {
            console.error('[alarmProcessor] erro', e);
        } finally {
            setTimeout(loop, intervalMs);
        }
    };
    loop();
}
