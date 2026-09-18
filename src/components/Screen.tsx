import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, space } from '@/theme';

import { BackButton, BellButton } from './Button';
import { Avatar } from './Misc';
import { Pill, PillTone } from './Pill';
import { Text } from './Text';

type ScreenProps = {
  children: React.ReactNode;
  /** Screens inside a tab navigator sit above the tab bar, so they skip the bottom inset. */
  tab?: boolean;
  scroll?: boolean;
  /** Sticky action bar under the content: "Accept & start preparing", "Save item". */
  footer?: React.ReactNode;
  /** Pinned under the header, outside the scroll area. */
  overlay?: React.ReactNode;
  contentStyle?: ViewStyle;
  bleed?: boolean;
  edges?: Edge[];
  gap?: number;
};

export function Screen({ children, tab, scroll = true, footer, overlay, contentStyle, bleed, edges, gap = 10 }: ScreenProps) {
  const safeEdges: Edge[] = edges ?? (tab || footer ? ['top'] : ['top', 'bottom']);
  const body = [styles.content, { gap }, bleed && styles.bleed, contentStyle];
  return (
    <SafeAreaView edges={safeEdges} style={styles.root}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[body, styles.scrollPad]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, body]}>{children}</View>
      )}
      {overlay}
      {footer ? <BottomBar>{footer}</BottomBar> : null}
    </SafeAreaView>
  );
}

export function BottomBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>{children}</View>;
}

/** Large tab title with an optional right-hand link or note. */
export function TitleHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleHeader}>
      <Text v="title">{title}</Text>
      {right}
    </View>
  );
}

/** Round back button, title, subtitle and an optional status pill. */
export function BackHeader({
  title,
  subtitle,
  onBack,
  pill,
  pillTone = 'soft',
  right,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  pill?: string;
  pillTone?: PillTone;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.backHeader}>
      <BackButton onPress={onBack} />
      <View style={styles.flex}>
        <Text v="headline" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text v="body" muted numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {pill ? <Pill label={pill} tone={pillTone} /> : null}
      {right}
    </View>
  );
}

/** Home header: avatar, name, live status line and the notification bell. */
export function HomeHeader({
  initials,
  name,
  status,
  statusDot,
  statusColor,
  onBell,
  unread,
}: {
  initials: string;
  name: string;
  status: string;
  statusDot?: boolean;
  statusColor?: string;
  onBell: () => void;
  unread?: boolean;
}) {
  return (
    <View style={styles.homeHeader}>
      <Avatar initials={initials} />
      <View style={styles.flex}>
        <Text v="headline" numberOfLines={1}>
          {name}
        </Text>
        <Text v={statusDot ? 'bodyStrong' : 'body'} color={statusColor} muted={!statusColor} numberOfLines={1}>
          {statusDot ? '● ' : ''}
          {status}
        </Text>
      </View>
      <BellButton onPress={onBell} dot={unread} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.gutter, paddingTop: space.sm },
  scrollPad: { paddingBottom: space.xxl + 60 },
  bleed: { paddingHorizontal: 0, paddingTop: 0 },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.md,
  },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  homeHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
});
