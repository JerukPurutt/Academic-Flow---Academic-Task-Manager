export const darkColors = {
  bgDeep: '#0b0b14',
  bgMain: '#121222',
  bgGlass: 'rgba(26, 26, 44, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#6366f1',
  secondary: '#3b82f6',
  accentPurple: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

export const lightColors = {
  bgDeep: '#f8fafc',
  bgMain: '#ffffff',
  bgGlass: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(15, 23, 42, 0.08)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#4f46e5',
  secondary: '#2563eb',
  accentPurple: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
};

export const theme = {
  colors: darkColors, // Default dark theme colors
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
  }
};
export type ThemeColors = typeof darkColors;
