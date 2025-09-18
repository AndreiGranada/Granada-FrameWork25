// Exporta app para testes e inicia servidor apenas quando executado diretamente
import { createApp } from './src/app';

const app = createApp();

// Para testes, exportamos o app sem side effects
export default app;

// Se for execução direta (npm start/dev), inicializa server completo
if (require.main === module) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./src/server');
}

