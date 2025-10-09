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
describe('PATCH /me', () => {
    it('atualiza nome e timezone', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'user2@test.com';
        const password = 'secret123';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password, name: 'Orig' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;
        const resp = yield (0, supertest_1.default)(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Novo Nome', timezone: 'Europe/London' });
        expect(resp.status).toBe(200);
        expect(resp.body.user.name).toBe('Novo Nome');
        expect(resp.body.user.timezone).toBe('Europe/London');
    }));
    it('troca senha com passwordCurrent/passwordNew', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'user3@test.com';
        const password = 'secret123';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password, name: 'User3' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;
        const change = yield (0, supertest_1.default)(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ passwordCurrent: 'secret123', passwordNew: 'novaSenha789' });
        expect(change.status).toBe(200);
        // Login com nova senha deve funcionar
        const login = yield (0, supertest_1.default)(app).post('/auth/login').send({ email, password: 'novaSenha789' });
        expect(login.status).toBe(200);
    }));
    it('falha se passwordCurrent incorreta', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'user4@test.com';
        const password = 'secret123';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password, name: 'User4' });
        expect(reg.status).toBe(201);
        const token = reg.body.token;
        const change = yield (0, supertest_1.default)(app)
            .patch('/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ passwordCurrent: 'errada', passwordNew: 'qualquer123' });
        expect([400, 409]).toContain(change.status);
    }));
});
