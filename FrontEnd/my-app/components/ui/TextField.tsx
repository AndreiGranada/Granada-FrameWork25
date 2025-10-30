import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';
import React, { useId, useState } from 'react';
import { Platform, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  error?: string;
  label?: string;
};

export default function TextField({ 
  error, 
  label,
  editable = true, 
  style, 
  placeholderTextColor,
  accessibilityLabel,
  accessibilityHint,
  ...rest 
}: Props) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const [focused, setFocused] = useState(false);
  const inputId = useId();
  const labelId = label ? `${inputId}-label` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  
  const borderColor = error 
    ? palette.error 
    : focused 
    ? palette.borderFocused 
    : palette.border;

  const ariaProps: Record<string, string> = {};
  if (labelId) ariaProps['aria-labelledby'] = labelId;
  if (errorId) ariaProps['aria-describedby'] = errorId;
  if (error !== undefined) ariaProps['aria-invalid'] = error ? 'true' : 'false';
    
  return (
    <View style={{ width: '100%' }}>
      {label && (
        <Text
          nativeID={labelId}
          style={{
            ...Typography.captionMedium,
            color: palette.text,
            marginBottom: Spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        editable={editable}
        placeholderTextColor={placeholderTextColor || palette.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessible
        nativeID={inputId}
        accessibilityLabel={accessibilityLabel ?? label ?? rest.placeholder ?? 'Campo'}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          ...(rest.accessibilityState ?? {}),
          disabled: !editable,
        }}
        {...(ariaProps as any)}
        style={[
          {
            borderWidth: 1,
            borderColor,
            borderRadius: BorderRadius.md,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            ...Typography.body,
            color: palette.text,
            backgroundColor: palette.surface,
            opacity: editable ? 1 : 0.6,
            minHeight: 44,
            ...(Platform.OS === 'web'
              ? {
                  outlineStyle: focused ? 'solid' : 'none',
                  outlineColor: focused ? palette.borderFocused : 'transparent',
                  outlineWidth: focused ? 2 : 0,
                }
              : {}),
          },
          style as any,
        ]}
        {...rest}
      />
      {!!error && (
        <Text
          nativeID={errorId}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={{ 
            ...Typography.small,
            color: palette.error, 
            marginTop: Spacing.xs 
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
