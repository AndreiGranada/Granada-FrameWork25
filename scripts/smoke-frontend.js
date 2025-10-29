/* eslint-env node */
// Smoke test do FrontEnd (Node) para validar integração com o backend usando a mesma base URL do app.
// Uso (PowerShell):
//   cd FrontEnd/my-app
//   npm run smoke:frontend

const fs = require('fs');
const path = require('path');

function readFrontendEnv(projectRoot) {
    const envPath = path.join(projectRoot, '.env');
    if (!fs.existsSync(envPath)) return {};
    const raw = fs.readFileSync(envPath, 'utf8');
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        out[k] = v;
    }
    return out;
}

async function http(base, method, path, body, token) {
    const res = await fetch(base + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let data;
    try { data = txt ? JSON.parse(txt) : undefined; } catch { data = txt; }
    if (!res.ok) {
        const msg = data?.error?.message || txt || `${res.status}`;
        const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

async function waitForHealth(base, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    let lastErr;
    while (Date.now() < deadline) {
        try {
            const r = await fetch(base + '/health');
            if (r.ok) return true;
        } catch (e) { lastErr = e; }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Healthcheck falhou em ${timeoutMs}ms: ${lastErr?.message || lastErr}`);
}

(async () => {
    const projectRoot = process.cwd();
    const env = readFrontendEnv(projectRoot);
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    let email = process.env.SMOKE_EMAIL || 'seed.user@medicaltime.local';
    const password = process.env.SMOKE_PASSWORD || 'secret123';
    const autoRegister = (process.env.SMOKE_AUTO_REGISTER || 'true').toLowerCase() !== 'false';

    function log(title, obj) {
        console.log(`\n=== ${title} ===`);
        try { console.log(JSON.stringify(obj, null, 2)); } catch { console.log(obj); }
    }

    try {
        await waitForHealth(base);
        // Login (usa usuário do seed por padrão). Se 401 e autoRegister habilitado, registra usuário temporário.
        let token;
        try {
            const login = await http(base, 'POST', '/auth/login', { email, password });
            log('LOGIN', { user: login?.user?.email });
            token = login.token;
        } catch (e) {
            if (e.status === 401 && autoRegister) {
                // Gera e-mail descartável e registra
                const rand = Math.random().toString(36).slice(2, 8);
                email = `smoke_${Date.now()}_${rand}@medicaltime.local`;
                const reg = await http(base, 'POST', '/auth/register', { email, password, name: 'Smoke Bot' });
                log('REGISTER (FALLBACK)', { user: reg?.user?.email });
                token = reg.token;
            } else {
                throw e;
            }
        }

        // /me
        const me = await http(base, 'GET', '/me', undefined, token);
        log('ME', me);

        // Reminders
        const reminders = await http(base, 'GET', '/reminders', undefined, token);
        log('REMINDERS COUNT', { count: reminders?.length || 0 });

        // Intakes próximas 24h
        const intakes = await http(base, 'GET', '/intakes?hours=24', undefined, token);
        log('INTAKES 24H', { count: Array.isArray(intakes) ? intakes.length : 0 });

        // Emergency contacts
        const ecs = await http(base, 'GET', '/emergency/emergency-contacts', undefined, token);
        log('EMERGENCY CONTACTS', { count: ecs?.length || 0, active: ecs?.filter((x) => x.isActive)?.length || 0 });

        // SOS (pode cair em rate limit dependendo da config)
        try {
            const sos = await http(base, 'POST', '/emergency/sos', { message: 'SOS smoke frontend' }, token);
            log('SOS', sos);
        } catch (e) {
            log('SOS ERROR', { status: e.status, message: e.message, retryAfter: e?.data?.error?.details?.retryAfterSeconds });
        }

        console.log('\nSmoke FrontEnd OK');
    } catch (e) {
        console.error('Smoke FrontEnd falhou:', e?.message || e);
        process.exitCode = 1;
    }
})();
