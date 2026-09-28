import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { Text } from './Text';

export type CardTone =
  | 'paper' // standard card with the dark bottom edge
  | 'highlight' // paper + role-coloured border (new order, active trip)
  | 'sky' // blue wash + blue border (pending payout, warnings)
  | 'leaf' // green fill, no border (instructions, "food ready" banners)
  | 'accent' // solid role colour (hero cards)
  | 'blue'
  | 'green'
  | 'sunken' // flat note boxes
  | 'selected'; // role picker selection

type CardProps = {
  children: React.ReactNode;
  tone?: CardTone;
  padded?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Card({ children, tone = 'paper', padded = true, onPress, style }: CardProps) {
  const { r } = useTheme();

  const toneStyle: ViewStyle = {
    paper: { backgroundColor: palette.paper, ...shadow.card },
    highlight: { backgroundColor: palette.paper, borderWidth: 1.5, borderColor: r.line },
    sky: { backgroundColor: palette.skyWash, borderWidth: 1, borderColor: palette.skyLine },
    leaf: { backgroundColor: palette.leaf },
    accent: { backgroundColor: r.accent },
    blue: { backgroundColor: palette.blue },
    green: { backgroundColor: palette.green },
    sunken: { backgroundColor: palette.sunken },
    selected: { backgroundColor: palette.skyWash, borderWidth: 1.5, borderColor: palette.blue },
  }[tone];

  const body = (
    <View style={[styles.card, padded && styles.padded, toneStyle, style]}>{children}</View>
  );

  if (!onPress) {
    return body;
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

/** Title + body callout: "Hot bag required", "Rejecting needs a reason". */
export function Banner({
  title,
  body,
  tone = 'leaf',
  right,
  children,
  style,
}: {
  title: string;
  body?: string;
  tone?: 'leaf' | 'sky' | 'blue' | 'green' | 'accent';
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const onDark = tone === 'blue' || tone === 'green' || tone === 'accent';
  const titleColor = onDark ? palette.canvas : tone === 'sky' ? palette.blueDeep : palette.greenDarkest;
  const bodyColor = onDark ? 'rgba(255, 255, 255, 0.86)' : tone === 'sky' ? palette.blueDeep : palette.greenDeep;
  return (
    <Card tone={tone} style={style}>
      <View style={styles.bannerRow}>
        <View style={styles.flex}>
          <Text v={onDark ? 'cardTitle' : 'bodyStrong'} color={titleColor}>
            {title}
          </Text>
          {body ? (
            <Text v="body" color={bodyColor} style={styles.bannerBody}>
              {body}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </Card>
  );
}

export function NoteBox({ children, style }: { children: string; style?: ViewStyle }) {
  return (
    <Card tone="sunken" style={style}>
      <Text v="body" muted>
        {children}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg },
  padded: { padding: 14 },
  pressed: { opacity: 0.88 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bannerBody: { marginTop: 3 },
  flex: { flex: 1 },
});
