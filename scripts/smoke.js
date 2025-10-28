// Smoke test simples da API local em http://localhost:3000
// Executa: registro/login, cria lembrete, lista intakes e marca taken, registra/lista device,
// cria/lista contato de emergência e dispara SOS. Imprime os payloads.

(async () => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const email = `smoke+${Date.now()}@test.local`;
    const password = 'secret123';
    const pushToken = `ExponentPushToken[invalid-${Date.now()}]`;

    function log(title, obj) {
        console.log(`\n=== ${title} ===`);
        try { console.log(JSON.stringify(obj, null, 2)); } catch { console.log(obj); }
    }

    async function http(method, path, body, token) {
        const res = await fetch(base + path, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const txt = await res.text();
        let data;
        try { data = txt ? JSON.parse(txt) : undefined; } catch { data = txt; }
        if (!res.ok) {
            throw new Error(`${method} ${path} -> ${res.status}: ${txt}`);
        }
        return data;
    }

    async function waitForHealth(timeoutMs = 15000, intervalMs = 500) {
        const deadline = Date.now() + timeoutMs;
        let lastErr;
        while (Date.now() < deadline) {
            try {
                const res = await fetch(base + '/health');
                if (res.ok) return true;
            } catch (e) { lastErr = e; }
            await new Promise(r => setTimeout(r, intervalMs));
        }
        throw new Error(`Healthcheck não respondeu dentro de ${timeoutMs}ms: ${lastErr?.message || lastErr}`);
    }

    try {
        // Aguarda /health ficar disponível (até 15s)
        await waitForHealth();
        // Register
        const reg = await http('POST', '/auth/register', { email, password, name: 'Smoke User' });
        log('REGISTER', reg);
        const token = reg.token;

        // Create reminder
        const reminder = await http('POST', '/reminders', {
            name: 'Vitamina D',
            schedules: [{ ingestionTimeMinutes: 480, daysOfWeekBitmask: 0 }]
        }, token);
        log('REMINDER', reminder);

        // List intakes 24h
        const intakes = await http('GET', '/intakes?hours=24', undefined, token);
        log('INTAKES COUNT', { count: Array.isArray(intakes) ? intakes.length : 0 });
        if (Array.isArray(intakes) && intakes.length > 0) {
            const iid = intakes[0].id;
            const taken = await http('POST', `/intakes/${iid}/taken`, undefined, token);
            log('TAKEN', taken);
        } else {
            log('TAKEN', { skipped: true, reason: 'no events in next 24h' });
        }

        // Register device
        let device;
        try {
            device = await http('POST', '/devices', { platform: 'ANDROID', pushToken }, token);
            log('DEVICE CREATED', device);
        } catch (e) {
            // Se já existir associado a outro usuário, apenas siga listando
            log('DEVICE CREATED', { skipped: true, reason: e.message });
        }
        // List devices
        const devices = await http('GET', '/devices', undefined, token);
        log('DEVICES', devices);

        // Emergency contact
        const ec = await http('POST', '/emergency/emergency-contacts', { name: 'Contato Smoke', phone: '+5511999999999', priority: 0 }, token);
        log('EMERGENCY CREATED', ec);
        const ecs = await http('GET', '/emergency/emergency-contacts', undefined, token);
        log('EMERGENCY LIST', ecs);

        // SOS
        const sos = await http('POST', '/emergency/sos', { message: 'SOS smoke test' }, token);
        log('SOS', sos);

        console.log('\nSmoke test concluído com sucesso.');
    } catch (e) {
        console.error('Smoke test falhou:', e.message || e);
        process.exitCode = 1;
    }
})();
