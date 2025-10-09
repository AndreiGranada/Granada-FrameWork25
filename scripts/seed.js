/* eslint-disable no-undef */
// Seed de dados para facilitar testes manuais no FrontEnd.
// Uso (PowerShell):
//   $env:BASE_URL='http://192.168.15.9:3000'; node scripts/seed.js
// ou sem BASE_URL (default): http://localhost:3000

(async () => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const email = process.env.SEED_EMAIL || 'seed.user@medicaltime.local';
    const password = process.env.SEED_PASSWORD || 'secret123';

    function log(title, obj) {
        console.log(`\n=== ${title} ===`);
        try { console.log(JSON.stringify(obj, null, 2)); } catch { console.log(obj); }
    }

    async function http(method, path, body, token) {
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

    async function waitForHealth(timeoutMs = 20000, intervalMs = 500) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const res = await fetch(base + '/health');
                if (res.ok) return true;
            } catch { }
            await new Promise((r) => setTimeout(r, intervalMs));
        }
        throw new Error(`Healthcheck não respondeu em ${timeoutMs}ms (${base}/health)`);
    }

    try {
        await waitForHealth();
        // Tenta registrar; se 409, faz login
        let token;
        try {
            const reg = await http('POST', '/auth/register', { email, password, name: 'Seed User' });
            log('REGISTERED', { user: reg?.user });
            token = reg?.token;
        } catch (e) {
            if (e?.status === 409 || String(e?.data?.error?.message || '').includes('already')) {
                const login = await http('POST', '/auth/login', { email, password });
                log('LOGGED IN', { user: login?.user });
                token = login?.token;
            } else {
                throw e;
            }
        }

        // Cria alguns lembretes com horários (idempotente superficial)
        const names = ['Vitamina D', 'Antibiótico', 'Probiótico'];
        for (const name of names) {
            try {
                const created = await http('POST', '/reminders', {
                    name,
                    schedules: [
                        { ingestionTimeMinutes: 8 * 60, daysOfWeekBitmask: 0 },
                        { ingestionTimeMinutes: 20 * 60, daysOfWeekBitmask: 0 },
                    ],
                }, token);
                log('REMINDER CREATED', { id: created.id, name: created.name });
            } catch (e) {
                // Pode falhar por duplicidade; apenas segue
                log('REMINDER CREATE SKIPPED', { name, reason: e.message });
            }
        }

        const reminders = await http('GET', '/reminders', undefined, token);
        log('REMINDERS', { count: reminders?.length || 0 });

        // Intakes próximos 24h
        const intakes = await http('GET', '/intakes?hours=24', undefined, token);
        log('INTAKES 24H', { count: Array.isArray(intakes) ? intakes.length : 0 });

        // Dispositivo (ignora 409)
        try {
            const device = await http('POST', '/devices', {
                platform: 'ANDROID',
                pushToken: `ExponentPushToken[seed-${Date.now()}]`,
            }, token);
            log('DEVICE', device);
        } catch (e) {
            log('DEVICE SKIPPED', e.message);
        }

        // Contatos de emergência: cria 5 ativos + 1 inativo
        const contacts = [
            { name: 'Contato 1', phone: '+551199999001', customMessage: 'Ajude-me por favor (1)', isActive: true },
            { name: 'Contato 2', phone: '+551199999002', customMessage: 'Ajude-me por favor (2)', isActive: true },
            { name: 'Contato 3', phone: '+551199999003', customMessage: null, isActive: true },
            { name: 'Contato 4', phone: '+551199999004', customMessage: null, isActive: true },
            { name: 'Contato 5', phone: '+551199999005', customMessage: null, isActive: true },
            { name: 'Contato 6', phone: '+551199999006', customMessage: null, isActive: false },
        ];
        for (const c of contacts) {
            try {
                await http('POST', '/emergency/emergency-contacts', c, token);
            } catch (e) {
                // duplicados ou validações, seguir
            }
        }
        const ecs = await http('GET', '/emergency/emergency-contacts', undefined, token);
        log('EMERGENCY CONTACTS', { count: ecs?.length || 0, active: ecs?.filter((x) => x.isActive)?.length || 0 });

        // SOS (pode ser rate-limited)
        try {
            const sos = await http('POST', '/emergency/sos', { message: 'SOS seed check' }, token);
            log('SOS', sos);
        } catch (e) {
            log('SOS SKIPPED', e.message);
        }

        console.log(`\nSeed concluído. Credenciais de teste:\n  email: ${email}\n  senha: ${password}`);
    } catch (e) {
        console.error('Seed falhou:', e?.message || e);
        process.exitCode = 1;
    }
})();
