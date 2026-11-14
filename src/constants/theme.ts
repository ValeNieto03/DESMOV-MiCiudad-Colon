
/**
 * Colores de la aplicación para los temas claro y oscuro.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#253A32',
    background: '#F7F3E8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DCE9E8',
    textSecondary: '#77736B',
    border: '#E5E1D8',
    inputBackground: '#FFFFFF',
    inputBorder: '#D8E4E2',
    primary: '#2F7F8F',
    onPrimary: '#FFFFFF',
    success: '#557448',
    successBackground: '#E5EFE4',
    warning: '#A36B20',
    warningBackground: '#F8EBD6',
    danger: '#A34A3A',
    dangerBackground: '#FCE8E6',
  },
  dark: {
    text: '#F1F3EC',
    background: '#171A18',
    backgroundElement: '#242926',
    backgroundSelected: '#34423B',
    textSecondary: '#B8BEB7',
    border: '#414A43',
    inputBackground: '#202522',
    inputBorder: '#46534C',
    primary: '#63B7C5',
    onPrimary: '#102629',
    success: '#A2C291',
    successBackground: '#29392D',
    warning: '#E6B66B',
    warningBackground: '#45381F',
    danger: '#F29994',
    dangerBackground: '#482A2A',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({ ios: 50, android: 80 }) ?? 0;

export const MaxContentWidth = 800;
