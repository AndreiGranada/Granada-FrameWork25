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
const auth_1 = require("../middleware/auth");
const errors_1 = require("../lib/errors");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
// GET /me - retorna dados públicos do usuário autenticado
router.get('/', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId)
            return errors_1.errorHelpers.unauthorized(res);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, timezone: true } });
        if (!user)
            return errors_1.errorHelpers.notFound(res, 'Usuário não encontrado');
        res.json({ user });
    }
    catch (e) {
        console.error(e);
        errors_1.errorHelpers.internal(res);
    }
}));
exports.default = router;
// PATCH /me - atualizar perfil / trocar senha
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    timezone: zod_1.z.string().min(1).max(60).optional(),
    passwordCurrent: zod_1.z.string().min(6).optional(),
    passwordNew: zod_1.z.string().min(6).optional()
}).refine(d => !!(d.name || d.timezone || (d.passwordCurrent && d.passwordNew)), {
    message: 'Enviar ao menos um campo (name, timezone ou passwordCurrent+passwordNew)'
}).refine(d => {
    if (d.passwordCurrent || d.passwordNew) {
        return !!(d.passwordCurrent && d.passwordNew);
    }
    return true;
}, { message: 'Para trocar a senha envie passwordCurrent e passwordNew' });
router.patch('/', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId)
            return errors_1.errorHelpers.unauthorized(res);
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success)
            return errors_1.errorHelpers.badRequest(res, 'Falha de validação', (0, errors_1.mapZodError)(parsed.error));
        const { name, timezone, passwordCurrent, passwordNew } = parsed.data;
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            return errors_1.errorHelpers.notFound(res, 'Usuário não encontrado');
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (timezone !== undefined)
            data.timezone = timezone;
        if (passwordCurrent || passwordNew) {
            const ok = yield bcrypt_1.default.compare(passwordCurrent || '', user.passwordHash);
            if (!ok)
                return errors_1.errorHelpers.conflict(res, 'Senha atual incorreta');
            const hash = yield bcrypt_1.default.hash(passwordNew, 10);
            data.passwordHash = hash;
        }
        const updated = yield prisma_1.prisma.user.update({
            where: { id: user.id },
            data,
            select: { id: true, email: true, name: true, timezone: true }
        });
        res.json({ user: updated });
    }
    catch (e) {
        console.error(e);
        errors_1.errorHelpers.internal(res);
    }
}));
