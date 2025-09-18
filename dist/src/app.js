"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = require("crypto");
const logger_1 = require("./lib/logger");
const als_1 = require("./lib/als");
const auth_1 = __importDefault(require("./routes/auth"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const intakes_1 = __importDefault(require("./routes/intakes"));
const emergency_1 = __importDefault(require("./routes/emergency"));
const devices_1 = __importDefault(require("./routes/devices"));
const dev_1 = __importDefault(require("./routes/dev"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
dotenv_1.default.config();
const createApp = () => {
    const app = (0, express_1.default)();
    // Segurança básica
    app.use((0, helmet_1.default)());
    // CORS restrito por origem (lista separada por vírgula)
    const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const corsOptions = origins.length === 0
        ? { origin: true, credentials: true }
        : {
            origin: (origin, callback) => {
                if (!origin || origins.includes(origin))
                    return callback(null, true);
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true
        };
    app.use((0, cors_1.default)(corsOptions));
    app.use(express_1.default.json());
    // Swagger UI em /docs (carrega openapi.yaml na raiz)
    try {
        const specPath = path_1.default.join(process.cwd(), 'openapi.yaml');
        if (fs_1.default.existsSync(specPath)) {
            const doc = js_yaml_1.default.load(fs_1.default.readFileSync(specPath, 'utf8'));
            app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(doc));
        }
    }
    catch (e) {
        // apenas não monta /docs se houver erro
        console.error('Falha ao montar Swagger UI:', e);
    }
    // CorrelationId por request
    app.use((req, _res, next) => {
        const headerId = req.headers['x-correlation-id'] || '';
        const correlationId = headerId || (0, crypto_1.randomUUID)();
        (0, als_1.runWithContext)({ correlationId }, () => next());
    });
    // Log simples por request (entrada) e resposta do X-Correlation-Id
    app.use((req, res, next) => {
        const id = req.headers['x-correlation-id'] || '';
        const child = logger_1.logger.child({ correlationId: id });
        child.info({ method: req.method, url: req.url }, 'request');
        if (id)
            res.setHeader('X-Correlation-Id', id);
        next();
    });
    app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
    app.use('/auth', auth_1.default);
    app.use('/reminders', reminders_1.default);
    app.use('/intakes', intakes_1.default);
    app.use('/emergency', emergency_1.default);
    app.use('/devices', devices_1.default);
    if (process.env.NODE_ENV !== 'production') {
        app.use('/dev', dev_1.default);
    }
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Rota não encontrada' });
    });
    // Error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error('Erro não tratado:', err);
        res.status(500).json({ error: 'Erro interno' });
    });
    return app;
};
exports.createApp = createApp;
