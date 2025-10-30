import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import TextField from '@/components/ui/TextField';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';
import type { EmergencyContact } from '@/src/services/adapters/emergencyContactsAdapter';

export type EmergencyContactFormValues = Required<Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>>;

export default function EmergencyContactForm({
  initial,
  onSubmit,
  submitting,
  maxActiveReached,
  serverErrors,
}: {
  initial?: Partial<EmergencyContact>;
  onSubmit: (values: EmergencyContactFormValues) => void;
  submitting?: boolean;
  maxActiveReached?: boolean;
  serverErrors?: Partial<Record<'name' | 'phone' | 'customMessage' | 'isActive', string>>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [customMessage, setCustomMessage] = useState(initial?.customMessage ?? '');
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const { mode } = useThemeStore();
  const palette = Colors[mode];

  useEffect(() => {
    if (maxActiveReached && isActive && !(initial?.isActive)) {
      setIsActive(false);
    }
  }, [maxActiveReached, initial?.isActive, isActive]);

  function handleSubmit() {
    const values: EmergencyContactFormValues = {
      name: name.trim(),
      phone: phone.trim(),
  customMessage: customMessage.trim() ? customMessage.trim() : null,
      isActive,
    };
    onSubmit(values);
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View>
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          error={serverErrors?.name}
        />
      </View>
      <View>
        <TextField
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+5511999999999"
          keyboardType="phone-pad"
          error={serverErrors?.phone}
        />
      </View>
      <View>
        <TextField
          label="Mensagem Personalizada (opcional)"
          value={customMessage}
          onChangeText={setCustomMessage}
          placeholder="Ex: Estou precisando de ajuda agora."
          multiline
          numberOfLines={3}
          error={serverErrors?.customMessage}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '700', color: palette.text }}>Ativo</Text>
        <Switch value={isActive} onValueChange={(v) => setIsActive(maxActiveReached && v && !(initial?.isActive) ? false : v)} />
      </View>
      {maxActiveReached && !(initial?.isActive) ? (
        <Text style={{ color: palette.textSecondary, marginTop: Spacing.xs }}>
          Você já possui 5 contatos ativos. Para ativar este, desative outro primeiro.
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting || !name.trim() || !phone.trim()}
        style={{
          backgroundColor: submitting ? '#E5E5E5' : '#FFFFFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#000000',
          opacity: submitting ? 0.8 : 1,
        }}
      >
        <Text style={{ color: '#000000', fontWeight: '700' }}>{submitting ? 'Salvando...' : 'Salvar'}</Text>
      </TouchableOpacity>
    </View>
  );
}
