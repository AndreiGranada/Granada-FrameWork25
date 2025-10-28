#!/usr/bin/env node
// Envia e-mail via rota /dev/test-mail usando fetch (Node 18+)
// Uso: node scripts/send-mail-via-route.js <destinatario>

const [, , toArg] = process.argv;
if (!toArg) {
  console.error('Uso: node scripts/send-mail-via-route.js <email-destino>');
  process.exit(1);
}

const BASE = process.env.API_BASE || 'http://localhost:3000';
const EMAIL = toArg;

function randEmail() {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `dev${ts}@test.com`;
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.res = res; err.body = json; throw err;
  }
  return json;
}

(async () => {
  try {
    // Registrar usuário de teste (ou logar se já existir)
    const email = randEmail();
    const password = 'Teste123!';
    let token;
    try {
      const reg = await post('/auth/register', { email, password });
      token = reg.token;
      console.log('Registrado:', email);
    } catch (e) {
      if (e.res && e.res.status === 409) {
        const login = await post('/auth/login', { email, password });
        token = login.token;
        console.log('Login com usuário existente:', email);
      } else {
        throw e;
      }
    }
    if (!token) throw new Error('Falha ao obter token');

    // Enviar e-mail de teste
    const payload = {
      to: EMAIL,
      subject: 'Teste Mailtrap - MedicalTime',
      text: 'Olá! Este é um e-mail de teste enviado pela rota /dev/test-mail. Se você recebeu, o Mailtrap/SMTP está configurado corretamente.'
    };
    const sendRes = await post('/dev/test-mail', payload, token);
    console.log('Resposta /dev/test-mail:', sendRes);
  } catch (err) {
    console.error('Falha:', err.message);
    if (err.body) console.error('Corpo:', err.body);
    process.exit(1);
  }
})();
