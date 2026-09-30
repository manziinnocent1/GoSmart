import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  blue: '#1B4DFF',
  blueSoft: '#E8EEFF',
  blueMist: '#F3F6FF',
  ink: '#05070C',
  white: '#FFFFFF',
  line: '#E3E8F4',
  muted: '#6B7385',
  onDarkMuted: '#B9C4E6',
} as const;

export const radius = { sm: 12, md: 18, lg: 28, sheet: 32, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 36, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const satisfies Record<string, TextStyle>;

export const elevation = {
  shadowColor: '#0B1B4D',
  shadowOpacity: 0.14,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
} as const satisfies ViewStyle;