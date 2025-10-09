import React, { useMemo } from 'react';
import { Platform, View, Text, TextInput } from 'react-native';

type Props = {
  minutes: number; // 0..1439
  onChange: (minutes: number) => void;
  disabled?: boolean;
};

export default function TimePicker({ minutes, onChange, disabled }: Props) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  const inputMode = useMemo(() => (Platform.OS === 'web' ? 'numeric' : 'tel'), []);

  function sanitizeHour(v: string) {
    let n = parseInt(v.replace(/\D/g, ''), 10);
    if (isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 23) n = 23;
    onChange(n * 60 + mm);
  }

  function sanitizeMinute(v: string) {
    let n = parseInt(v.replace(/\D/g, ''), 10);
    if (isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 59) n = 59;
    onChange(hh * 60 + n);
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TextInput
        value={String(hh).padStart(2, '0')}
        onChangeText={sanitizeHour}
        editable={!disabled}
        inputMode={inputMode as any}
        style={{
          width: 48,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          textAlign: 'center',
        }}
      />
      <Text>:</Text>
      <TextInput
        value={String(mm).padStart(2, '0')}
        onChangeText={sanitizeMinute}
        editable={!disabled}
        inputMode={inputMode as any}
        style={{
          width: 48,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          textAlign: 'center',
        }}
      />
    </View>
  );
}
