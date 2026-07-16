/**
 * SafeQuake renk paleti
 * PRD §5: Material Design 3, Dark/Light Mode, büyüklüğe göre yeşil/turuncu/kırmızı
 */

export const magnitudeColors = {
  low: '#2E7D32', // 0-3: Yeşil
  medium: '#EF6C00', // 3-5: Turuncu
  high: '#C62828', // 5+: Kırmızı
} as const;

export type MagnitudeLevel = keyof typeof magnitudeColors;

export const getMagnitudeLevel = (magnitude: number): MagnitudeLevel => {
  if (magnitude >= 5) return 'high';
  if (magnitude >= 3) return 'medium';
  return 'low';
};

export const getMagnitudeColor = (magnitude: number): string =>
  magnitudeColors[getMagnitudeLevel(magnitude)];

const basePalette = {
  green: '#2E7D32',
  greenContainer: '#C8E6C9',
  orange: '#EF6C00',
  orangeContainer: '#FFE0B2',
  red: '#C62828',
  redContainer: '#FFCDD2',
};

export const lightColors = {
  ...basePalette,
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F1F1',
  onBackground: '#1B1B1B',
  onSurface: '#1B1B1B',
  onSurfaceVariant: '#4A4A4A',
  primary: '#2E7D32',
  onPrimary: '#FFFFFF',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors = {
  ...basePalette,
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  onBackground: '#EDEDED',
  onSurface: '#EDEDED',
  onSurfaceVariant: '#B0B0B0',
  primary: '#66BB6A',
  onPrimary: '#0A1F0A',
  border: '#333333',
  disabled: '#5A5A5A',
  overlay: 'rgba(0,0,0,0.7)',
};

export type AppColors = typeof lightColors;
