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
exports.getNotificationProvider = getNotificationProvider;
class DevProvider {
    sendAlarm(userId, intakeEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Apenas loga em dev
            // eslint-disable-next-line no-console
            console.log(`[DevNotify] Alarm user=${userId} intake=${intakeEventId}`);
        });
    }
    sendSosBulk(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line no-console
            console.log('[DevNotify] SOS ->', messages);
            return { sent: messages.length };
        });
    }
}
let provider = null;
function getNotificationProvider() {
    if (!provider) {
        const mode = (process.env.NOTIFY_PROVIDER || 'dev').toLowerCase();
        if (mode === 'whatsapp') {
            // import dinâmico para evitar peso quando não usado
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { WhatsAppProvider } = require('./whatsapp');
            provider = new WhatsAppProvider();
        }
        else if (mode === 'fcm') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { FcmProvider } = require('./push');
            provider = new FcmProvider();
        }
        else if (mode === 'expo') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { ExpoProvider } = require('./push');
            provider = new ExpoProvider();
        }
        else {
            provider = new DevProvider();
        }
    }
    return provider;
}
