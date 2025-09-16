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
describe('Auth Flow', () => {
    it('register -> login -> refresh', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'user@test.com';
        const password = 'secret123';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password, name: 'Test' });
        expect(reg.status).toBe(201);
        expect(reg.body.token).toBeDefined();
        expect(reg.body.refreshToken).toBeDefined();
        const login = yield (0, supertest_1.default)(app).post('/auth/login').send({ email, password });
        expect(login.status).toBe(200);
        expect(login.body.token).toBeDefined();
        expect(login.body.refreshToken).toBeDefined();
        const refresh = yield (0, supertest_1.default)(app).post('/auth/refresh').send({ refreshToken: login.body.refreshToken });
        expect(refresh.status).toBe(200);
        expect(refresh.body.token).toBeDefined();
        expect(refresh.body.refreshToken).toBeDefined();
    }));
    it('rejects invalid login', () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield (0, supertest_1.default)(app).post('/auth/login').send({ email: 'nao@existe.com', password: 'x' });
        expect([400, 401]).toContain(r.status); // pode ser validação ou credenciais
    }));
});
