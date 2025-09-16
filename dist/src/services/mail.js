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
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Em desenvolvimento apenas loga no console. Ajustar para SMTP real.
function sendPasswordResetEmail(to, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        if (process.env.NODE_ENV !== 'production') {
            console.log('[MAIL:DEV] Enviar link de reset para', to, resetUrl);
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        yield transporter.sendMail({
            from: process.env.MAIL_FROM || 'no-reply@medicaltime.app',
            to,
            subject: 'Recuperação de senha',
            text: `Use este link para redefinir sua senha: ${resetUrl}`,
            html: `<p>Use este link para redefinir sua senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
        });
    });
}
