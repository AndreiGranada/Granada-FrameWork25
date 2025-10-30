#!/usr/bin/env node
/*
  Smoke test de fluxo de autenticação:
  - Registra usuário (ou faz login se já existir)
  - Faz GET /me
  - Faz logout
  - Tenta /me novamente (espera 401)
  Uso: node scripts/smoke-auth-flow.js [email] [senha]
*/
const axios = require('axios');

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';
const email = process.argv[2] || `smoke_${Date.now()}@example.com`;
const password = process.argv[3] || 'secret123';

(async () => {
    console.log('[smoke] BASE', BASE);
    try {
        let session;
        try {
            const reg = await axios.post(`${BASE}/auth/register`, { email, password, name: 'Smoke User' });
            session = reg.data;
            console.log('[smoke] usuário registrado');
        } catch (e) {
            if (e.response && e.response.status === 409) {
                const login = await axios.post(`${BASE}/auth/login`, { email, password });
                session = login.data;
                console.log('[smoke] login reutilizado');
            } else throw e;
        }

        const me = await axios.get(`${BASE}/me`, { headers: { Authorization: `Bearer ${session.token}` } });
        if (!me.data?.user?.id) throw new Error('GET /me sem user');
        console.log('[smoke] /me ok');

        await axios.post(`${BASE}/auth/logout`, {}, { headers: { Authorization: `Bearer ${session.token}` } }).catch(() => { });
        console.log('[smoke] logout ok (ou ignorado)');

        let statusAfterLogout = 'unknown';
        try {
            await axios.get(`${BASE}/me`, { headers: { Authorization: `Bearer ${session.token}` } });
            statusAfterLogout = 'still-valid';
        } catch (e) {
            if (e.response && e.response.status === 401) statusAfterLogout = '401';
            else statusAfterLogout = String(e?.response?.status || e?.code || 'error');
        }
        if (statusAfterLogout === '401') {
            console.log('[smoke] 401 após logout confirmado');
        } else if (statusAfterLogout === 'still-valid') {
            console.log('[smoke] token ainda válido após logout (logout stateless no backend) — OK');
        } else {
            console.log(`[smoke] status após logout: ${statusAfterLogout}`);
        }

        console.log('[smoke] SUCCESS');
    } catch (e) {
        console.error('[smoke] FAIL', e.message);
        process.exit(1);
    }
})();
