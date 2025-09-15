import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } : undefined,
    redact: {
        paths: ['req.headers.authorization', 'password', 'passwordHash'],
        remove: false
    }
});

export function logStartupInfo() {
    logger.info({ env: process.env.NODE_ENV }, 'Servidor inicializado');
}
