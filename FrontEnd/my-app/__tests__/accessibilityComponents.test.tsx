import Banner from '@/components/ui/Banner';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextField from '@/components/ui/TextField';
import { Toast } from '@/components/ui/Toast';
import { act, render } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

describe('Acessibilidade – componentes básicos', () => {
  const announceSpy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(async () => {});

  beforeEach(() => {
    announceSpy.mockClear();
  });

  afterAll(() => {
    announceSpy.mockRestore();
  });

  it('PrimaryButton expõe papel de botão e estado disabled', () => {
    const { getByRole } = render(<PrimaryButton title="Salvar" disabled />);
    const button = getByRole('button', { name: 'Salvar' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('TextField associa label e erro via propriedades acessíveis', () => {
    const { getByLabelText, getByText } = render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={() => {}}
        error="Informe o e-mail"
      />
    );
    const input = getByLabelText('E-mail');
    expect(input).toBeTruthy();
    const error = getByText('Informe o e-mail');
    expect(error.props.accessibilityLiveRegion).toBe('polite');
  });

  it('Banner de erro usa role alert e anuncia mensagem', () => {
    render(<Banner kind="error" message="Falha ao salvar" />);
    expect(announceSpy).toHaveBeenCalledWith('Falha ao salvar');
  });

  it('Toast anuncia mensagem para leitores de tela', () => {
    act(() => {
      render(<Toast kind="error" message="Operação não permitida" />);
    });
    expect(announceSpy).toHaveBeenCalledWith('Operação não permitida');
  });
});
