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
const prisma_1 = require("../src/lib/prisma");
describe('Contract additions/tests', () => {
    const app = (0, app_1.createApp)();
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () { yield prisma_1.prisma.$disconnect(); }));
    test('GET /me retorna wrapper { user }', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'contract+me@example.com';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = yield (0, supertest_1.default)(app).get('/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', email);
    }));
    test('POST /devices reenvio mesmo pushToken retorna 200 (upsert)', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'contract+device@example.com';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const pushToken = 'ExponentPushToken[abc]';
        const first = yield (0, supertest_1.default)(app).post('/devices').set('Authorization', `Bearer ${token}`).send({ platform: 'ANDROID', pushToken });
        expect([200, 201]).toContain(first.status);
        const second = yield (0, supertest_1.default)(app).post('/devices').set('Authorization', `Bearer ${token}`).send({ platform: 'ANDROID', pushToken });
        expect(second.status).toBe(200);
    }));
    test('POST /emergency/sos sem contatos ativos retorna 400', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'contract+sos@example.com';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = yield (0, supertest_1.default)(app).post('/emergency/sos').set('Authorization', `Bearer ${token}`).send({});
        expect(res.status).toBe(400);
    }));
    test('GET /intakes/history paginado última página nextCursor null', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = 'contract+history@example.com';
        const reg = yield (0, supertest_1.default)(app).post('/auth/register').send({ email, password: 'secret123' });
        expect([200, 201]).toContain(reg.status);
        const token = reg.body.token;
        const res = yield (0, supertest_1.default)(app).get('/intakes/history?limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        if (res.body.pageInfo) {
            expect(res.body.pageInfo.hasMore).toBe(false);
            expect(res.body.pageInfo.nextCursor).toBeNull();
        }
    }));
});
