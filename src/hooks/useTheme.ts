import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useDietStore } from '@store/dietStore';

export type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

const lightColors: ThemeColors = {
  background: '#FFF8F1',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  primary: '#EA580C',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
};

const darkColors: ThemeColors = {
  background: '#1F1B16',
  card: '#26211C',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  primary: '#FB923C',
  border: '#374151',
  success: '#22C55E',
  warning: '#FBBF24',
  danger: '#F87171',
};

export const useThemeMode = (): ThemeMode => {
  const preference = useDietStore((state) => state.config.theme);
  const device = useColorScheme();
  if (preference === 'system') {
    return device === 'dark' ? 'dark' : 'light';
  }
  return preference;
};

export const useThemeColors = (): ThemeColors => {
  const mode = useThemeMode();
  return mode === 'dark' ? darkColors : lightColors;
};

export const useNavigationTheme = () => {
  const mode = useThemeMode();
  return useMemo(() => {
    const base = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
    const palette = mode === 'dark' ? darkColors : lightColors;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.background,
        card: palette.card,
        primary: palette.primary,
        border: palette.border,
        text: palette.text,
      },
    };
  }, [mode]);
};
