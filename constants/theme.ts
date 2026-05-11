/**
 * ==========================================
 * THEME CONSTANTS
 * ==========================================
 * Central source of truth for app styling.
 * * MODES:
 * 1. Light: Clean, human feel with off-white background and warm accents
 * 2. Dark: High contrast, premium feel with deep black and gold accents
 */

export type ThemeMode = 'light' | 'dark';

export const THEMES = {
  light: {
    bg: '#FAFAFA',       // Clean Off-White
    card: '#FFFFFF',     // Pure White
    text: '#111111',     // Deep Black
    subText: '#64748B',  // Slate 500
    primary: '#008000',  // Kente Green - Healing, Growth
    accent: '#FFD700',   // Kente Gold - Warm, Human
    border: '#E2E8F0',   // Slate 200
    success: '#008000',  // Kente Green
    danger: '#CC0000'    // Kente Red
  },
  dark: {
    bg: '#111111',       // Deep Black
    card: '#222222',     // Slightly lighter black
    text: '#FAFAFA',     // Off-White
    subText: '#94A3B8',  // Slate 400
    primary: '#FFD700',  // Kente Gold - Pops on dark
    accent: '#008000',   // Kente Green
    border: '#333333',   // Dark Border
    success: '#008000',  // Kente Green
    danger: '#CC0000'    // Kente Red
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
    text: THEMES.dark.text,
    background: THEMES.dark.bg,
    tint: THEMES.dark.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: THEMES.dark.primary,
  },
};