"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHelpers = void 0;
exports.sendError = sendError;
exports.mapZodError = mapZodError;
function sendError(res, status, code, message, details) {
    res.status(status).json({ error: Object.assign({ code, message }, (details ? { details } : {})) });
}
exports.errorHelpers = {
    badRequest: (res, message, details) => sendError(res, 400, 'BAD_REQUEST', message, details),
    unauthorized: (res, message = 'Não autenticado') => sendError(res, 401, 'UNAUTHORIZED', message),
    notFound: (res, message = 'Recurso não encontrado') => sendError(res, 404, 'NOT_FOUND', message),
    conflict: (res, message) => sendError(res, 409, 'CONFLICT', message),
    rateLimit: (res, message, retryAfterSeconds) => sendError(res, 429, 'RATE_LIMIT', message, retryAfterSeconds ? { retryAfterSeconds } : undefined),
    internal: (res, message = 'Erro interno inesperado') => sendError(res, 500, 'INTERNAL_ERROR', message)
};
function mapZodError(err) {
    if (!(err === null || err === void 0 ? void 0 : err.issues))
        return {};
    return {
        issues: err.issues.map((i) => ({ path: i.path, message: i.message }))
    };
}
