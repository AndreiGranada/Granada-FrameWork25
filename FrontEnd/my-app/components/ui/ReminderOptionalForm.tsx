import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import PrimaryButton from './PrimaryButton';
import type { Reminder, ReminderUpdate } from '@/sdk-backend';

type Props = {
  reminder: Reminder;
  onSubmit: (data: ReminderUpdate) => Promise<void> | void;
  submitting?: boolean;
};

export const ReminderOptionalForm: React.FC<Props> = ({ reminder, onSubmit, submitting }) => {
  const [purpose, setPurpose] = useState(reminder.purpose ?? '');
  const [description, setDescription] = useState(reminder.description ?? '');
  const [pricePaid, setPricePaid] = useState(reminder.pricePaid ?? '');
  const [photoUrl, setPhotoUrl] = useState(reminder.photoUrl ?? '');

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (submitting) return; // só anima após concluir
  }, [submitting]);

  function flashSaved() {
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  const handleSave = () => {
    const payload: ReminderUpdate = {
      purpose: purpose || undefined,
      description: description || undefined,
      pricePaid: pricePaid ? pricePaid.replace(',', '.') : undefined,
      photoUrl: photoUrl || undefined,
    };
    const maybePromise = onSubmit(payload);
    if (maybePromise && typeof (maybePromise as any).then === 'function') {
      (maybePromise as Promise<void>).then(() => flashSaved());
    } else {
      flashSaved();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes avançados</Text>
      <LabeledInput label="Objetivo (purpose)" value={purpose} onChangeText={setPurpose} placeholder="Ex.: Saúde óssea" />
      <LabeledInput label="Descrição" value={description} onChangeText={setDescription} placeholder="Observações" multiline />
      <LabeledInput label="Preço pago" value={pricePaid} onChangeText={setPricePaid} placeholder="Ex.: 29.90" keyboardType="decimal-pad" />
      <LabeledInput label="Foto (URL)" value={photoUrl} onChangeText={setPhotoUrl} placeholder="https://..." autoCapitalize="none" />
      <PrimaryButton title={submitting ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={submitting} />
      <Animated.View pointerEvents="none" style={{ opacity: fade, position: 'absolute', top: 8, right: 16 }}>
        <Text style={{ color: '#4ade80', fontWeight: '600' }}>Salvo</Text>
      </Animated.View>
    </View>
  );
};

const LabeledInput = ({ label, style, multiline, ...rest }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline, style]}
      placeholderTextColor="#888"
      multiline={multiline}
      {...rest}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4, color: '#ccc' },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
});

export default ReminderOptionalForm;