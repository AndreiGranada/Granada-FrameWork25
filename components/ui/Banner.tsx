import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';
import React, { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';

type Props = {
  kind?: 'info' | 'success' | 'error' | 'warning';
  message: string;
};

export default function Banner({ kind = 'info', message }: Props) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const map = {
    info: { bg: `${palette.primary}20`, fg: palette.primary },
    success: { bg: `${palette.success}20`, fg: palette.success },
    error: { bg: `${palette.error}20`, fg: palette.error },
    warning: { bg: `${palette.warning}20`, fg: palette.warning },
  } as const;
  const s = map[kind];

  useEffect(() => {
    if (kind === 'error' || kind === 'warning') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [kind, message]);

  const accessibilityRole = (kind === 'error' || kind === 'warning') ? 'alert' : 'text';
  const liveRegion = kind === 'error' ? 'assertive' : 'polite';

  return (
    <View
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLiveRegion={liveRegion}
      style={{
        backgroundColor: s.bg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: s.fg,
      }}
    >
      <Text style={{ ...Typography.captionMedium, color: s.fg }}>{message}</Text>
    </View>
  );
}
