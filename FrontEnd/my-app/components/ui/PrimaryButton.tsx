import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, PressableProps, PressableStateCallbackType, Text, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle | ViewStyle[];
};

export default function PrimaryButton({
  title,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  android_ripple,
  ...rest
}: Props) {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const isDisabled = disabled || loading;
  const focusRingColor = palette.borderFocused ?? palette.primary;
  const styleArray = Array.isArray(style) ? style : style ? [style] : [];
  
  // Size configurations
  const sizeConfig = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, ...Typography.captionMedium },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, ...Typography.bodyMedium },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, ...Typography.bodySemiBold },
  };
  
  // Variant configurations
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: palette.primary,
          borderColor: palette.primary,
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: palette.border,
          textColor: palette.text,
        };
      case 'danger':
        return {
          backgroundColor: palette.error,
          borderColor: palette.error,
          textColor: '#FFFFFF',
        };
      case 'success':
        return {
          backgroundColor: palette.success,
          borderColor: palette.success,
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: palette.primary,
          borderColor: palette.primary,
          textColor: '#FFFFFF',
        };
    }
  };
  
  const variantStyle = getVariantStyle();
  const { paddingVertical, paddingHorizontal, fontSize, fontWeight } = sizeConfig[size];

  const baseStyle: ViewStyle = {
    opacity: isDisabled ? 0.6 : 1,
    paddingVertical,
    paddingHorizontal,
    borderRadius: BorderRadius.md,
    backgroundColor: variantStyle.backgroundColor,
    borderWidth: 1,
    borderColor: variantStyle.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size === 'sm' ? 36 : size === 'md' ? 44 : 52,
  };

  const focusStyle: ViewStyle = Platform.select({
    web: {
      outlineStyle: 'solid',
      outlineWidth: 3,
      outlineColor: focusRingColor,
    },
    default: {
      shadowColor: focusRingColor,
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 4,
    },
  }) as ViewStyle;

  return (
    <Pressable
      disabled={isDisabled}
      android_ripple={android_ripple ?? { color: `${focusRingColor}33`, borderless: false }}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ ...(accessibilityState ?? {}), disabled: isDisabled, busy: !!loading }}
      focusable
      style={(state: PressableStateCallbackType & { focused?: boolean; hovered?: boolean }) => {
        const { pressed, focused, hovered } = state;
        return [
          baseStyle,
          pressed && !isDisabled ? { transform: [{ scale: Platform.OS === 'web' ? 0.99 : 0.98 }] } : null,
          focused ? focusStyle : null,
          hovered && !isDisabled ? { opacity: 0.9 } : null,
          ...styleArray,
        ];
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size={size === 'sm' ? 'small' : 'small'} />
      ) : (
        <Text style={{ 
          color: variantStyle.textColor, 
          fontSize,
          fontWeight,
        }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
