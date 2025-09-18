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
const whatsapp_1 = require("../src/services/notifications/whatsapp");
const originalFetch = global.fetch;
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
    it('dry-run: não chama fetch e retorna sent = len', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.NOTIFY_DRY_RUN = 'true';
        const provider = new whatsapp_1.WhatsAppProvider();
        const msgs = [
            { to: '5511999999999', name: 'A', text: 'Ajuda' },
            { to: '5511888888888', name: 'B', text: 'Socorro' }
        ];
        const res = yield provider.sendSosBulk(msgs);
        expect(res.sent).toBe(2);
        expect(global.fetch).toBe(originalFetch);
    }));
    it('retry/backoff em erro 500 e sucesso após retry', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.WHATSAPP_RETRY_MAX = '1';
        process.env.WHATSAPP_RETRY_BASE_MS = '1';
        const calls = [];
        let first = true;
        global.fetch = jest.fn((_input, _opts) => __awaiter(void 0, void 0, void 0, function* () {
            calls.push(1);
            if (first) {
                first = false;
                return { ok: false, status: 500, text: () => __awaiter(void 0, void 0, void 0, function* () { return 'server error'; }) };
            }
            return {
                ok: true,
                json: () => __awaiter(void 0, void 0, void 0, function* () { return ({ messages: [{ id: 'mid.1' }] }); })
            };
        }));
        const provider = new whatsapp_1.WhatsAppProvider();
        const res = yield provider.sendSosBulk([{ to: '5511999999999', text: 'SOS' }]);
        expect(res.sent).toBe(1);
        expect(global.fetch.mock.calls.length).toBe(2);
    }));
    it('envio por template: monta payload correto', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        process.env.NOTIFY_DRY_RUN = 'false';
        process.env.WHATSAPP_TEMPLATE_NAME = 'sos_template';
        process.env.WHATSAPP_TEMPLATE_LANG = 'pt_BR';
        let lastBody = null;
        global.fetch = jest.fn((_input, opts) => __awaiter(void 0, void 0, void 0, function* () {
            lastBody = JSON.parse((opts === null || opts === void 0 ? void 0 : opts.body) || '{}');
            return {
                ok: true,
                json: () => __awaiter(void 0, void 0, void 0, function* () { return ({ messages: [{ id: 'mid.2' }] }); })
            };
        }));
        const provider = new whatsapp_1.WhatsAppProvider();
        yield provider.sendSosBulk([{ to: '5511999999999', name: 'Andrei', text: 'Ajuda' }]);
        expect(lastBody.type).toBe('template');
        expect((_a = lastBody.template) === null || _a === void 0 ? void 0 : _a.name).toBe('sos_template');
        expect((_c = (_b = lastBody.template) === null || _b === void 0 ? void 0 : _b.language) === null || _c === void 0 ? void 0 : _c.code).toBe('pt_BR');
    }));
});
