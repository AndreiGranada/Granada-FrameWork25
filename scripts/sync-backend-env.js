/* eslint-env node */
/* eslint-disable no-undef */
// Sync backend .env -> frontend .env (EXPO_PUBLIC_API_BASE_URL[|S])
// Usage: node ./scripts/sync-backend-env.js [host|auto] [portA] [portB] [...]
// - host: opcional. Quando ausente, tenta reaproveitar o host atual do front ou usa localhost.
// - auto: detecta IP da LAN (192.168.x.x / 10.x / 172.16-31) para dispositivos físicos.
// - portas: você pode informar múltiplas portas (separadas por espaço ou vírgula). A primeira é usada como principal.

const fs = require('fs');
const path = require('path');
const os = require('os');

const projectRoot = path.resolve(__dirname, '..');
const backendEnvPath = path.resolve(projectRoot, '..', '..', 'BackEnd', 'MedicalTime', '.env');
const frontendEnvPath = path.resolve(projectRoot, '.env');

function parseDotEnv(raw) {
    const out = {};
    raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        // Remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    });
    return out;
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

function extractHostPort(url) {
    try {
        const parsed = new URL(url);
        return { host: parsed.hostname, port: parsed.port || undefined };
    } catch {
        return undefined;
    }
}

function main() {
    if (!fs.existsSync(backendEnvPath)) {
        console.error(`[sync-backend-env] Backend .env not found at: ${backendEnvPath}`);
        process.exit(1);
    }
    const raw = fs.readFileSync(backendEnvPath, 'utf8');
    const backendEnv = parseDotEnv(raw);

    const cliArgs = process.argv.slice(2);
    let hostArg = cliArgs[0];
    const portArgs = cliArgs.slice(1);

    if (hostArg === 'auto') {
        // Tenta detectar um IPv4 local não interno (prioriza 192.168.*, 10.*, 172.16-31.*)
        const ifaces = os.networkInterfaces();
        const candidates = [];
        for (const name of Object.keys(ifaces)) {
            for (const entry of ifaces[name] || []) {
                if (entry.family === 'IPv4' && !entry.internal) {
                    candidates.push(entry.address);
                }
            }
        }
        const prefer = (ips, pred) => ips.find(pred);
        const chosen =
            prefer(candidates, (ip) => ip.startsWith('192.168.')) ||
            prefer(candidates, (ip) => ip.startsWith('10.')) ||
            prefer(candidates, (ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ||
            candidates[0];
        if (chosen) {
            hostArg = chosen;
            console.log(`[sync-backend-env] Auto-detected LAN IP: ${chosen}`);
        } else {
            console.warn('[sync-backend-env] Could not auto-detect LAN IP, falling back to localhost');
            hostArg = 'localhost';
        }
    }
    let existingFrontEnv = {};
    if (fs.existsSync(frontendEnvPath)) {
        try {
            existingFrontEnv = parseDotEnv(fs.readFileSync(frontendEnvPath, 'utf8'));
        } catch { existingFrontEnv = {}; }
    }

    let host = hostArg;
    if (!host) {
        const fromExisting = extractHostPort(existingFrontEnv.EXPO_PUBLIC_API_BASE_URL || existingFrontEnv.API_BASE_URL);
        if (fromExisting?.host) {
            host = fromExisting.host;
            console.log(`[sync-backend-env] Preserving existing host from front .env: ${host}`);
            if (fromExisting.port && portArgs.length === 0) {
                portArgs.push(fromExisting.port);
            }
        }
    }
    host = host || 'localhost';

    let ports = parseList(portArgs);
    if (ports.length === 0) {
        const configuredPorts = parseList([backendEnv.API_PORTS, backendEnv.PORTS]);
        if (configuredPorts.length > 0) ports = configuredPorts;
    }
    if (ports.length === 0 && backendEnv.PORT) {
        ports = [backendEnv.PORT];
    }
    if (ports.length === 0 && existingFrontEnv.EXPO_PUBLIC_API_BASE_URL) {
        const parsed = extractHostPort(existingFrontEnv.EXPO_PUBLIC_API_BASE_URL);
        if (parsed?.port) ports = [parsed.port];
    }
    if (ports.length === 0) ports = ['3000'];

    const uniquePorts = Array.from(new Set(ports));
    const urls = uniquePorts.map((port) => `http://${host}:${port}`);
    const banner = `# Auto-generated by scripts/sync-backend-env.js\n# Source: ${backendEnvPath}\n`;

    const bodyLines = [
        `EXPO_PUBLIC_API_BASE_URL=${urls[0]}`,
        `EXPO_PUBLIC_API_BASE_URLS=${urls.join(',')}`,
        `EXPO_PUBLIC_API_HOST=${host}`,
        `EXPO_PUBLIC_API_PORTS=${uniquePorts.join(',')}`,
    ];

    fs.writeFileSync(frontendEnvPath, `${banner}${bodyLines.join('\n')}\n`, 'utf8');
    console.log(`[sync-backend-env] Wrote ${frontendEnvPath} with API base ${urls[0]} (ports: ${uniquePorts.join(', ')})`);
}

main();
