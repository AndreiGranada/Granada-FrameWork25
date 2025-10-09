import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeStore } from '@/src/store';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  padding?: keyof typeof Spacing;
}

export default function Card({ 
  children, 
  style, 
  elevated = false, 
  padding = 'lg' 
}: CardProps) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? palette.surfaceElevated : palette.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing[padding],
          ...(elevated && mode === 'light' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }),
          ...(elevated && mode === 'dark' && {
            borderWidth: 1,
            borderColor: palette.border,
          }),
        },
        style as any,
      ]}
    >
      {children}
    </View>
  );
}