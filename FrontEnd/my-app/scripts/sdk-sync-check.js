/* eslint-env node */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function collectFiles(baseDir) {
    const results = new Map();
    const stack = [''];
    while (stack.length > 0) {
        const rel = stack.pop();
        const abs = path.join(baseDir, rel);
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) {
            const entries = fs.readdirSync(abs);
            for (const entry of entries) {
                if (entry === '.DS_Store' || entry === 'Thumbs.db') continue;
                stack.push(path.join(rel, entry));
            }
        } else if (stat.isFile()) {
            const data = fs.readFileSync(abs);
            const hash = crypto.createHash('sha1').update(data).digest('hex');
            results.set(rel.replace(/\\/g, '/'), hash);
        }
    }
    return results;
}

function main() {
    const projectRoot = process.cwd();
    const frontendSdk = path.join(projectRoot, 'sdk-backend');
    const backendSdk = path.resolve(projectRoot, '..', '..', 'BackEnd', 'MedicalTime', 'sdk');

    if (!fs.existsSync(frontendSdk)) {
        console.log('[sdk:verify] Diretório FrontEnd/my-app/sdk-backend ausente. Nada para comparar.');
        process.exit(0);
    }

    if (!fs.existsSync(backendSdk)) {
        console.warn('[sdk:verify] Diretório BackEnd/MedicalTime/sdk ausente. Execute `npm run sdk:update` no backend e copie a saída.');
        process.exit(1);
    }

    const frontFiles = collectFiles(frontendSdk);
    const backFiles = collectFiles(backendSdk);

    const diffs = [];
    const allKeys = new Set([...frontFiles.keys(), ...backFiles.keys()]);

    for (const key of allKeys) {
        const frontHash = frontFiles.get(key);
        const backHash = backFiles.get(key);
        if (!frontHash || !backHash) {
            diffs.push({ file: key, reason: !frontHash ? 'missing_in_frontend' : 'missing_in_backend' });
        } else if (frontHash !== backHash) {
            diffs.push({ file: key, reason: 'content_mismatch' });
        }
    }

    if (diffs.length === 0) {
        console.log('[sdk:verify] sdk-backend sincronizado com BackEnd/MedicalTime/sdk.');
        process.exit(0);
    }

    console.error('[sdk:verify] Divergências detectadas entre sdk-backend e BackEnd/MedicalTime/sdk:');
    diffs.slice(0, 20).forEach((diff) => {
        console.error(` - ${diff.file}: ${diff.reason}`);
    });
    if (diffs.length > 20) {
        console.error(` ... e mais ${diffs.length - 20} arquivos.`);
    }
    console.error('Execute `cd BackEnd/MedicalTime && npm run sdk:update` e copie os artefatos para FrontEnd/my-app/sdk-backend.');
    process.exit(1);
}

main();
