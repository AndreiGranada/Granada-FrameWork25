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
exports.WhatsAppProvider = void 0;
const logger_1 = require("../../lib/logger");
const als_1 = require("../../lib/als");
function env(name, required = true) {
    const v = process.env[name];
    if (required && !v)
        throw new Error(`Env faltando: ${name}`);
    return v;
}
class WhatsAppProvider {
    constructor() {
        var _a, _b, _c;
        this.logger = logger_1.logger.child({ svc: 'WhatsAppProvider' });
        this.token = env('WHATSAPP_TOKEN');
        this.phoneId = env('WHATSAPP_PHONE_ID');
        this.apiUrl = env('WHATSAPP_API_URL') || 'https://graph.facebook.com/v20.0';
        this.dryRun = ((_a = process.env.NOTIFY_DRY_RUN) !== null && _a !== void 0 ? _a : 'true').toLowerCase() === 'true';
        this.templateName = process.env.WHATSAPP_TEMPLATE_NAME;
        this.useTemplate = !!this.templateName;
        this.templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR';
        this.retryMax = Number((_b = process.env.WHATSAPP_RETRY_MAX) !== null && _b !== void 0 ? _b : 2);
        this.retryBaseMs = Number((_c = process.env.WHATSAPP_RETRY_BASE_MS) !== null && _c !== void 0 ? _c : 500);
    }
    sendAlarm(userId, intakeEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Para WA, foco é SOS; alarmes via WA podem ser opcionais.
            if (this.dryRun) {
                this.logger.info({ userId, intakeEventId, correlationId: (0, als_1.getCorrelationId)() }, '[WA:dry] Alarm');
                return;
            }
        });
    }
    sendSosBulk(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dryRun) {
                this.logger.info({ count: messages.length, correlationId: (0, als_1.getCorrelationId)() }, '[WA:dry] SOS');
                return { sent: messages.length };
            }
            let sent = 0;
            for (const m of messages) {
                const ok = yield this.sendSingle(m);
                if (ok)
                    sent++;
            }
            return { sent };
        });
    }
    sleep(ms) {
        return new Promise((res) => setTimeout(res, ms));
    }
    buildPayload(m) {
        if (this.useTemplate && this.templateName) {
            // Envio por template
            const components = [
                {
                    type: 'body',
                    parameters: [
                        ...(m.name ? [{ type: 'text', text: m.name }] : []),
                        ...(m.text ? [{ type: 'text', text: m.text }] : [])
                    ]
                }
            ];
            return {
                messaging_product: 'whatsapp',
                to: m.to,
                type: 'template',
                template: {
                    name: this.templateName,
                    language: { code: this.templateLang },
                    components
                }
            };
        }
        // Texto simples
        return {
            messaging_product: 'whatsapp',
            to: m.to,
            type: 'text',
            text: { body: m.text }
        };
    }
    sendSingle(m) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.apiUrl}/${this.phoneId}/messages`;
            const body = this.buildPayload(m);
            for (let attempt = 0; attempt <= this.retryMax; attempt++) {
                try {
                    const resp = yield fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.token}`
                        },
                        body: JSON.stringify(body)
                    });
                    const isRetryable = (status) => status >= 500 || status === 429;
                    if (!resp.ok) {
                        const text = yield resp.text();
                        this.logger.warn({ status: resp.status, to: m.to, attempt, text, correlationId: (0, als_1.getCorrelationId)() }, 'WA resposta não OK');
                        if (isRetryable(resp.status) && attempt < this.retryMax) {
                            yield this.sleep(this.retryBaseMs * Math.pow(2, attempt));
                            continue;
                        }
                        return false;
                    }
                    // Tentar parsear JSON de sucesso/erro por item
                    const data = yield resp.json().catch(() => undefined);
                    if ((data === null || data === void 0 ? void 0 : data.messages) && Array.isArray(data.messages) && data.messages.length > 0) {
                        // sucesso
                        return true;
                    }
                    if (data === null || data === void 0 ? void 0 : data.error) {
                        const e = data.error;
                        this.logger.error({ to: m.to, attempt, code: e.code, type: e.type, message: e.message, correlationId: (0, als_1.getCorrelationId)() }, 'WA erro no Graph');
                        return false;
                    }
                    // Se não vier nada estruturado, considerar OK quando HTTP 200
                    return true;
                }
                catch (err) {
                    this.logger.error({ to: m.to, attempt, err, correlationId: (0, als_1.getCorrelationId)() }, 'Exceção ao enviar WA');
                    if (attempt < this.retryMax) {
                        yield this.sleep(this.retryBaseMs * Math.pow(2, attempt));
                        continue;
                    }
                    return false;
                }
            }
            return false;
        });
    }
}
exports.WhatsAppProvider = WhatsAppProvider;
