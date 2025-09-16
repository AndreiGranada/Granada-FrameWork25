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
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const mail_1 = require("../services/mail");
const date_fns_1 = require("date-fns");
const rateLimit_1 = require("../middleware/rateLimit");
const refreshToken_1 = require("../services/refreshToken");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).max(100)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).max(100)
});
const forgotSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const resetSchema = zod_1.z.object({ token: zod_1.z.string().min(10), password: zod_1.z.string().min(6).max(100) });
function signToken(userId) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jsonwebtoken_1.default.sign({ sub: userId }, secret, { expiresIn: '1h' });
}
router.post('/register', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = registerSchema.parse(req.body);
        const existing = yield prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            res.status(409).json({ error: 'E-mail já cadastrado' });
            return;
        }
        const passwordHash = yield bcrypt_1.default.hash(data.password, 10);
        const user = yield prisma_1.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash
            }
        });
        const token = signToken(user.id);
        const { refreshToken, expiresAt } = yield (0, refreshToken_1.issueRefreshToken)(user.id);
        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token, refreshToken, refreshExpiresAt: expiresAt });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
router.post('/login', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = loginSchema.parse(req.body);
        const user = yield prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }
        const ok = yield bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!ok) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }
        const token = signToken(user.id);
        yield prisma_1.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const { refreshToken, expiresAt } = yield (0, refreshToken_1.issueRefreshToken)(user.id);
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token, refreshToken, refreshExpiresAt: expiresAt });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
router.post('/forgot', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = forgotSchema.parse(req.body);
        const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Resposta genérica para não revelar existência
            res.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = (0, date_fns_1.addMinutes)(new Date(), 30);
        yield prisma_1.prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt }
        });
        yield (0, mail_1.sendPasswordResetEmail)(user.email, token);
        res.json({ message: 'Se o e-mail existir, enviaremos instruções.' });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
router.post('/reset', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = resetSchema.parse(req.body);
        const prt = yield prisma_1.prisma.passwordResetToken.findUnique({ where: { token } });
        if (!prt || prt.usedAt || (0, date_fns_1.isBefore)(prt.expiresAt, new Date())) {
            res.status(400).json({ error: 'Token inválido ou expirado' });
            return;
        }
        const passwordHash = yield bcrypt_1.default.hash(password, 10);
        yield prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({ where: { id: prt.userId }, data: { passwordHash } }),
            prisma_1.prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } })
        ]);
        res.json({ message: 'Senha redefinida com sucesso' });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Refresh de token de acesso usando token de refresh rotacionado
const refreshSchema = zod_1.z.object({ refreshToken: zod_1.z.string().min(10) });
router.post('/refresh', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const rotated = yield (0, refreshToken_1.rotateRefreshToken)(refreshToken);
        if (!rotated) {
            res.status(401).json({ error: 'Refresh token inválido' });
            return;
        }
        const accessToken = signToken(rotated.userId);
        res.json({ token: accessToken, refreshToken: rotated.refreshToken, refreshExpiresAt: rotated.expiresAt });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dados inválidos', issues: err.flatten() });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// Logout global (revoga todos os refresh tokens do usuário autenticado)
router.post('/logout', rateLimit_1.authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'dev-secret');
            yield (0, refreshToken_1.revokeAllUserRefreshTokens)(payload.sub);
            res.json({ message: 'Logout efetuado' });
        }
        catch (_a) {
            res.status(401).json({ error: 'Token inválido' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
exports.default = router;
