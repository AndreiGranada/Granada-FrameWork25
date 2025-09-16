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
exports.ExpoProvider = exports.FcmProvider = void 0;
const prisma_1 = require("../../lib/prisma");
const logger_1 = require("../../lib/logger");
const als_1 = require("../../lib/als");
function getBool(name, def = 'true') {
    var _a;
    return ((_a = process.env[name]) !== null && _a !== void 0 ? _a : def).toLowerCase() === 'true';
}
class FcmProvider {
    constructor() {
        this.serverKey = process.env.FCM_SERVER_KEY;
        this.dryRun = getBool('NOTIFY_DRY_RUN', 'true');
        if (!this.serverKey && !this.dryRun) {
            throw new Error('Env faltando: FCM_SERVER_KEY');
        }
    }
    sendAlarm(userId, intakeEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Nesta fase, não vinculamos a tokens/regras reais; apenas loga/dry-run
            if (this.dryRun) {
                // eslint-disable-next-line no-console
                console.log(`[FCM:dry] Alarm user=${userId} intake=${intakeEventId}`);
                return;
            }
            // Implementação real dependerá de recuperar devices/pushTokens do usuário
            // e enviar via FCM HTTPv1 ou Legacy (preferir HTTPv1 com OAuth 2.0 Service Account)
        });
    }
    sendSosBulk(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dryRun) {
                // eslint-disable-next-line no-console
                console.log('[FCM:dry] SOS ->', messages);
                return { sent: messages.length };
            }
            // Normalmente SOS é por WhatsApp/SMS; para push manter como no-op por ora
            return { sent: 0 };
        });
    }
}
exports.FcmProvider = FcmProvider;
class ExpoProvider {
    constructor() {
        this.logger = logger_1.logger.child({ svc: 'ExpoProvider' });
        this.accessToken = process.env.EXPO_ACCESS_TOKEN;
        this.dryRun = getBool('NOTIFY_DRY_RUN', 'true');
        if (!this.accessToken && !this.dryRun) {
            throw new Error('Env faltando: EXPO_ACCESS_TOKEN');
        }
    }
    sendAlarm(userId, intakeEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Buscar devices ativos do usuário
            const devices = yield prisma_1.prisma.device.findMany({
                where: { userId, isActive: true },
                select: { id: true, pushToken: true }
            });
            const isExpoToken = (t) => /^ExponentPushToken\[|^ExpoPushToken\[/.test(t);
            const tokens = devices.map(d => d.pushToken).filter((t) => !!t && isExpoToken(t));
            if (tokens.length === 0) {
                this.logger.debug({ userId, intakeEventId, correlationId: (0, als_1.getCorrelationId)() }, 'Sem tokens Expo para enviar');
                if (this.dryRun)
                    return; // nada a fazer
                return;
            }
            if (this.dryRun) {
                this.logger.info({ userId, intakeEventId, count: tokens.length, correlationId: (0, als_1.getCorrelationId)() }, '[EXPO:dry] envio de alarme');
                return;
            }
            // Montar mensagens
            const title = 'Hora do remédio';
            const body = 'Está na hora de tomar sua medicação.';
            const messages = tokens.map(to => ({
                to,
                sound: 'default',
                title,
                body,
                data: { intakeEventId },
                priority: 'high'
            }));
            // Enviar em lotes de até 100 mensagens
            const url = 'https://exp.host/--/api/v2/push/send';
            const chunk = (arr, size) => arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
            const batches = chunk(messages, 100);
            const invalidTokens = [];
            for (const batch of batches) {
                try {
                    const resp = yield fetch(url, {
                        method: 'POST',
                        headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, (this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {})),
                        body: JSON.stringify(batch)
                    });
                    if (!resp.ok) {
                        const txt = yield resp.text();
                        this.logger.error({ status: resp.status, txt, correlationId: (0, als_1.getCorrelationId)() }, 'Falha ao enviar lote Expo');
                        continue;
                    }
                    const json = yield resp.json();
                    const results = Array.isArray(json === null || json === void 0 ? void 0 : json.data) ? json.data : [];
                    results.forEach((r, idx) => {
                        var _a, _b;
                        if ((r === null || r === void 0 ? void 0 : r.status) === 'error') {
                            const token = (_a = batch[idx]) === null || _a === void 0 ? void 0 : _a.to;
                            const errCode = ((_b = r === null || r === void 0 ? void 0 : r.details) === null || _b === void 0 ? void 0 : _b.error) || (r === null || r === void 0 ? void 0 : r.message);
                            this.logger.warn({ token, errCode, correlationId: (0, als_1.getCorrelationId)() }, 'Erro em push Expo');
                            if (token && typeof token === 'string') {
                                if (errCode === 'DeviceNotRegistered' || /not a registered Expo push token/i.test(String(errCode))) {
                                    invalidTokens.push(token);
                                }
                            }
                        }
                    });
                }
                catch (e) {
                    this.logger.error({ err: e, correlationId: (0, als_1.getCorrelationId)() }, 'Exceção ao enviar lote Expo');
                }
            }
            if (invalidTokens.length > 0) {
                yield prisma_1.prisma.device.updateMany({
                    where: { userId, pushToken: { in: invalidTokens } },
                    data: { isActive: false }
                });
                this.logger.info({ userId, invalidCount: invalidTokens.length, correlationId: (0, als_1.getCorrelationId)() }, 'Desativados tokens Expo inválidos');
            }
        });
    }
    sendSosBulk(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dryRun) {
                // eslint-disable-next-line no-console
                console.log('[EXPO:dry] SOS ->', messages);
                return { sent: messages.length };
            }
            return { sent: 0 };
        });
    }
}
exports.ExpoProvider = ExpoProvider;
