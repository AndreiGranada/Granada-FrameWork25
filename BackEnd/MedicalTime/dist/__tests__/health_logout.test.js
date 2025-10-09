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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const app = (0, app_1.createApp)();
describe('Health e Logout', () => {
    test('GET /health retorna status e componentes', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('time');
    }));
    test('POST /auth/logout retorna message', () => __awaiter(void 0, void 0, void 0, function* () {
        // Registrar usuário para obter token
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email: 'logout@test.com', password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = yield (0, supertest_1.default)(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    }));
});
