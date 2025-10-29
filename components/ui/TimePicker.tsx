import React, { useMemo, useState } from 'react';
import { Platform, View, Text, TextInput } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';

type Props = {
  minutes: number; // 0..1439
  onChange: (minutes: number) => void;
  disabled?: boolean;
};

export default function TimePicker({ minutes, onChange, disabled }: Props) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  const inputMode = useMemo(() => (Platform.OS === 'web' ? 'numeric' : 'tel'), []);
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const [hourFocused, setHourFocused] = useState(false);
  const [minFocused, setMinFocused] = useState(false);

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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <TextInput
        value={String(hh).padStart(2, '0')}
        onChangeText={sanitizeHour}
        editable={!disabled}
        inputMode={inputMode as any}
        onFocus={() => setHourFocused(true)}
        onBlur={() => setHourFocused(false)}
        style={{
          width: 56,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: hourFocused ? palette.borderFocused : palette.border,
          borderRadius: BorderRadius.md,
          textAlign: 'center',
          color: palette.text,
          backgroundColor: palette.surface,
          opacity: disabled ? 0.6 : 1,
          ...Typography.body,
        }}
      />
      <Text style={{ ...Typography.body, color: palette.text }}>:</Text>
      <TextInput
        value={String(mm).padStart(2, '0')}
        onChangeText={sanitizeMinute}
        editable={!disabled}
        inputMode={inputMode as any}
        onFocus={() => setMinFocused(true)}
        onBlur={() => setMinFocused(false)}
        style={{
          width: 56,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: minFocused ? palette.borderFocused : palette.border,
          borderRadius: BorderRadius.md,
          textAlign: 'center',
          color: palette.text,
          backgroundColor: palette.surface,
          opacity: disabled ? 0.6 : 1,
          ...Typography.body,
        }}
      />
    </View>
  );
}
