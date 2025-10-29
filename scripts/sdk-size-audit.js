#!/usr/bin/env node
/**
 * Auditoria simples de tamanho do SDK gerado (pasta sdk-backend).
 * Mede tamanho bruto (bytes), total de arquivos TS/JS e top 10 maiores arquivos.
 * Opcional: se houver build pré-gerado (dist/ ou transpiled), pode ser estendido.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sdkDir = path.join(root, 'sdk-backend');

if (!fs.existsSync(sdkDir)) {
    console.error('[sdk-size-audit] Pasta sdk-backend não encontrada. Gere o SDK primeiro.');
    process.exit(1);
}

let totalBytes = 0;
const files = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else {
            if (/\.(ts|js)$/.test(entry)) {
                totalBytes += stat.size;
                files.push({ file: full.replace(root + path.sep, ''), size: stat.size });
            }
        }
    }
}

walk(sdkDir);

files.sort((a, b) => b.size - a.size);

function fmt(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

console.log('=== SDK Size Audit ===');
console.log('Arquivos TS/JS:', files.length);
console.log('Tamanho total bruto:', fmt(totalBytes));
console.log('\nTop 10 arquivos:');
for (const f of files.slice(0, 10)) {
    console.log('-', f.file, '=>', fmt(f.size));
}

// Heurística de alerta simples
const KB = 1024;
const warningThreshold = 300 * KB; // ajustar conforme necessidade
if (totalBytes > warningThreshold) {
    console.log('\n[WARN] Tamanho bruto acima de', fmt(warningThreshold), '→ considere avaliar tree shaking ou dividir geração.');
}

console.log('\nSugestões de próximos passos:');
console.log('- Rodar analisadores de bundle (ex.: source-map-explorer) após build de produção.');
console.log('- Verificar se re-exportações ou helpers duplicados podem ser eliminados.');
console.log('- Avaliar divisão de serviços em imports dinâmicos se apenas poucos domínios são usados em algumas telas.');
