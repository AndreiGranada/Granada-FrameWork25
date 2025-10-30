# Configuração do Mailtrap para Envio de Emails

Este documento explica como configurar o Mailtrap para testes de envio de emails no MedicalTime.

## O que é o Mailtrap?

O Mailtrap é um serviço de teste de email que captura mensagens enviadas em desenvolvimento, permitindo visualizar e testar emails sem enviar para caixas de entrada reais.

## Passos para Configuração

### 1. Criar Conta no Mailtrap

1. Acesse [mailtrap.io](https://mailtrap.io)
2. Crie uma conta gratuita
3. Faça login no painel

### 2. Configurar Inbox de Teste

1. No painel do Mailtrap, acesse "Email Testing"
2. Crie um novo inbox ou use o inbox padrão
3. Clique no inbox criado
4. Na aba "SMTP Settings", selecione "Nodemailer"
5. Copie as credenciais mostradas

### 3. Configurar Variáveis de Ambiente

No arquivo `.env` do backend, configure as seguintes variáveis:

```env
# Configurações Mailtrap SMTP
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="sua-mailtrap-username"
SMTP_PASS="sua-mailtrap-password"
MAIL_FROM="noreply@medicaltime.app"

# Habilitar logs de desenvolvimento
EMAIL_DEV_LOG=true
```

**⚠️ Importante:** Substitua `sua-mailtrap-username` e `sua-mailtrap-password` pelas credenciais reais obtidas no painel do Mailtrap.

### 4. Exemplo de Credenciais Mailtrap

As credenciais do Mailtrap geralmente seguem este formato:

```env
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="a1b2c3d4e5f6g7"
SMTP_PASS="1234567890abcdef"
```

## Testando o Envio

### 1. Via API

Faça uma requisição POST para `/auth/forgot` com um email válido:

```bash
curl -X POST http://localhost:3000/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com"}'
```

### 2. Verificar no Mailtrap

1. Acesse seu inbox no painel do Mailtrap
2. O email de recuperação aparecerá na lista
3. Clique no email para visualizar o conteúdo
4. Teste os links e o layout do email

## Recursos do Mailtrap

### Análise de Email
- **HTML Preview:** Visualização do email renderizado
- **Text Version:** Versão em texto simples
- **Raw:** Código-fonte completo do email
- **Headers:** Cabeçalhos técnicos da mensagem

### Testes de Spam
O Mailtrap inclui análise de spam score para verificar se seus emails podem ser marcados como spam.

### Validação HTML
Verifica se o HTML do email está bem formatado e compatível com diferentes clientes.

## Logs de Desenvolvimento

Com `EMAIL_DEV_LOG=true`, você verá logs detalhados no console:

```
[MAIL:DEV] Enviando email de reset para: usuario@exemplo.com
[MAIL:DEV] URL de reset: http://localhost:8081/reset?token=abc123...
[MAIL:DEV] Token: abc123...
[MAIL:SUCCESS] Email enviado com sucesso!
[MAIL:INFO] Message ID: <message-id@sandbox.mailtrap.io>
```

## Troubleshooting

### Erro de Autenticação
- Verifique se as credenciais SMTP_USER e SMTP_PASS estão corretas
- Certifique-se de que copiou as credenciais do inbox correto

### Email Não Aparece no Mailtrap
- Verifique se está olhando o inbox correto
- Confirme se as variáveis de ambiente estão carregadas
- Verifique os logs do console para erros

### Erro de Conexão
- Confirme se SMTP_HOST e SMTP_PORT estão corretos
- Para Mailtrap, use sempre `sandbox.smtp.mailtrap.io` e porta `2525`

## Próximos Passos

Após configurar o Mailtrap para desenvolvimento, você pode:

1. **Personalizar Templates:** Modificar o HTML dos emails em `src/services/mail.ts`
2. **Adicionar Novos Tipos:** Criar funções para emails de boas-vindas, notificações, etc.
3. **Configurar Produção:** Usar provedores reais como SendGrid, Mailgun, ou SES para produção

## Produção

⚠️ **Nunca use Mailtrap em produção!** O Mailtrap é apenas para desenvolvimento e testes. Para produção, configure um provedor real de email.