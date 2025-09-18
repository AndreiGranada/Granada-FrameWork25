"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!(auth === null || auth === void 0 ? void 0 : auth.startsWith('Bearer '))) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }
    const token = auth.substring(7);
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!payload.sub) {
            res.status(401).json({ error: 'Token inválido' });
            return;
        }
        req.userId = payload.sub;
        next();
    }
    catch (e) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
