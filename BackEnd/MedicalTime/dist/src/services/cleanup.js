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
exports.runCleanup = runCleanup;
exports.startCleanupJob = startCleanupJob;
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
const logger_1 = require("../lib/logger");
// Limpeza de:
// 1. PasswordResetToken expirado ou usado há > 1 dia
// 2. IntakeEvent com scheduledAt < agora - 90 dias
//    (retendo somente janela de 90 dias de histórico)
function runCleanup() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const cutoffIntakes = (0, date_fns_1.subDays)(now, 90);
        const cutoffUsedTokens = (0, date_fns_1.subDays)(now, 1);
        // Tokens de reset: remover expirados ou usados antes do cutoffUsedTokens
        const delTokens = yield prisma_1.prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: now } },
                    { usedAt: { not: null, lt: cutoffUsedTokens } }
                ]
            }
        });
        // IntakeEvents antigos (qualquer status) antes do cutoffIntakes
        const delIntakes = yield prisma_1.prisma.intakeEvent.deleteMany({
            where: { scheduledAt: { lt: cutoffIntakes } }
        });
        return { removedResetTokens: delTokens.count, removedIntakeEvents: delIntakes.count };
    });
}
let running = false;
function startCleanupJob(intervalMs = 60 * 60 * 1000) {
    if (running)
        return;
    running = true;
    const loop = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const { removedResetTokens, removedIntakeEvents } = yield runCleanup();
            if (removedResetTokens || removedIntakeEvents) {
                logger_1.logger.info({ removedResetTokens, removedIntakeEvents }, '[cleanupJob] remoções');
            }
        }
        catch (e) {
            logger_1.logger.error({ err: e }, '[cleanupJob] erro');
        }
        finally {
            setTimeout(loop, intervalMs);
        }
    });
    loop();
}
