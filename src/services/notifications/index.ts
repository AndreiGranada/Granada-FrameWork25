export type SosMessage = { to: string; name?: string; text: string };
export interface NotificationProvider {
    sendAlarm(userId: string, intakeEventId: string): Promise<void>;
    sendSosBulk(messages: SosMessage[]): Promise<{ sent: number }>;
}

class DevProvider implements NotificationProvider {
    async sendAlarm(userId: string, intakeEventId: string): Promise<void> {
        // Apenas loga em dev
        // eslint-disable-next-line no-console
        console.log(`[DevNotify] Alarm user=${userId} intake=${intakeEventId}`);
    }
    async sendSosBulk(messages: SosMessage[]): Promise<{ sent: number }> {
        // eslint-disable-next-line no-console
        console.log('[DevNotify] SOS ->', messages);
        return { sent: messages.length };
    }
}

let provider: NotificationProvider | null = null;
export function getNotificationProvider(): NotificationProvider {
    if (!provider) {
        const mode = (process.env.NOTIFY_PROVIDER || 'dev').toLowerCase();
        if (mode === 'whatsapp') {
            // import dinâmico para evitar peso quando não usado
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { WhatsAppProvider } = require('./whatsapp');
            provider = new WhatsAppProvider();
        } else if (mode === 'fcm') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { FcmProvider } = require('./push');
            provider = new FcmProvider();
        } else if (mode === 'expo') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { ExpoProvider } = require('./push');
            provider = new ExpoProvider();
        } else {
            provider = new DevProvider();
        }
    }
    return provider!;
}
