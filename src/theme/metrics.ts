import type { ViewStyle } from 'react-native';

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 18,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

/**
 * The board's cards sit on a crisp dark edge rather than a soft drop shadow.
 * `boxShadow` needs the new architecture, which this app uses.
 */
export const shadow = {
  card: { boxShadow: '0px 1.5px 0px rgba(32, 30, 29, 0.55), 0px 3px 10px rgba(32, 30, 29, 0.05)' },
  key: { boxShadow: '0px 1.5px 0px rgba(32, 30, 29, 0.45)' },
  floating: { boxShadow: '0px 6px 16px rgba(32, 30, 29, 0.28)' },
  none: {},
} satisfies Record<string, ViewStyle>;
