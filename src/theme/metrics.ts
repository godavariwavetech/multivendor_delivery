import type { ViewStyle } from 'react-native';

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 16,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/**
 * The board's cards sit on a crisp dark edge rather than a soft drop shadow.
 * `boxShadow` needs the new architecture, which this app uses.
 */
export const shadow = {
  card: { boxShadow: '0px 1px 0px rgba(26, 29, 33, 0.35), 0px 3px 10px rgba(26, 29, 33, 0.04)' },
  key: { boxShadow: '0px 1px 0px rgba(26, 29, 33, 0.3)' },
  floating: { boxShadow: '0px 6px 16px rgba(26, 29, 33, 0.28)' },
  none: {},
} satisfies Record<string, ViewStyle>;
