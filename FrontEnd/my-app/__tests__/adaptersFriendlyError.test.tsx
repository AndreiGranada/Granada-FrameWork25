import { wrap } from '@/src/services/adapters/adapterError';

describe('Friendly error mapping', () => {
  it('converte código conhecido em mensagem amigável', async () => {
    const failing = Promise.reject({ response: { data: { error: { code: 'EMERGENCY_CONTACT_LIMIT', message: 'raw message internal' } }, status: 400 }, config: { url: '/emergency', method: 'post' } });
    await expect(wrap(failing, 'Fallback')).rejects.toThrow('Limite de contatos de emergência atingido.');
  });

  it('usa fallback quando código desconhecido', async () => {
    const failing = Promise.reject({ response: { data: { error: { code: 'WHATEVER_UNKNOWN', message: 'internal' } }, status: 400 }, config: { url: '/x', method: 'get' } });
    await expect(wrap(failing, 'Algo deu errado')).rejects.toThrow('Algo deu errado');
  });
});
