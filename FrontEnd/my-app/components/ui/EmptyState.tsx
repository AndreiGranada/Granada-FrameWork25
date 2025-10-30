import React from 'react';
import { View, Text } from 'react-native';
import { useThemeStore } from '@/src/store';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: EmptyStateProps) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  
  return (
    <View style={{ 
      alignItems: 'center',
      paddingVertical: Spacing.xxxxl,
      paddingHorizontal: Spacing.lg,
    }}>
      {icon && (
        <Text style={{ 
          fontSize: 48, 
          marginBottom: Spacing.lg 
        }}>
          {icon}
        </Text>
      )}
      
      <Text style={{ 
        ...Typography.bodySemiBold,
        color: palette.text,
        textAlign: 'center',
        marginBottom: Spacing.sm,
      }}>
        {title}
      </Text>
      
      <Text style={{
        ...Typography.caption,
        color: palette.textSecondary,
        textAlign: 'center',
        marginBottom: action ? Spacing.xl : 0,
      }}>
        {description}
      </Text>
      
      {action}
    </View>
  );
}