import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeStore } from '@/src/store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showThemeToggle?: boolean;
  rightComponent?: React.ReactNode;
}

export default function Header({ 
  title, 
  subtitle, 
  showThemeToggle = false, 
  rightComponent 
}: HeaderProps) {
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const palette = Colors[themeMode];
  
  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-end',
      marginBottom: Spacing.xl 
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          ...Typography.h3,
          color: palette.text,
          marginBottom: subtitle ? Spacing.xs : 0
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            ...Typography.caption,
            color: palette.textSecondary
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {showThemeToggle && (
        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
          <Pressable
            onPress={() => setThemeMode('light')}
            style={{
              paddingVertical: Spacing.xs,
              paddingHorizontal: Spacing.sm,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: themeMode === 'light' ? palette.primary : 'transparent'
            }}
          >
            <Text style={{
              ...Typography.small,
              color: themeMode === 'light' ? '#FFFFFF' : palette.textSecondary,
              fontWeight: '600'
            }}>
              Light
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setThemeMode('dark')}
            style={{
              paddingVertical: Spacing.xs,
              paddingHorizontal: Spacing.sm,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: themeMode === 'dark' ? palette.primary : 'transparent'
            }}
          >
            <Text style={{
              ...Typography.small,
              color: themeMode === 'dark' ? '#FFFFFF' : palette.textSecondary,
              fontWeight: '600'
            }}>
              Dark
            </Text>
          </Pressable>
        </View>
      )}
      
      {rightComponent}
    </View>
  );
}