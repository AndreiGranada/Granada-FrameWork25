import type { Response } from 'express';

// Shape padronizado conforme OpenAPI ErrorResponse
// { error: { code: string; message: string; details?: any } }

export type ErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMIT'
    | 'INTERNAL_ERROR';

export interface ErrorDetailsIssue {
    path: (string | number)[];
    message: string;
}

export interface ErrorDetails {
    issues?: ErrorDetailsIssue[];
    [key: string]: any; // permite retryAfterSeconds etc.
}

export function sendError(
    res: Response,
    status: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetails | null
): void {
    res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

export const errorHelpers = {
    badRequest: (res: Response, message: string, details?: ErrorDetails) =>
        sendError(res, 400, 'BAD_REQUEST', message, details),
    unauthorized: (res: Response, message = 'Não autenticado') =>
        sendError(res, 401, 'UNAUTHORIZED', message),
    notFound: (res: Response, message = 'Recurso não encontrado') =>
        sendError(res, 404, 'NOT_FOUND', message),
    conflict: (res: Response, message: string) =>
        sendError(res, 409, 'CONFLICT', message),
    rateLimit: (res: Response, message: string, retryAfterSeconds?: number) =>
        sendError(res, 429, 'RATE_LIMIT', message, retryAfterSeconds ? { retryAfterSeconds } : undefined),
    internal: (res: Response, message = 'Erro interno inesperado') =>
        sendError(res, 500, 'INTERNAL_ERROR', message)
};

export function mapZodError(err: any): ErrorDetails {
    if (!err?.issues) return {};
    return {
        issues: err.issues.map((i: any) => ({ path: i.path, message: i.message }))
    };
}
