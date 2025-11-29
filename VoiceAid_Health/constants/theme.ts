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
    bg: '#000000',       // Pure Black
    card: '#1C1C1E',     // Dark Grey cards
    text: '#FFFFFF',     // Pure White text
    subText: '#D1D1D6',  // Light Grey text
    primary: '#FFD700',  // Gold/Yellow (Best contrast on black)
    accent: '#FFFFFF',   // White accent
    border: '#FFFFFF',   // White borders
    success: '#00FF00',  // Neon Green
    danger: '#FF0000'    // Bright Red
  }
};