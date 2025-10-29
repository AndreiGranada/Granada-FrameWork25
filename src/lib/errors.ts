// Utilitário para padronizar extração de mensagens de erro vindas da API
// Contrato esperado (exemplo):
// {
//   error: {
//     message?: string;
//     details?: {
//       issues?: Array<{ path?: string[]; message: string }>;
//       retryAfterSeconds?: number;
//     }
//   }
// }

export type ApiIssue = { path?: string[]; message: string };

export type ApiErrorShape = {
    error?: {
        message?: string;
        details?: {
            issues?: ApiIssue[];
            retryAfterSeconds?: number;
        };
    };
};

// Extrai um mapa field -> mensagem (primeira mensagem por campo)
export function extractFieldErrors(err: any): Record<string, string> {
    const data: ApiErrorShape | undefined = err?.response?.data ?? err?.data ?? err;
    const out: Record<string, string> = {};
    const issues = data?.error?.details?.issues;
    if (Array.isArray(issues)) {
        for (const it of issues) {
            const key = it?.path?.join('.') || '_';
            if (!out[key]) out[key] = it?.message || 'Campo inválido';
        }
    }
    return out;
}

// Mensagem de topo amigável
export function friendlyTopMessage(err: any, fallback: string = 'Falha na operação') {
    const data: ApiErrorShape | undefined = err?.response?.data ?? err?.data ?? err;
    if (data?.error?.message) return data.error.message;
    if (err?.message?.includes('Network') || err?.message?.includes('timeout')) {
        return 'Falha de rede. Confira a URL da API e a conexão do dispositivo.';
    }
    return fallback;
}

// Retry-After em segundos (cabeçalho ou corpo)
export function getRetryAfterSeconds(err: any): number {
    const hdr = err?.response?.headers?.['retry-after'];
    const fromHeader = hdr != null ? Number(hdr) : 0;
    if (fromHeader && !Number.isNaN(fromHeader) && fromHeader > 0) return fromHeader;
    const fromBody = Number(err?.response?.data?.error?.details?.retryAfterSeconds) || 0;
    return fromBody > 0 ? fromBody : 0;
}
