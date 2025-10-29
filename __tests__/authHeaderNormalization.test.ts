import { getHeaders } from '@/sdk-backend/core/request';
import { OpenAPI } from '@/sdk-backend/core/OpenAPI';
import type { ApiRequestOptions } from '@/sdk-backend/core/ApiRequestOptions';

// Pequeno helper para construir options mínimos
function opts(partial: Partial<ApiRequestOptions>): ApiRequestOptions {
    return {
        method: 'GET',
        url: '/ping',
        ...partial,
    } as ApiRequestOptions;
}

describe('Authorization header normalization', () => {
    it('prefixa Bearer quando token cru é fornecido', async () => {
        OpenAPI.TOKEN = 'raw-token-123';
        const headers = await getHeaders(OpenAPI, opts({}));
        expect(headers.get('Authorization')).toBe('Bearer raw-token-123');
    });

    it('não duplica Bearer quando token já contém prefixo', async () => {
        OpenAPI.TOKEN = 'Bearer prefixed-456';
        const headers = await getHeaders(OpenAPI, opts({}));
        expect(headers.get('Authorization')).toBe('Bearer prefixed-456');
    });
});
