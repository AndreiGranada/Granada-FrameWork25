#!/usr/bin/env node

// Script para testar o envio de email de recuperação de senha
// Execute: npm run test:email

const path = require('path');
// Forçar override das variáveis para refletir mudanças recentes no .env
require('dotenv').config({ override: true });
require('ts-node/register');

// Importar o módulo TypeScript
const { sendPasswordResetEmail } = require('../src/services/mail.ts');

async function testEmail() {
    console.log('🧪 Testando envio de email de recuperação...\n');
    console.log('📂 CWD:', process.cwd());
    console.log('📄 .env carregado (override=true)');
    
    // Verificar configurações
    console.log('📧 Configurações SMTP:');
    console.log(`Host: ${process.env.SMTP_HOST || 'NÃO DEFINIDO'}`);
    console.log(`Port: ${process.env.SMTP_PORT || 'NÃO DEFINIDO'}`);
    console.log(`User: ${process.env.SMTP_USER || 'NÃO DEFINIDO'}`);
    console.log(`Pass: ${process.env.SMTP_PASS ? '***' : 'NÃO DEFINIDO'}`);
    console.log(`From: ${process.env.MAIL_FROM || 'NÃO DEFINIDO'}`);
    console.log(`Dev Log: ${process.env.EMAIL_DEV_LOG || 'false'}\n`);
    
    // Email de teste
    const testEmail = 'test@exemplo.com';
    const testToken = 'test-token-' + Math.random().toString(36).substring(7);
    
    try {
        console.log(`📨 Enviando email de teste para: ${testEmail}`);
        console.log(`🔑 Token de teste: ${testToken}\n`);
        
        await sendPasswordResetEmail(testEmail, testToken);
        
        console.log('✅ Email enviado com sucesso!');
        
        if (process.env.SMTP_HOST === 'sandbox.smtp.mailtrap.io') {
            console.log('\n📮 Mailtrap detectado!');
            console.log('👀 Verifique seu inbox no painel do Mailtrap:');
            console.log('🌐 https://mailtrap.io/inboxes');
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error.message);
        
        if (error.message.includes('auth')) {
            console.log('\n💡 Dicas para resolver erro de autenticação:');
            console.log('• Verifique se SMTP_USER e SMTP_PASS estão corretos');
            console.log('• Para Mailtrap, use as credenciais do inbox específico');
            console.log('• Certifique-se de que as variáveis estão no .env');
        }
        
        if (error.message.includes('connect')) {
            console.log('\n💡 Dicas para resolver erro de conexão:');
            console.log('• Verifique se SMTP_HOST e SMTP_PORT estão corretos');
            console.log('• Para Mailtrap: sandbox.smtp.mailtrap.io:2525');
            console.log('• Verifique sua conexão com a internet');
        }
    }
}

// Executar teste
testEmail().catch(console.error);