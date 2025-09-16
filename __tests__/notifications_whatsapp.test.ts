import { WhatsAppProvider } from '../src/services/notifications/whatsapp';

const originalFetch = global.fetch as any;

describe('WhatsAppProvider', () => {
    beforeAll(() => {
        process.env.WHATSAPP_TOKEN = 'test-wa-token';
        process.env.WHATSAPP_PHONE_ID = '1234567890';
        process.env.WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';
    });
    afterAll(() => {
        global.fetch = originalFetch;
    });
    beforeEach(() => {
        jest.restoreAllMocks();
        process.env.WHATSAPP_TEMPLATE_NAME = '';
        process.env.WHATSAPP_RETRY_MAX = '';
        process.env.WHATSAPP_RETRY_BASE_MS = '';
    });

    it('dry-run: não chama fetch e retorna sent = len', async () => {
        process.env.NOTIFY_DRY_RUN = 'true';
        const provider = new WhatsAppProvider();
        const msgs = [
            { to: '5511999999999', name: 'A', text: 'Ajuda' },
            { to: '5511888888888', name: 'B', text: 'Socorro' }
        ];
        const res = await provider.sendSosBulk(msgs);
        expect(res.sent).toBe(2);
        expect(global.fetch).toBe(originalFetch);
    });

    it('retry/backoff em erro 500 e sucesso após retry', async () => {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.WHATSAPP_RETRY_MAX = '1';
        process.env.WHATSAPP_RETRY_BASE_MS = '1';

        const calls: any[] = [];
        let first = true;
        global.fetch = jest.fn(async (_input: any, _opts?: any) => {
            calls.push(1);
            if (first) {
                first = false;
                return { ok: false, status: 500, text: async () => 'server error' } as any;
            }
            return {
                ok: true,
                json: async () => ({ messages: [{ id: 'mid.1' }] })
            } as any;
        });

        const provider = new WhatsAppProvider();
        const res = await provider.sendSosBulk([{ to: '5511999999999', text: 'SOS' }]);
        expect(res.sent).toBe(1);
        expect((global.fetch as any).mock.calls.length).toBe(2);
    });

    it('envio por template: monta payload correto', async () => {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.WHATSAPP_TEMPLATE_NAME = 'sos_template';
        process.env.WHATSAPP_TEMPLATE_LANG = 'pt_BR';

        let lastBody: any = null;
        global.fetch = jest.fn(async (_input: any, opts?: any) => {
            lastBody = JSON.parse(opts?.body || '{}');
            return {
                ok: true,
                json: async () => ({ messages: [{ id: 'mid.2' }] })
            } as any;
        });

        const provider = new WhatsAppProvider();
        await provider.sendSosBulk([{ to: '5511999999999', name: 'Andrei', text: 'Ajuda' }]);
        expect(lastBody.type).toBe('template');
        expect(lastBody.template?.name).toBe('sos_template');
        expect(lastBody.template?.language?.code).toBe('pt_BR');
    });
});
