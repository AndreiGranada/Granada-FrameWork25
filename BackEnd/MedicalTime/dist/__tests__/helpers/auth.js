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
exports.createUserAndToken = createUserAndToken;
exports.registerViaApi = registerViaApi;
const prisma_1 = require("../../src/lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createUserAndToken(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.create({ data: { email, passwordHash: 'dummy-hash', timezone: 'America/Sao_Paulo' } });
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const token = jsonwebtoken_1.default.sign({ sub: user.id }, secret, { expiresIn: '1h' });
        return { user, token };
    });
}
function registerViaApi(app_1, email_1) {
    return __awaiter(this, arguments, void 0, function* (app, email, password = 'secret123') {
        const res = yield app.post('/auth/register').send({ email, password });
        return res.body;
    });
}
