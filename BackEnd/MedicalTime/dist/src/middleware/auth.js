"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../lib/errors");
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!(auth === null || auth === void 0 ? void 0 : auth.startsWith('Bearer ')))
        return errors_1.errorHelpers.unauthorized(res);
    const token = auth.substring(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!payload.sub)
            return errors_1.errorHelpers.unauthorized(res, 'Token inválido');
        req.userId = payload.sub;
        next();
    }
    catch (e) {
        errors_1.errorHelpers.unauthorized(res, 'Token inválido ou expirado');
    }
}
