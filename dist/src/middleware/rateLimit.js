"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sosLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
function parseDuration(input, defMs) {
    if (!input || input.trim() === '')
        return defMs;
    const s = input.trim().toLowerCase();
    // número puro => ms
    if (/^\d+$/.test(s))
        return Number(s);
    const match = s.match(/^(\d+)(ms|s|m|h)$/);
    if (!match)
        return defMs;
    const val = Number(match[1]);
    const unit = match[2];
    switch (unit) {
        case 'ms': return val;
        case 's': return val * 1000;
        case 'm': return val * 60 * 1000;
        case 'h': return val * 60 * 60 * 1000;
        default: return defMs;
    }
}
const authWindowMs = parseDuration(process.env.RATE_LIMIT_AUTH_WINDOW, 15 * 60 * 1000);
const authMax = Number((_a = process.env.RATE_LIMIT_AUTH_MAX) !== null && _a !== void 0 ? _a : 50);
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: authWindowMs,
    limit: Number.isFinite(authMax) && authMax > 0 ? authMax : 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições de autenticação. Tente novamente mais tarde.' }
});
const sosWindowMs = parseDuration(process.env.RATE_LIMIT_SOS_WINDOW, 10 * 60 * 1000);
const sosMax = Number((_b = process.env.RATE_LIMIT_SOS_MAX) !== null && _b !== void 0 ? _b : 10);
exports.sosLimiter = (0, express_rate_limit_1.default)({
    windowMs: sosWindowMs,
    limit: Number.isFinite(sosMax) && sosMax > 0 ? sosMax : 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições S.O.S. Tente novamente mais tarde.' }
});
