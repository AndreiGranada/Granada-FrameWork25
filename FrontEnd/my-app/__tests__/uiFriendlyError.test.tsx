import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { wrap } from '@/src/services/adapters/adapterError';

// Componente mínimo que usa wrap para simular chamada de adapter e exibir mensagem amigável
function FailingAction({ trigger }: { trigger: () => Promise<any> }) {
  const [error, setError] = React.useState<string | null>(null);
  const onPress = async () => {
    setError(null);
    try {
      await wrap(trigger(), 'Falha genérica');
    } catch (e: any) {
      setError(e.message);
    }
  };
  return (
    <>
      <Pressable accessibilityLabel="executar" onPress={onPress}><Text>Executar</Text></Pressable>
      {error && <Text accessibilityRole="alert">{error}</Text>}
    </>
  );
}

describe('UI friendly error', () => {
  it('exibe mensagem amigável mapeada a partir de código conhecido', async () => {
    const failing = () => Promise.reject({ response: { data: { error: { code: 'EMERGENCY_CONTACT_LIMIT', message: 'internal hidden' } }, status: 400 }, config: { url: '/emergency/emergency-contacts', method: 'post' } });
    const { getByText, getByRole } = render(<FailingAction trigger={failing} />);
    fireEvent.press(getByText('Executar'));
    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert.props.children).toContain('Limite de contatos de emergência atingido.');
    });
  });

  it('usa fallback quando código desconhecido', async () => {
    const failing = () => Promise.reject({ response: { data: { error: { code: 'UNKNOWN_X', message: 'detail' } }, status: 400 }, config: { url: '/x', method: 'post' } });
    const { getByText, getByRole } = render(<FailingAction trigger={failing} />);
    fireEvent.press(getByText('Executar'));
    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert.props.children).toBe('Falha genérica');
    });
  });
});
