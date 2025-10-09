/* eslint-env node */
/* eslint-disable no-undef */
// Atualiza BackEnd/MedicalTime/.env com FRONTEND_URL, FRONTEND_URLS e CORS_ORIGINS contendo múltiplas portas
// Uso: node ./scripts/sync-backend-frontend-url.js [host|auto] [portA] [portB] [...]

const fs = require('fs');
const path = require('path');
const os = require('os');

const projectRoot = path.resolve(__dirname, '..');
const backendEnvPath = path.resolve(projectRoot, '..', '..', 'BackEnd', 'MedicalTime', '.env');

function parseDotEnv(raw) {
    const out = {};
    raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    });
    return out;
}

function updateEnvContent(raw, updates) {
    const lines = raw.split(/\r?\n/);
    const keys = Object.keys(updates);
    const seen = new Set();
    const newLines = lines.map((line) => {
        const idx = line.indexOf('=');
        if (idx === -1) return line;
        const key = line.slice(0, idx).trim();
        if (keys.includes(key)) {
            seen.add(key);
            return `${key}="${updates[key]}"`;
        }
        return line;
    });
    // Add missing keys at the end
    keys.forEach((k) => {
        if (!seen.has(k)) newLines.push(`${k}="${updates[k]}"`);
    });
    return newLines.join('\n');
}

function parseList(values) {
    const arr = Array.isArray(values) ? values : [values];
    const seen = new Set();
    const result = [];
    for (const item of arr) {
        if (!item) continue;
        String(item)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .forEach((val) => {
                if (!seen.has(val)) {
                    seen.add(val);
                    result.push(val);
                }
            });
    }
    return result;
}

function mergeUnique(primary, secondary) {
    const set = new Set();
    const merged = [];
    [...primary, ...secondary].forEach((val) => {
        if (!val) return;
        if (!set.has(val)) {
            set.add(val);
            merged.push(val);
        }
    });
    return merged;
}

function detectLanIp() {
    const ifaces = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(ifaces)) {
        for (const entry of ifaces[name] || []) {
            if (entry.family === 'IPv4' && !entry.internal) candidates.push(entry.address);
        }
    }
    const prefer = (ips, pred) => ips.find(pred);
    return (
        prefer(candidates, (ip) => ip.startsWith('192.168.')) ||
        prefer(candidates, (ip) => ip.startsWith('10.')) ||
        prefer(candidates, (ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ||
        candidates[0] || 'localhost'
    );
}

function main() {
    const cliArgs = process.argv.slice(2);
    const hostArg = cliArgs[0] || 'localhost';
    const portArgs = cliArgs.slice(1);
    const host = hostArg === 'auto' ? detectLanIp() : hostArg;
    const ports = parseList(portArgs.length > 0 ? portArgs : ['8081', '8082']);
    const uniquePorts = ports.length > 0 ? ports : ['8081'];
    const urls = uniquePorts.map((port) => `http://${host}:${port}`);

    let raw;
    if (fs.existsSync(backendEnvPath)) {
        raw = fs.readFileSync(backendEnvPath, 'utf8');
    } else {
        // Cria .env básico se não existir
        raw = '';
        try {
            fs.mkdirSync(path.dirname(backendEnvPath), { recursive: true });
        } catch { }
    }
    const existingEnv = parseDotEnv(raw);
    const existingCors = parseList(existingEnv.CORS_ORIGINS);
    const mergedCors = mergeUnique(urls, existingCors);

    const updated = updateEnvContent(raw, {
        FRONTEND_URL: urls[0],
        FRONTEND_URLS: urls.join(','),
        CORS_ORIGINS: mergedCors.join(','),
    });
    fs.writeFileSync(backendEnvPath, updated, 'utf8');
    console.log(`[sync-backend-frontend-url] Set FRONTEND_URL=${urls[0]} (ports: ${uniquePorts.join(', ')})`);
    if (mergedCors.length !== existingCors.length || mergedCors.some((v, i) => v !== existingCors[i])) {
        console.log(`[sync-backend-frontend-url] Updated CORS_ORIGINS=${mergedCors.join(',')}`);
    }
}

main();
