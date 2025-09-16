import { NotificationProvider, SosMessage } from './index';
import { logger as baseLogger } from '../../lib/logger';
import { getCorrelationId } from '../../lib/als';

function env(name: string, required = true): string | undefined {
    const v = process.env[name];
    if (required && !v) throw new Error(`Env faltando: ${name}`);
    return v;
}

export class WhatsAppProvider implements NotificationProvider {
    private token: string;
    private phoneId: string;
    private apiUrl: string;
    private dryRun: boolean;
    private logger = baseLogger.child({ svc: 'WhatsAppProvider' });
    private useTemplate: boolean;
    private templateName?: string;
    private templateLang: string;
    private retryMax: number;
    private retryBaseMs: number;

    constructor() {
        this.token = env('WHATSAPP_TOKEN')!;
        this.phoneId = env('WHATSAPP_PHONE_ID')!;
        this.apiUrl = env('WHATSAPP_API_URL') || 'https://graph.facebook.com/v20.0';
        this.dryRun = (process.env.NOTIFY_DRY_RUN ?? 'true').toLowerCase() === 'true';
        this.templateName = process.env.WHATSAPP_TEMPLATE_NAME;
        this.useTemplate = !!this.templateName;
        this.templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR';
        this.retryMax = Number(process.env.WHATSAPP_RETRY_MAX ?? 2);
        this.retryBaseMs = Number(process.env.WHATSAPP_RETRY_BASE_MS ?? 500);
    }

    async sendAlarm(userId: string, intakeEventId: string): Promise<void> {
        // Para WA, foco é SOS; alarmes via WA podem ser opcionais.
        if (this.dryRun) {
            this.logger.info({ userId, intakeEventId, correlationId: getCorrelationId() }, '[WA:dry] Alarm');
            return;
        }
    }

    async sendSosBulk(messages: SosMessage[]): Promise<{ sent: number }> {
        if (this.dryRun) {
            this.logger.info({ count: messages.length, correlationId: getCorrelationId() }, '[WA:dry] SOS');
            return { sent: messages.length };
        }

        let sent = 0;
        for (const m of messages) {
            const ok = await this.sendSingle(m);
            if (ok) sent++;
        }
        return { sent };
    }

    private sleep(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }

    private buildPayload(m: SosMessage) {
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

    private async sendSingle(m: SosMessage): Promise<boolean> {
        const url = `${this.apiUrl}/${this.phoneId}/messages`;
        const body = this.buildPayload(m);

        for (let attempt = 0; attempt <= this.retryMax; attempt++) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`
                    },
                    body: JSON.stringify(body)
                });

                const isRetryable = (status: number) => status >= 500 || status === 429;

                if (!resp.ok) {
                    const text = await resp.text();
                    this.logger.warn({ status: resp.status, to: m.to, attempt, text, correlationId: getCorrelationId() }, 'WA resposta não OK');
                    if (isRetryable(resp.status) && attempt < this.retryMax) {
                        await this.sleep(this.retryBaseMs * Math.pow(2, attempt));
                        continue;
                    }
                    return false;
                }

                // Tentar parsear JSON de sucesso/erro por item
                const data: any = await resp.json().catch(() => undefined);
                if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
                    // sucesso
                    return true;
                }
                if (data?.error) {
                    const e = data.error;
                    this.logger.error({ to: m.to, attempt, code: e.code, type: e.type, message: e.message, correlationId: getCorrelationId() }, 'WA erro no Graph');
                    return false;
                }
                // Se não vier nada estruturado, considerar OK quando HTTP 200
                return true;
            } catch (err) {
                this.logger.error({ to: m.to, attempt, err, correlationId: getCorrelationId() }, 'Exceção ao enviar WA');
                if (attempt < this.retryMax) {
                    await this.sleep(this.retryBaseMs * Math.pow(2, attempt));
                    continue;
                }
                return false;
            }
        }
        return false;
    }
}
