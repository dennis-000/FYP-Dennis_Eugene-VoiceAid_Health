/**
 * ==========================================
 * THEME CONSTANTS
 * ==========================================
 * Central source of truth for app styling.
 * * MODES:
 * 1. Light: Standard clinical cleanliness (Blues/Whites)
 * 2. High Contrast: For visually impaired users (Yellow on Black)
 */

export type ThemeMode = 'light' | 'high-contrast';

export const THEMES = {
  light: {
    bg: '#F8FAFC',       // Very light blue-grey background
    card: '#FFFFFF',     // Pure white cards
    text: '#1E293B',     // Slate-900 for primary text
    subText: '#64748B',  // Slate-500 for secondary text
    primary: '#2563EB',  // Royal Blue
    accent: '#3B82F6',   // Lighter Blue
    border: '#E2E8F0',   // Light border
    success: '#10B981',  // Emerald Green
    danger: '#EF4444'    // Red
  },
  'high-contrast': {
    bg: '#0F172A',       // Slate 900
    card: '#1E293B',     // Slate 800
    text: '#F8FAFC',     // Slate 50
    subText: '#94A3B8',  // Slate 400
    primary: '#3B82F6',  // Blue 500 (Matches light mode primary)
    accent: '#60A5FA',   // Blue 400
    border: '#334155',   // Slate 700
    success: '#10B981',  // Emerald 500
    danger: '#EF4444'    // Red 500
  }
};

export const Colors = {
  light: {
    text: THEMES.light.text,
    background: THEMES.light.bg,
    tint: THEMES.light.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: THEMES.light.primary,
  },
  dark: {
    text: THEMES['high-contrast'].text,
    background: THEMES['high-contrast'].bg,
    tint: THEMES['high-contrast'].primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: THEMES['high-contrast'].primary,
  },
};