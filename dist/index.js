"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Exporta app para testes e inicia servidor apenas quando executado diretamente
const app_1 = require("./src/app");
const app = (0, app_1.createApp)();
// Para testes, exportamos o app sem side effects
exports.default = app;
// Se for execução direta (npm start/dev), inicializa server completo
if (require.main === module) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./src/server');
}
