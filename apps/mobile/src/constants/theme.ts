export const colors = {
  bg: '#0A0C0A',
  surface1: '#161916',
  surface2: '#1E221D',
  surface3: '#272C25',
  hairline: 'rgba(255,255,255,0.07)',
  hairline2: 'rgba(255,255,255,0.11)',
  text: '#F0F3EA',
  textDim: '#A4AB9C',
  textFaint: '#6A7164',
  accent: '#C8FA4B',
  accentInk: '#0C1003',
  accentSoft: 'rgba(200,250,75,0.14)',
  accentLine: 'rgba(200,250,75,0.34)',
  accentGlow: 'rgba(200,250,75,0.30)',
  warn: '#F5B73E',
  danger: '#FF6F5E',
} as const

export const radii = {
  card: 20,
  sheet: 26,
  sm: 12,
  pill: 999,
} as const

export const fontFamilies = {
  ui: 'SpaceGrotesk_500Medium',
  uiBold: 'SpaceGrotesk_700Bold',
  uiSemiBold: 'SpaceGrotesk_600SemiBold',
  mono: 'JetBrainsMono_600SemiBold',
} as const

export type Colors = typeof colors
export type Radii = typeof radii
