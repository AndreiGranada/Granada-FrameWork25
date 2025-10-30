import React from 'react';
import { View, Text } from 'react-native';
import { useThemeStore } from '@/src/store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  text: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, text, size = 'md' }: StatusBadgeProps) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  
  const getStatusColors = (status: StatusType) => {
    switch (status) {
      case 'success':
        return {
          background: `${palette.success}20`,
          text: palette.success,
          border: palette.success,
        };
      case 'warning':
        return {
          background: `${palette.warning}20`,
          text: palette.warning,
          border: palette.warning,
        };
      case 'error':
        return {
          background: `${palette.error}20`,
          text: palette.error,
          border: palette.error,
        };
      case 'info':
        return {
          background: `${palette.primary}20`,
          text: palette.primary,
          border: palette.primary,
        };
      case 'neutral':
      default:
        return {
          background: `${palette.textSecondary}20`,
          text: palette.textSecondary,
          border: palette.textSecondary,
        };
    }
  };
  
  const colors = getStatusColors(status);
  const typography = size === 'sm' ? Typography.small : Typography.captionMedium;
  const padding = size === 'sm' ? Spacing.xs : Spacing.sm;
  
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        paddingVertical: padding,
        paddingHorizontal: padding * 1.5,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          ...typography,
          color: colors.text,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </View>
  );
}