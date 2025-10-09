#!/usr/bin/env node
/* Simula cenário de highlight de intake recebendo push/deep link */
const id = process.argv[2] || 'demo-intake-id';
console.log('[highlight] simulate deep link to /intakes-history?highlight=' + encodeURIComponent(id));
console.log('[highlight] Expectation: tela deve rolar e pulsar item ' + id);
process.exit(0);
