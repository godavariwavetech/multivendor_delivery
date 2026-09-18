import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { palette, type, TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  v?: TypeVariant;
  color?: string;
  /** Secondary text, the board's warm grey. */
  muted?: boolean;
  subtle?: boolean;
  center?: boolean;
  right?: boolean;
  strike?: boolean;
};

export function Text({ v = 'body', color, muted, subtle, center, right, strike, style, ...rest }: TextProps) {
  const tone = color ?? (subtle ? palette.inkSubtle : muted ? palette.inkMuted : palette.ink);
  return (
    <RNText
      allowFontScaling={false}
      style={[
        type[v],
        { color: tone },
        center && styles.center,
        right && styles.right,
        strike && styles.strike,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  strike: { textDecorationLine: 'line-through' },
});
