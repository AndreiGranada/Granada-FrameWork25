import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeStore } from '@/src/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, PressableStateCallbackType, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
};

export default function ScreenHeader({
  title,
  subtitle,
  rightComponent,
  showBackButton = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeStore();
  const palette = Colors[mode];

  const handleBack = () => {
    if (!showBackButton) {
      return;
    }
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    } catch {
      router.replace('/home');
    }
  };

  const baseButtonStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const backButtonStyle = ({ pressed, hovered, focused }: PressableStateCallbackType & { hovered?: boolean; focused?: boolean }): ViewStyle[] => {
    const styles: ViewStyle[] = [baseButtonStyle];
    if (pressed || hovered) {
      styles.push({ backgroundColor: palette.surfaceElevated });
    }
    if (focused) {
      styles.push({ borderWidth: 2, borderColor: palette.borderFocused });
    }
    return styles;
  };

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: palette.background, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          gap: Spacing.md,
        }}
      >
        {showBackButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={handleBack}
            android_ripple={{ color: `${palette.primary}22`, borderless: true }}
            style={backButtonStyle}
          >
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={22} color={palette.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={{ flex: 1, minHeight: 40, justifyContent: 'center' }}>
          {title ? (
            <Text style={{ ...Typography.h4, color: palette.text }} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={{ ...Typography.caption, color: palette.textSecondary }} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightComponent ? <View style={{ flexShrink: 0 }}>{rightComponent}</View> : <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}
