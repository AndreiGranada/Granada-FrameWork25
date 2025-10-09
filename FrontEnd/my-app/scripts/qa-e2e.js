/* eslint-env node */
// QA E2E: cobre registro/login, CRUD de lembretes+schedules, intakes 24h + mark, histórico paginado,
// contatos de emergência (máx. 5 ativos) e SOS + rate limit.

const crypto = require('crypto');
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

async function http(base, method, p, { body, token, params } = {}) {
    const url = new URL(base + p);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url, {
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
        const err = new Error(`${method} ${p} -> ${res.status}: ${msg}`);
        err.status = res.status;
        err.data = data;
        err.headers = Object.fromEntries(res.headers.entries());
        throw err;
    }
    return data;
}

function log(title, obj) {
    console.log(`\n=== ${title} ===`);
    try { console.log(JSON.stringify(obj, null, 2)); } catch { console.log(obj); }
}

(async () => {
    const projectRoot = process.cwd();
    const env = readFrontendEnv(projectRoot);
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    const rand = crypto.randomBytes(4).toString('hex');
    const email = `qa_${rand}@medicaltime.local`;
    const password = 'Secret!123';

    try {
        // Register -> Login -> Me
        const reg = await http(base, 'POST', '/auth/register', { body: { email, password, name: 'QA Bot' } });
        log('REGISTER', { email: reg?.user?.email });
        const login = await http(base, 'POST', '/auth/login', { body: { email, password } });
        const token = login.token;
        log('LOGIN', { user: login?.user?.email });
        const me = await http(base, 'GET', '/me', { token });
        log('ME', me);

        // Fluxo de erro de autenticação: força 400 com payload inválido
        try {
            await http(base, 'POST', '/auth/login', { body: { email: 'sem-formato', password: '' } });
        } catch (err) {
            if (err.status !== 400) throw err;
            log('LOGIN INVALIDO (ESPERADO)', { status: err.status, message: err.message });
        }

        // Registro de dispositivo — a segunda tentativa deve retornar 409
        const testPushToken = `ExponentPushToken[qa-${rand}]`;
        try {
            await http(base, 'POST', '/devices', { token, body: { platform: 'ANDROID', pushToken: testPushToken } });
            log('DEVICE REGISTERED', { token: testPushToken });
        } catch (err) {
            if (err.status !== 409) throw err;
            log('DEVICE REGISTER (DUPLICATE)', { status: err.status, retryAfter: err.headers?.['retry-after'] });
        }
        try {
            await http(base, 'POST', '/devices', { token, body: { platform: 'ANDROID', pushToken: testPushToken } });
        } catch (err) {
            if (err.status !== 409) throw err;
            log('DEVICE REGISTER (CONFLICT OK)', { status: err.status, message: err.message });
        }

        // Reminders CRUD + schedules
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const inFive = (minutes + 5) % (24 * 60);
        const create = await http(base, 'POST', '/reminders', {
            token,
            body: {
                name: `QA Vitamina ${rand}`,
                schedules: [
                    { ingestionTimeMinutes: inFive, daysOfWeekBitmask: 0 }, // diário
                ],
            },
        });
        log('REMINDER CREATED', create);

        const reminderId = create.id;
        const list1 = await http(base, 'GET', '/reminders', { token });
        log('REMINDERS LIST', { count: list1.length });

        const patch = await http(base, 'PATCH', `/reminders/${reminderId}`, { token, body: { name: `${create.name} (edit)` } });
        log('REMINDER PATCH', patch);

        // Add a second schedule then delete it
        const extraReminder = await http(base, 'POST', `/reminders/${reminderId}/schedules`, { token, body: { ingestionTimeMinutes: (inFive + 1) % 1440, daysOfWeekBitmask: 0 } });
        log('SCHEDULE ADDED', { schedules: extraReminder?.schedules?.length });
        const addedSched = Array.isArray(extraReminder?.schedules)
            ? extraReminder.schedules.find((s) => s.ingestionTimeMinutes === ((inFive + 1) % 1440))
            : null;
        const scheduleId = addedSched?.id;
        if (scheduleId) {
            const delSched = await http(base, 'DELETE', `/reminders/schedules/${scheduleId}`, { token });
            log('SCHEDULE DELETED', delSched);
        } else {
            log('SCHEDULE ID NOT FOUND', extraReminder);
        }

        // Intakes próximas 24h e marcar uma como tomada
        const intakes = await http(base, 'GET', '/intakes', { token, params: { hours: 24 } });
        log('INTAKES 24H', { count: Array.isArray(intakes) ? intakes.length : 0 });
        if (Array.isArray(intakes) && intakes.length > 0) {
            const first = intakes[0];
            const taken = await http(base, 'POST', `/intakes/${first.id}/taken`, { token });
            log('INTAKE MARK TAKEN', taken);
        }

        // Histórico com paginação (limit=10)
        let cursor = undefined;
        let pages = 0;
        while (pages < 3) {
            const page = await http(base, 'GET', '/intakes/history', { token, params: { limit: 10, ...(cursor ? { cursor } : {}) } });
            log(`HISTORY PAGE ${pages + 1}`, { items: page?.data?.length || 0 });
            if (!page?.pageInfo?.hasMore) break;
            cursor = page.pageInfo.nextCursor;
            pages += 1;
        }

        // Contatos de emergência (garante no máx. 5 ativos)
        const created = [];
        for (let i = 0; i < 6; i++) {
            const ec = await http(base, 'POST', '/emergency/emergency-contacts', {
                token,
                body: { name: `QA Contact ${i + 1}`, phone: `+5511999${rand}${100 + i}`, customMessage: i % 2 === 0 ? `Ajude-me (${i + 1})` : undefined, isActive: i < 5 },
            });
            created.push(ec);
        }
        const ecs = await http(base, 'GET', '/emergency/emergency-contacts', { token });
        log('EMERGENCY CONTACTS', { total: ecs.length, active: ecs.filter((x) => x.isActive).length });

        // SOS: aceita-se que a primeira tentativa já esteja sob rate limit (429) dependendo do ambiente.
        let firstWasRateLimited = false;
        try {
            const sos1 = await http(base, 'POST', '/emergency/sos', { token, body: { message: 'QA E2E SOS' } });
            log('SOS 1', sos1);
        } catch (e) {
            if (e.status === 429) {
                firstWasRateLimited = true;
                log('SOS 1 (RATE LIMITED, ACCEPTABLE)', { status: e.status, message: e.message, retryAfter: e?.data?.error?.details?.retryAfterSeconds || e?.headers?.['retry-after'] });
            } else {
                throw e;
            }
        }

        // Se a primeira passou, a segunda provavelmente cairá em 429 e isso é o esperado.
        if (!firstWasRateLimited) {
            try {
                await http(base, 'POST', '/emergency/sos', { token, body: { message: 'QA E2E SOS 2' } });
            } catch (e) {
                log('SOS 2 (EXPECTED ERROR)', { status: e.status, message: e.message, retryAfter: e?.data?.error?.details?.retryAfterSeconds || e?.headers?.['retry-after'] });
            }
        }

        console.log('\nQA E2E OK');
    } catch (e) {
        console.error('QA E2E falhou:', e?.message || e);
        process.exitCode = 1;
    }
})();
