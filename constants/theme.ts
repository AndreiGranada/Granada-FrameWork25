/**
 * Design System - MedicalTime App
 * Refined color palette and spacing system for consistent UI
 */

import { Platform } from 'react-native';

// Brand palette: Modern Blue with refined grays
const primary = '#007AFF';
const primaryDark = '#0051D5';
const primaryLight = '#4DA3FF';

export const Colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#1C1C1E',
    textSecondary: '#6C6C70',
    textTertiary: '#8E8E93',

    // Brand
    tint: primary,
    primary: primary,
    primaryDark: primaryDark,

    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',

    // Interactive
    icon: '#1C1C1E',
    border: '#E5E5EA',
    borderFocused: primary,

    // Tabs
    tabIconDefault: '#8E8E93',
    tabIconSelected: primary,

    // Special
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  dark: {
    // Backgrounds
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',

    // Text
    text: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textTertiary: '#8E8E93',

    // Brand
    tint: primary,
    primary: primary,
    primaryDark: primaryLight,

    // Status colors
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',

    // Interactive
    icon: '#FFFFFF',
    border: '#38383A',
    borderFocused: primary,

    // Tabs
    tabIconDefault: '#8E8E93',
    tabIconSelected: primary,

    // Special
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

// Typography scale
export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodySemiBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  smallMedium: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

// Border radius system
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
