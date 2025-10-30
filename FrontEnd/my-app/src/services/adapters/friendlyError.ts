// Mapear códigos/mensagens conhecidas do backend para mensagens amigáveis consistentes.
// Pode evoluir para usar tabela baseada em i18n.
interface BackendErrorShape {
    code?: string;
    message?: string;
    details?: any;
}

const FRIENDLY_MAP: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: 'Credenciais inválidas. Verifique e tente novamente.',
    AUTH_RATE_LIMIT: 'Muitas tentativas. Tente novamente em instantes.',
    REMINDER_NOT_FOUND: 'Lembrete não encontrado ou já removido.',
    EMERGENCY_CONTACT_LIMIT: 'Limite de contatos de emergência atingido.',
    INTAKE_ALREADY_MARKED: 'Esta ingestão já foi marcada anteriormente.',
    DEVICE_NOT_FOUND: 'Dispositivo não localizado.',
    SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
};

export function mapFriendlyError(raw: any, fallback: string): string {
    const data: BackendErrorShape | undefined = raw?.response?.data?.error;
    if (data?.code && FRIENDLY_MAP[data.code]) {
        return FRIENDLY_MAP[data.code];
    }
    return fallback;
}

export function enrichError(err: Error, raw: any): Error {
    // anexa metadados úteis (sem expor internals no message)
    (err as any)._backend = {
        status: raw?.response?.status,
        code: raw?.response?.data?.error?.code,
    };
    return err;
}

export function toFriendlyError(raw: any, fallback: string): Error {
    const message = mapFriendlyError(raw, fallback);
    const err = new Error(message);
    return enrichError(err, raw);
}
