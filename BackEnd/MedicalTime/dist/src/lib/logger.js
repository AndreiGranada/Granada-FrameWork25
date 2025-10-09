"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logStartupInfo = logStartupInfo;
const pino_1 = __importDefault(require("pino"));
const isDev = process.env.NODE_ENV !== 'production';
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } : undefined,
    redact: {
        paths: ['req.headers.authorization', 'password', 'passwordHash'],
        remove: false
    }
});
function logStartupInfo() {
    exports.logger.info({ env: process.env.NODE_ENV }, 'Servidor inicializado');
}
