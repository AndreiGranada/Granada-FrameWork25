import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { logger } from './lib/logger';
import { errorHelpers } from './lib/errors';
import { runWithContext } from './lib/als';
import authRoutes from './routes/auth';
import remindersRoutes from './routes/reminders';
import intakesRoutes from './routes/intakes';
import emergencyRoutes from './routes/emergency';
import devicesRoutes from './routes/devices';
import meRoute from './routes/me';
import devRoutes from './routes/dev';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

dotenv.config();

export const createApp = () => {
    const app = express();
    // Segurança básica
    app.use(helmet());

    // CORS restrito por origem (lista separada por vírgula)
    const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const corsOptions: CorsOptions = origins.length === 0
        ? { origin: true, credentials: true }
        : {
            origin: (origin, callback) => {
                if (!origin || origins.includes(origin)) return callback(null, true);
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true
        };
    app.use(cors(corsOptions));
    app.use(express.json());

    // Swagger UI em /docs (carrega openapi.yaml na raiz)
    try {
        const specPath = path.join(process.cwd(), 'openapi.yaml');
        if (fs.existsSync(specPath)) {
            const doc = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;
            app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));
        }
    } catch (e) {
        // apenas não monta /docs se houver erro
        console.error('Falha ao montar Swagger UI:', e);
    }

    // CorrelationId por request
    app.use((req: Request, _res: Response, next: NextFunction) => {
        const headerId = (req.headers['x-correlation-id'] as string) || '';
        const correlationId = headerId || randomUUID();
        runWithContext({ correlationId }, () => next());
    });

    // Log simples por request (entrada) e resposta do X-Correlation-Id
    app.use((req: Request, res: Response, next: NextFunction) => {
        const id = (req.headers['x-correlation-id'] as string) || '';
        const child = logger.child({ correlationId: id });
        child.info({ method: req.method, url: req.url }, 'request');
        if (id) res.setHeader('X-Correlation-Id', id);
        next();
    });

    app.get('/health', (_req: Request, res: Response): void => { res.json({ status: 'ok' }); });

    app.use('/auth', authRoutes);
    app.use('/reminders', remindersRoutes);
    app.use('/intakes', intakesRoutes);
    app.use('/emergency', emergencyRoutes);
    app.use('/devices', devicesRoutes);
    app.use('/me', meRoute);
    if (process.env.NODE_ENV !== 'production') {
        app.use('/dev', devRoutes);
    }

    // 404 handler
    app.use((req: Request, res: Response): void => { errorHelpers.notFound(res, 'Rota não encontrada'); });

    // Error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
        console.error('Erro não tratado:', err);
        errorHelpers.internal(res);
    });

    return app;
};
