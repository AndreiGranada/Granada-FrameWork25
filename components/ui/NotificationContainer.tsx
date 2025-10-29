import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useNotificationsStore, type Notification, type NotificationKind } from '@/src/store/notificationsStore';
import { useThemeStore } from '@/src/store/themeStore';
import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const { hide } = useNotificationsStore();
  
  const getStatusColors = (kind: NotificationKind) => {
    switch (kind) {
      case 'success':
        return {
          background: palette.success,
          text: '#FFFFFF',
          border: palette.success,
        };
      case 'error':
        return {
          background: palette.error,
          text: '#FFFFFF',
          border: palette.error,
        };
      case 'warning':
        return {
          background: palette.warning,
          text: '#FFFFFF',
          border: palette.warning,
        };
      case 'info':
      default:
        return {
          background: palette.primary,
          text: '#FFFFFF',
          border: palette.primary,
        };
    }
  };
  
  const colors = getStatusColors(notification.kind);

  useEffect(() => {
    if (notification.kind === 'error' || notification.kind === 'warning') {
      AccessibilityInfo.announceForAccessibility(notification.message);
    }
  }, [notification.kind, notification.message]);
  
  return (
    <Pressable
      onPress={() => hide(notification.id)}
      accessibilityRole="button"
      accessibilityLabel={`Notificação ${notification.kind === 'error' ? 'de erro' : notification.kind === 'warning' ? 'de aviso' : 'informativa'}`}
      accessibilityHint="Toque para dispensar a notificação"
      accessibilityLiveRegion={notification.kind === 'error' ? 'assertive' : 'polite'}
      focusable
      android_ripple={{ color: `${colors.text}33`, borderless: false }}
      style={(state) => {
        const { pressed } = state;
        const focused = (state as any).focused as boolean | undefined;
        const hovered = (state as any).hovered as boolean | undefined;
        return [{
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        ...(Platform.OS === 'ios' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }),
        ...(Platform.OS === 'android' && {
          elevation: 4,
        }),
        ...(focused
          ? {
              borderColor: palette.borderFocused,
              shadowColor: palette.borderFocused,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 6,
            }
          : {}),
        ...(pressed ? { opacity: 0.85 } : {}),
        ...(hovered ? { opacity: 0.9 } : {}),
      }];
      }}
    >
      <Text
        style={{
          ...Typography.bodyMedium,
          color: colors.text,
          flex: 1,
          marginRight: Spacing.sm,
        }}
      >
        {notification.message}
      </Text>
      
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          ...Typography.small,
          color: colors.text,
          opacity: 0.8,
        }}
      >
        ✕
      </Text>
    </Pressable>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotificationsStore();
  const insets = useSafeAreaInsets();
  
  if (notifications.length === 0) return null;
  
  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + Spacing.lg,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'box-none',
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </View>
  );
};