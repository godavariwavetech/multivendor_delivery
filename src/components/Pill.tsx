import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius, useTheme } from '@/theme';

import { Text } from './Text';

export type PillTone = 'sky' | 'leaf' | 'neutral' | 'soft' | 'blue' | 'green' | 'outline';

/** Status chips: "42s ago", "Preparing · 6 min", "Settled", "Verified". */
export function Pill({ label, tone = 'neutral', style, strong }: { label: string; tone?: PillTone; style?: ViewStyle; strong?: boolean }) {
  const { r } = useTheme();
  const scheme = {
    sky: { bg: palette.sky, fg: palette.blueDeep, border: palette.sky },
    leaf: { bg: palette.leaf, fg: palette.greenDarkest, border: palette.leaf },
    neutral: { bg: palette.sunken, fg: palette.inkSoft, border: palette.sunken },
    soft: { bg: r.soft, fg: r.accentDeep, border: r.soft },
    blue: { bg: palette.blue, fg: palette.white, border: palette.blue },
    green: { bg: palette.green, fg: palette.white, border: palette.green },
    outline: { bg: 'transparent', fg: palette.ink, border: palette.line },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: scheme.bg, borderColor: scheme.border }, style]}>
      <Text v={strong ? 'captionStrong' : 'captionStrong'} color={scheme.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Filter / choice chip. Selected chips fill with the role colour. */
export function Chip({
  label,
  selected,
  onPress,
  tone,
  dashed,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'sky';
  dashed?: boolean;
  style?: ViewStyle;
}) {
  const { r } = useTheme();
  const bg = selected ? r.accent : tone === 'sky' ? palette.paper : 'transparent';
  const border = selected ? r.accent : tone === 'sky' ? palette.skyLine : palette.line;
  const fg = selected ? r.onAccent : dashed ? palette.inkMuted : palette.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg, borderColor: border, borderStyle: dashed ? 'dashed' : 'solid' },
        pressed && styles.pressed,
        style,
      ]}>
      <Text v="bodyStrong" color={fg} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  if (!scroll) {
    return <View style={styles.wrap}>{children}</View>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  row: { gap: 8, paddingRight: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
