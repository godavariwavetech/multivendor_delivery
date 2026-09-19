import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius, useTheme } from '@/theme';

import { Text } from './Text';

export type SegmentOption<K extends string> = {
  key: K;
  label: string;
  icon?: LucideIcon;
  /** Fill colour when this segment is selected; defaults to the role accent. */
  activeColor?: string;
};

/**
 * Two or three equal tabs in a sunken track; the selected tab fills with its own
 * colour. Used on sign-in to choose the Vendor or Delivery partner workspace.
 */
export function SegmentedTabs<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: ViewStyle;
}) {
  const { r } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.segTrack, style]}>
      {options.map(o => {
        const selected = o.key === value;
        const Icon = o.icon;
        const fg = selected ? palette.canvas : palette.inkMuted;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.key)}
            style={[styles.seg, selected && { backgroundColor: o.activeColor ?? r.accent }]}>
            {Icon ? <Icon size={19} color={fg} strokeWidth={2.3} /> : null}
            <Text v="bodyStrong" color={fg} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.segLabel}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "New · 2 | Cooking · 6 | Ready · 3 | Past" */
export function TabPills<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  const { r } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map(t => {
        const selected = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              styles.pill,
              selected ? { backgroundColor: r.accent, borderColor: r.accent } : styles.pillOff,
            ]}>
            <Text v="bodyStrong" color={selected ? r.onAccent : palette.ink} style={styles.pillText}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** "This month | Last month | Custom" inside a solid hero card. */
export function HeroSegment<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.heroRow}>
      {tabs.map(t => {
        const selected = t.key === value;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.heroPill, selected && styles.heroOn]}>
            <Text
              v="bodyStrong"
              color={selected ? palette.canvas : 'rgba(255, 255, 255, 0.85)'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Evenly split choice buttons: "10 m | 15 m | 20 m | 30 m", "Slow | Fine | Quick". */
export function ChoiceRow<K extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K | undefined;
  onChange: (key: K) => void;
}) {
  const { r } = useTheme();
  return (
    <View style={styles.choiceRow}>
      {options.map(o => {
        const selected = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => onChange(o.key)}
            style={[styles.choice, selected ? { backgroundColor: r.accent, borderColor: r.accent } : styles.choiceOff]}>
            <Text v="bodyStrong" color={selected ? r.onAccent : palette.ink}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segTrack: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.sunken,
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
  seg: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  segLabel: { fontSize: 15, flexShrink: 1 },
  row: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  pill: { height: 42, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center' },
  pillOff: { backgroundColor: palette.paper, borderColor: palette.line },
  pillText: { fontSize: 15 },
  heroRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  heroPill: { flexShrink: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  heroOn: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, height: 46, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  choiceOff: { backgroundColor: 'transparent', borderColor: palette.line },
});
