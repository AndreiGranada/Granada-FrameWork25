// Wrapper central para o SDK gerado (importado do backend após copy script)
// Responsável por injetar token, baseURL e mapear erros em formato amigável.

// Usamos caminho relativo supondo que a pasta gerada seja colocada em src/sdk/backend (ajuste conforme copy script)
// Se o copy script usar outro destino, atualizar estes paths.
// @ts-ignore geração futura
import { OpenAPI } from '@/sdk-backend/core/OpenAPI';
// @ts-ignore geração futura
import { DefaultService } from '@/sdk-backend/services/DefaultService';

// Estado local de token para sincronizar com OpenAPI

export function configureSdk(base: string, token?: string | null) {
    OpenAPI.BASE = base;
    if (token) OpenAPI.TOKEN = token;
}

export function updateSdkToken(token: string | null) {
    OpenAPI.TOKEN = token || undefined;
}

// Adaptador de erro: converte ApiError / respostas em objeto padronizado
export interface FriendlyError {
    message: string;
    status?: number;
    code?: string;
    raw?: any;
}

export function toFriendlyError(err: any): FriendlyError {
    if (!err) return { message: 'Erro desconhecido' };
    const status = err.status || err?.response?.status;
    const data = err.body || err?.response?.data;
    const message = data?.error?.message || data?.message || err.message || 'Erro inesperado';
    const code = data?.error?.code || data?.code;
    return { message, status, code, raw: err };
}

// Expor novamente o service original para consumo externo
export { DefaultService };

