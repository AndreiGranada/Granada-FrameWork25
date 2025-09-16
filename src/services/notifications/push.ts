import { NotificationProvider, SosMessage } from './index';
import { prisma } from '../../lib/prisma';
import { logger as baseLogger } from '../../lib/logger';
import { getCorrelationId } from '../../lib/als';

function getBool(name: string, def = 'true') {
    return (process.env[name] ?? def).toLowerCase() === 'true';
}

export class FcmProvider implements NotificationProvider {
    private serverKey: string | undefined;
    private dryRun: boolean;

    constructor() {
        this.serverKey = process.env.FCM_SERVER_KEY;
        this.dryRun = getBool('NOTIFY_DRY_RUN', 'true');
        if (!this.serverKey && !this.dryRun) {
            throw new Error('Env faltando: FCM_SERVER_KEY');
        }
    }

    async sendAlarm(userId: string, intakeEventId: string): Promise<void> {
        // Nesta fase, não vinculamos a tokens/regras reais; apenas loga/dry-run
        if (this.dryRun) {
            // eslint-disable-next-line no-console
            console.log(`[FCM:dry] Alarm user=${userId} intake=${intakeEventId}`);
            return;
        }
        // Implementação real dependerá de recuperar devices/pushTokens do usuário
        // e enviar via FCM HTTPv1 ou Legacy (preferir HTTPv1 com OAuth 2.0 Service Account)
    }

    async sendSosBulk(messages: SosMessage[]): Promise<{ sent: number }> {
        if (this.dryRun) {
            // eslint-disable-next-line no-console
            console.log('[FCM:dry] SOS ->', messages);
            return { sent: messages.length };
        }
        // Normalmente SOS é por WhatsApp/SMS; para push manter como no-op por ora
        return { sent: 0 };
    }
}

export class ExpoProvider implements NotificationProvider {
    private accessToken: string | undefined;
    private dryRun: boolean;
    private logger = baseLogger.child({ svc: 'ExpoProvider' });

    constructor() {
        this.accessToken = process.env.EXPO_ACCESS_TOKEN;
        this.dryRun = getBool('NOTIFY_DRY_RUN', 'true');
        if (!this.accessToken && !this.dryRun) {
            throw new Error('Env faltando: EXPO_ACCESS_TOKEN');
        }
    }

    async sendAlarm(userId: string, intakeEventId: string): Promise<void> {
        // Buscar devices ativos do usuário
        const devices = await prisma.device.findMany({
            where: { userId, isActive: true },
            select: { id: true, pushToken: true }
        });

        const isExpoToken = (t: string) => /^ExponentPushToken\[|^ExpoPushToken\[/.test(t);
        const tokens = devices.map(d => d.pushToken).filter((t): t is string => !!t && isExpoToken(t));

        if (tokens.length === 0) {
            this.logger.debug({ userId, intakeEventId, correlationId: getCorrelationId() }, 'Sem tokens Expo para enviar');
            if (this.dryRun) return; // nada a fazer
            return;
        }

        if (this.dryRun) {
            this.logger.info({ userId, intakeEventId, count: tokens.length, correlationId: getCorrelationId() }, '[EXPO:dry] envio de alarme');
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
        const chunk = <T,>(arr: T[], size: number) => arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
        const batches = chunk(messages, 100);

        const invalidTokens: string[] = [];
        for (const batch of batches) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {})
                    },
                    body: JSON.stringify(batch)
                });

                if (!resp.ok) {
                    const txt = await resp.text();
                    this.logger.error({ status: resp.status, txt, correlationId: getCorrelationId() }, 'Falha ao enviar lote Expo');
                    continue;
                }

                const json: any = await resp.json();
                const results: any[] = Array.isArray(json?.data) ? json.data : [];
                results.forEach((r, idx) => {
                    if (r?.status === 'error') {
                        const token = batch[idx]?.to;
                        const errCode = r?.details?.error || r?.message;
                        this.logger.warn({ token, errCode, correlationId: getCorrelationId() }, 'Erro em push Expo');
                        if (token && typeof token === 'string') {
                            if (errCode === 'DeviceNotRegistered' || /not a registered Expo push token/i.test(String(errCode))) {
                                invalidTokens.push(token);
                            }
                        }
                    }
                });
            } catch (e) {
                this.logger.error({ err: e, correlationId: getCorrelationId() }, 'Exceção ao enviar lote Expo');
            }
        }

        if (invalidTokens.length > 0) {
            await prisma.device.updateMany({
                where: { userId, pushToken: { in: invalidTokens } },
                data: { isActive: false }
            });
            this.logger.info({ userId, invalidCount: invalidTokens.length, correlationId: getCorrelationId() }, 'Desativados tokens Expo inválidos');
        }
    }

    async sendSosBulk(messages: SosMessage[]): Promise<{ sent: number }> {
        if (this.dryRun) {
            // eslint-disable-next-line no-console
            console.log('[EXPO:dry] SOS ->', messages);
            return { sent: messages.length };
        }
        return { sent: 0 };
    }
}
