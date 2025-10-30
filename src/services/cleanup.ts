import { prisma } from '../lib/prisma';
import { subDays } from 'date-fns';
import { logger } from '../lib/logger';

// Limpeza de:
// 1. PasswordResetToken expirado ou usado há > 1 dia
// 2. IntakeEvent com scheduledAt < agora - 90 dias
//    (retendo somente janela de 90 dias de histórico)

export async function runCleanup(): Promise<{ removedResetTokens: number; removedIntakeEvents: number; }> {
    const now = new Date();
    const cutoffIntakes = subDays(now, 90);
    const cutoffUsedTokens = subDays(now, 1);

    // Tokens de reset: remover expirados ou usados antes do cutoffUsedTokens
    const delTokens = await prisma.passwordResetToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: now } },
                { usedAt: { not: null, lt: cutoffUsedTokens } }
            ]
        }
    });

    // IntakeEvents antigos (qualquer status) antes do cutoffIntakes
    const delIntakes = await prisma.intakeEvent.deleteMany({
        where: { scheduledAt: { lt: cutoffIntakes } }
    });

    return { removedResetTokens: delTokens.count, removedIntakeEvents: delIntakes.count };
}

let running = false;
export function startCleanupJob(intervalMs = 60 * 60 * 1000) { // a cada 1h
    if (running) return;
    running = true;
    const loop = async () => {
        try {
            const { removedResetTokens, removedIntakeEvents } = await runCleanup();
            if (removedResetTokens || removedIntakeEvents) {
                logger.info({ removedResetTokens, removedIntakeEvents }, '[cleanupJob] remoções');
            }
        } catch (e) {
            logger.error({ err: e }, '[cleanupJob] erro');
        } finally {
            setTimeout(loop, intervalMs);
        }
    };
    loop();
}
