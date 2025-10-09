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
exports.issueRefreshToken = issueRefreshToken;
exports.sha256 = sha256;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeAllUserRefreshTokens = revokeAllUserRefreshTokens;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
// Gera token raw + persist hash (SHA-256) com expiração configurável
function issueRefreshToken(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, ttlDays = 30) {
        const raw = crypto_1.default.randomBytes(48).toString('hex');
        const tokenHash = sha256(raw);
        const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
        yield prisma_1.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt }
        });
        return { refreshToken: raw, expiresAt };
    });
}
function sha256(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex');
}
// Valida, verifica expiração e rotação opcional
function rotateRefreshToken(oldTokenRaw_1) {
    return __awaiter(this, arguments, void 0, function* (oldTokenRaw, ttlDays = 30) {
        const hash = sha256(oldTokenRaw);
        const existing = yield prisma_1.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
        if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
            return null; // inválido ou expirado
        }
        // revogar antigo e emitir novo atomicamente
        const newRaw = crypto_1.default.randomBytes(48).toString('hex');
        const newHash = sha256(newRaw);
        const newExpires = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
        yield prisma_1.prisma.$transaction([
            prisma_1.prisma.refreshToken.update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } }),
            prisma_1.prisma.refreshToken.create({ data: { userId: existing.userId, tokenHash: newHash, expiresAt: newExpires } })
        ]);
        return { userId: existing.userId, refreshToken: newRaw, expiresAt: newExpires };
    });
}
function revokeAllUserRefreshTokens(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
}
