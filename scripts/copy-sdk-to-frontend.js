#!/usr/bin/env node
/**
 * Copia o SDK gerado (pasta sdk/) para o frontend em FrontEnd/my-app/sdk-backend
 * Mantém uma cópia isolada para facilitar imports controlados.
 */
const fs = require('fs');
const path = require('path');

const rootBackend = process.cwd();
const sdkSrc = path.join(rootBackend, 'sdk');
const frontendDir = path.join(rootBackend, '..', '..', 'FrontEnd', 'my-app');
const target = path.join(frontendDir, 'sdk-backend');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.statSync(s);
        if (stat.isDirectory()) copyRecursive(s, d);
        else fs.copyFileSync(s, d);
    }
}

if (!fs.existsSync(sdkSrc)) {
    console.error('[sdk:update] Pasta sdk/ não encontrada. Rode primeiro: npm run sdk:generate');
    process.exit(1);
}
if (!fs.existsSync(frontendDir)) {
    console.error('[sdk:update] Frontend não localizado em', frontendDir);
    process.exit(1);
}
copyRecursive(sdkSrc, target);
console.log(`[sdk:update] SDK copiado para ${target}`);
