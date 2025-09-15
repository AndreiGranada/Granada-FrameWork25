import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import remindersRoutes from './routes/reminders';
import intakesRoutes from './routes/intakes';
import emergencyRoutes from './routes/emergency';
import devicesRoutes from './routes/devices';

dotenv.config();

export const createApp = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/health', (_req: Request, res: Response): void => { res.json({ status: 'ok' }); });

    app.use('/auth', authRoutes);
    app.use('/reminders', remindersRoutes);
    app.use('/intakes', intakesRoutes);
    app.use('/emergency', emergencyRoutes);
    app.use('/devices', devicesRoutes);

    // 404 handler
    app.use((req: Request, res: Response): void => {
        res.status(404).json({ error: 'Rota não encontrada' });
    });

    // Error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
        console.error('Erro não tratado:', err);
        res.status(500).json({ error: 'Erro interno' });
    });

    return app;
};
