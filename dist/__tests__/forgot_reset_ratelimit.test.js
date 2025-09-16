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
const index_1 = __importDefault(require("../index"));
const prisma_1 = require("../src/lib/prisma");
// Mock do serviço de e-mail para capturar token
jest.mock('../src/services/mail', () => ({
    sendPasswordResetEmail: jest.fn((_to, _token) => __awaiter(void 0, void 0, void 0, function* () { return undefined; })),
}));
const { sendPasswordResetEmail } = require('../src/services/mail');
describe('Forgot/Reset & Rate Limit', () => {
    it('forgot envia token e reset troca senha com token válido', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `u${Date.now()}@t.com`;
        const password = 'secret123';
        yield (0, supertest_1.default)(index_1.default).post('/auth/register').send({ email, password });
        // forgot
        yield (0, supertest_1.default)(index_1.default).post('/auth/forgot').send({ email }).expect(200);
        expect(sendPasswordResetEmail).toHaveBeenCalled();
        // capturar token criado no banco
        const prt = yield prisma_1.prisma.passwordResetToken.findFirst({
            where: { user: { email } },
            orderBy: { createdAt: 'desc' },
        });
        expect(prt).toBeTruthy();
        // reset com token
        yield (0, supertest_1.default)(index_1.default).post('/auth/reset').send({ token: prt.token, password: 'newpass123' }).expect(200);
        // login com nova senha funciona; com antiga deve falhar
        yield (0, supertest_1.default)(index_1.default).post('/auth/login').send({ email, password: 'newpass123' }).expect(200);
        yield (0, supertest_1.default)(index_1.default).post('/auth/login').send({ email, password }).expect(401);
    }));
    it('reset falha com token expirado ou usado', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `e${Date.now()}@t.com`;
        yield (0, supertest_1.default)(index_1.default).post('/auth/register').send({ email, password: 'xpto123' });
        // criar token manual expirado
        const tokExp = yield prisma_1.prisma.passwordResetToken.create({
            data: { user: { connect: { email } }, token: `t-exp-${Date.now()}`, expiresAt: new Date(Date.now() - 1000) },
        });
        yield (0, supertest_1.default)(index_1.default).post('/auth/reset').send({ token: tokExp.token, password: 'abc12345' }).expect(400);
        // criar token válido e marcar usado
        const tokUse = yield prisma_1.prisma.passwordResetToken.create({
            data: { user: { connect: { email } }, token: `t-use-${Date.now()}`, expiresAt: new Date(Date.now() + 1000 * 60 * 10) },
        });
        yield prisma_1.prisma.passwordResetToken.update({ where: { id: tokUse.id }, data: { usedAt: new Date() } });
        yield (0, supertest_1.default)(index_1.default).post('/auth/reset').send({ token: tokUse.token, password: 'abc12345' }).expect(400);
    }));
    it('rate limit em /auth/register aplica após múltiplas tentativas', () => __awaiter(void 0, void 0, void 0, function* () {
        const emailBase = `r${Date.now()}`;
        // 60 tentativas de registro com e-mails diferentes devem bater no limit window
        let status429 = false;
        for (let i = 0; i < 60; i++) {
            const res = yield (0, supertest_1.default)(index_1.default).post('/auth/register').send({ email: `${emailBase}-${i}@t.com`, password: 'abcdef' });
            if (res.status === 429) {
                status429 = true;
                break;
            }
        }
        expect(status429).toBe(true);
    }));
});
