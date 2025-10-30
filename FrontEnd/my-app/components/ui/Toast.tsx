import React from 'react';
import { AccessibilityInfo, Text, TouchableOpacity, View } from 'react-native';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

type ToastProps = { kind: ToastKind; message: string; onClose?: () => void };

export class Toast extends React.PureComponent<ToastProps> {
  componentDidMount(): void {
    AccessibilityInfo.announceForAccessibility(this.props.message);
  }
  componentDidUpdate(prevProps: ToastProps): void {
    if (prevProps.message !== this.props.message) {
      AccessibilityInfo.announceForAccessibility(this.props.message);
    }
  }
  render() {
    const { kind, message, onClose } = this.props;
    // app usa dark por padrão
    // B&W: usa apenas fundo preto/branco, com borda e texto contrastando.
    const isLightBg = kind === 'success' || kind === 'info';
    const bg = isLightBg ? '#FFFFFF' : '#000000';
    const textColor = isLightBg ? '#000000' : '#FFFFFF';
    const border = isLightBg ? '#000000' : '#FFFFFF';
    return (
      <View
        accessible
        accessibilityRole={kind === 'error' || kind === 'warning' ? 'alert' : 'text'}
        accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
        style={{
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginBottom: 8,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          // gap não é suportado universalmente no RN/test renderer
          // usar espaçamento via estilos nos filhos quando necessário
        }}
      >
        <Text style={{ color: textColor, fontWeight: '700', flex: 1 }}>{message}</Text>
        {onClose ? (
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            accessibilityHint="Dispensa esta notificação"
          >
            <Text style={{ color: textColor, fontWeight: '900' }}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
}
