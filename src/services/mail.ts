import nodemailer from 'nodemailer';

// Em desenvolvimento apenas loga no console. Ajustar para SMTP real.
export async function sendPasswordResetEmail(to: string, token: string) {
    // Build deep link to frontend reset route (Expo Web or configured FRONTEND_URL)
    const base = process.env.FRONTEND_URL || 'http://localhost:8081';
    const resetUrl = `${base}/reset?token=${encodeURIComponent(token)}`;
    if (process.env.NODE_ENV !== 'production') {
        console.log('[MAIL:DEV] Enviar link de reset para', to, resetUrl);
        return;
    }
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicaltime.app',
        to,
        subject: 'Recuperação de senha',
        text: `Use este link para redefinir sua senha: ${resetUrl}`,
        html: `<p>Use este link para redefinir sua senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
}
