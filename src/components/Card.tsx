import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { Text } from './Text';

export type CardTone =
  | 'paper' // standard card with the dark bottom edge
  | 'highlight' // paper + role-coloured border (new order, active trip)
  | 'peach' // peach wash + peach border (pending payout, warnings)
  | 'mint' // mint fill, no border (instructions, "food ready" banners)
  | 'accent' // solid role colour (hero cards)
  | 'clay'
  | 'sage'
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
    highlight: { backgroundColor: palette.paper, borderWidth: 2, borderColor: r.line },
    peach: { backgroundColor: palette.peachWash, borderWidth: 1.5, borderColor: palette.peachLine },
    mint: { backgroundColor: palette.mint },
    accent: { backgroundColor: r.accent },
    clay: { backgroundColor: palette.clay },
    sage: { backgroundColor: palette.sage },
    sunken: { backgroundColor: palette.sunken },
    selected: { backgroundColor: palette.peachWash, borderWidth: 2, borderColor: palette.clay },
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
  tone = 'mint',
  right,
  children,
  style,
}: {
  title: string;
  body?: string;
  tone?: 'mint' | 'peach' | 'clay' | 'sage' | 'accent';
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const onDark = tone === 'clay' || tone === 'sage' || tone === 'accent';
  const titleColor = onDark ? palette.cream : tone === 'peach' ? palette.clayDeep : palette.sageDarkest;
  const bodyColor = onDark ? 'rgba(249, 244, 237, 0.86)' : tone === 'peach' ? palette.clayDeep : palette.sageDeep;
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
  padded: { padding: space.lg },
  pressed: { opacity: 0.88 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bannerBody: { marginTop: 3 },
  flex: { flex: 1 },
});
