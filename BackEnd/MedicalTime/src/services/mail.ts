import nodemailer from 'nodemailer';

// Configuração do transporter SMTP (Mailtrap ou outros provedores)
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false, // true para porta 465, false para outras portas
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // Configurações adicionais para Mailtrap
        tls: {
            ciphers: 'SSLv3'
        }
    });
}

export async function sendPasswordResetEmail(to: string, token: string) {
    // Agora o e-mail envia APENAS o token (sem link)
    // O usuário deve copiar o token e colá-lo na tela "/reset" do aplicativo/web.

    // Log para desenvolvimento
    if (process.env.EMAIL_DEV_LOG === 'true') {
        console.log('[MAIL:DEV] Enviando email de reset para:', to);
        console.log('[MAIL:DEV] Token:', token);
    }

    // Se não há configurações SMTP, apenas loga (modo desenvolvimento)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[MAIL:STUB] Configurações SMTP não definidas. Email não enviado.');
        console.log('[MAIL:STUB] Para:', to);
        console.log('[MAIL:STUB] Token:', token);
        return;
    }

    try {
        const transporter = createTransporter();
        
        // Template HTML: somente token + instruções
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Recuperação de Senha - MedicalTime</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .tokenBox {
                        background:#fff;
                        border:1px solid #ddd;
                        border-radius:6px;
                        padding:16px;
                        font-size:18px;
                        letter-spacing:1px;
                        font-weight:bold;
                        text-align:center;
                        color:#0b5ed7;
                        word-break: break-all;
                    }
                    .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MedicalTime</h1>
                        <p>Recuperação de Senha</p>
                    </div>
                    <div class="content">
                        <h2>Solicitação de Nova Senha</h2>
                        <p>Você solicitou a recuperação da sua senha.</p>
                        <p>Utilize o <strong>token</strong> abaixo na tela de <em>Redefinir senha</em> do aplicativo ou web:</p>
                        <div class="tokenBox">${token}</div>
                        <p style="margin-top:16px"><strong>Importante:</strong></p>
                        <ul>
                            <li>Este token é válido por 30 minutos</li>
                            <li>Se você não solicitou esta recuperação, ignore este email</li>
                            <li>Por segurança, não compartilhe este token</li>
                        </ul>
                        <p>Dica: abra o app, acesse <em>Esqueci minha senha</em> e cole o token no campo indicado.</p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático, não responda a esta mensagem.</p>
                        <p>&copy; ${new Date().getFullYear()} MedicalTime. Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.MAIL_FROM || 'noreply@medicaltime.app',
            to,
            subject: 'Recuperação de senha - MedicalTime',
            text: `
Olá!

Você solicitou a recuperação da sua senha no MedicalTime.

Use o TOKEN abaixo na tela de Redefinição de Senha do aplicativo/web:
${token}

IMPORTANTE:
- Este token é válido por 30 minutos
- Se você não solicitou esta recuperação, ignore este email
- Por segurança, não compartilhe este token

Atenciosamente,
Equipe MedicalTime
            `,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.EMAIL_DEV_LOG === 'true') {
            console.log('[MAIL:SUCCESS] Email enviado com sucesso!');
            console.log('[MAIL:INFO] Message ID:', info.messageId);
            // Preview URL está disponível apenas com Ethereal Email (desenvolvimento)
            if (process.env.SMTP_HOST?.includes('ethereal.email') && (info as any).preview) {
                console.log('[MAIL:PREVIEW] Preview URL:', (info as any).preview);
            }
        }
        
        return info;
    } catch (error) {
        console.error('[MAIL:ERROR] Erro ao enviar email:', error);
        throw new Error('Falha ao enviar email de recuperação');
    }
}

// Envio genérico de e-mail via SMTP (Mailtrap em desenvolvimento)
export async function sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}) {
    const { to, subject, text, html } = params;

    if (process.env.EMAIL_DEV_LOG === 'true') {
        console.log('[MAIL:DEV] Enviando email genérico para:', to);
        console.log('[MAIL:DEV] Assunto:', subject);
        if (text) console.log('[MAIL:DEV] Texto:', text.slice(0, 200));
        if (html) console.log('[MAIL:DEV] HTML length:', html.length);
    }

    // Se não há configurações SMTP, apenas loga (modo desenvolvimento)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[MAIL:STUB] SMTP não configurado. Email não enviado.');
        console.log('[MAIL:STUB] Para:', to);
        console.log('[MAIL:STUB] Assunto:', subject);
        return;
    }

    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: params.from || process.env.MAIL_FROM || 'noreply@medicaltime.app',
            to,
            subject,
            text,
            html
        });
        if (process.env.EMAIL_DEV_LOG === 'true') {
            console.log('[MAIL:SUCCESS] Email enviado com sucesso!');
            console.log('[MAIL:INFO] Message ID:', info.messageId);
        }
        return info;
    } catch (error) {
        console.error('[MAIL:ERROR] Erro ao enviar email genérico:', error);
        throw new Error('Falha ao enviar email');
    }
}
