import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, pastel, pastelEdge, type PastelName, radius, shadow, space, useTheme } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

/** "4 New" / "38 km Distance" / "₹740 Today". Highlighted tiles use the role's soft colour. */
export function StatTile({
  value,
  unit,
  label,
  highlight,
  tone,
  icon,
  onPress,
  small,
}: {
  value: string;
  unit?: string;
  label: string;
  highlight?: boolean;
  /** A soft pastel fill that suits any theme colour; the number and label take that pastel's ink. */
  tone?: PastelName;
  /** With a tone, shows this icon in a round chip above the number, and a chevron when the tile can be tapped. */
  icon?: LucideIcon;
  onPress?: () => void;
  small?: boolean;
}) {
  const { r } = useTheme();
  const toned = tone
    ? { backgroundColor: palette.paper, borderWidth: 1, borderColor: pastelEdge(tone), ink: pastel[tone].ink, muted: pastel[tone].ink }
    : null;
  const ink = toned?.ink ?? (highlight ? r.accentDeep : palette.ink);
  const muted = toned?.muted ?? (highlight ? r.accentDeep : palette.inkMuted);
  const content = (
    <View
      style={[
        styles.tile,
        toned
          ? { backgroundColor: toned.backgroundColor, borderWidth: toned.borderWidth, borderColor: toned.borderColor }
          : highlight
            ? { backgroundColor: r.soft }
            : styles.tilePaper,
      ]}>
      {small ? (
        <Text v="caption" muted>
          {label}
        </Text>
      ) : null}
      {tone && icon && !small ? <IconBubble icon={icon} tone={tone} style={styles.tileIcon} /> : null}
      <View style={styles.tileBottom}>
        <View style={styles.flex}>
          <View style={styles.tileValue}>
            <Text v="stat" color={ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {value}
            </Text>
            {unit ? (
              <Text v="bodyStrong" color={ink} style={styles.unit}>
                {unit}
              </Text>
            ) : null}
          </View>
          {!small ? (
            <Text v="body" color={muted}>
              {label}
            </Text>
          ) : null}
        </View>
        {tone && icon && onPress && !small ? <ChevronRight size={20} color={pastel[tone].ink} strokeWidth={2.2} /> : null}
      </View>
    </View>
  );
  return (
    <View style={styles.flex}>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

/** A round chip holding an icon, in a pastel's own colours. */
export function IconBubble({ icon: Icon, tone, size = 40, style }: { icon: LucideIcon; tone: PastelName; size?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: pastel[tone].bubble }, style]}>
      <Icon size={size * 0.5} color={pastel[tone].accent} strokeWidth={2.2} />
    </View>
  );
}

export function TileRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.tileRow}>{children}</View>;
}

export function Avatar({ initials, size = 50, tone }: { initials: string; size?: number; tone?: 'soft' | 'onDark' | PastelName }) {
  const { r } = useTheme();
  const pastelTone = tone && tone !== 'soft' && tone !== 'onDark' ? pastel[tone] : null;
  const bg = pastelTone ? pastelTone.bubble : tone === 'onDark' ? 'rgba(255, 255, 255, 0.22)' : r.soft;
  const fg = pastelTone ? pastelTone.ink : tone === 'onDark' ? palette.canvas : r.accentDeep;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text v="cardTitle" color={fg} style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
        {initials}
      </Text>
    </View>
  );
}

/** Indian food-safety marker: green square for veg, brown for non-veg. */
export function VegMark({ veg, faded }: { veg: boolean; faded?: boolean }) {
  const color = veg ? palette.veg : palette.nonVeg;
  return (
    <View style={[styles.veg, { borderColor: color, opacity: faded ? 0.5 : 1 }]}>
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * A product or proof photo. With a `uri` it shows the image; without one it is
 * the placeholder. Given `onPress` it becomes the control that replaces it.
 */
export function PhotoBox({
  size = 84,
  faded,
  label = 'PHOTO',
  uri,
  onPress,
  busy,
}: {
  size?: number;
  faded?: boolean;
  label?: string;
  uri?: string;
  onPress?: () => void;
  busy?: boolean;
}) {
  const box = [styles.photo, { width: size, height: size, opacity: faded ? 0.55 : 1 }];
  const body = uri ? (
    <Image source={{ uri }} style={[styles.photoImage, { width: size, height: size }]} resizeMode="cover" />
  ) : (
    <Text v="caption" subtle>
      {busy ? '…' : label}
    </Text>
  );

  if (!onPress) {
    return <View style={box}>{body}</View>;
  }
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [...box, pressed && styles.photoPressed]}>
      {body}
      {uri ? (
        <View style={styles.photoEdit}>
          <Text v="caption" color={palette.white}>
            {busy ? '…' : 'Change'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ProgressBar({ progress, color, style }: { progress: number; color?: string; style?: ViewStyle }) {
  const { r } = useTheme();
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? r.accent }]} />
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const { r } = useTheme();
  return (
    <Card style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: r.soft }]}>
        <Icon size={26} color={r.accentDeep} strokeWidth={2} />
      </View>
      <Text v="cardTitle" center>
        {title}
      </Text>
      <Text v="body" muted center>
        {body}
      </Text>
      {action ? <Button label={action} onPress={onAction} size="sm" style={styles.emptyAction} /> : null}
    </Card>
  );
}

/** Extended floating action: "+ Add dish". */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  const { r } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: r.accent, opacity: pressed ? 0.88 : 1 }]}>
      <Plus size={22} color={r.onAccent} strokeWidth={2.4} />
      <Text v="cardTitle" color={r.onAccent}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tile: { borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md + 2, minHeight: 84, justifyContent: 'center' },
  tilePaper: { backgroundColor: palette.paper, ...shadow.card },
  tileValue: { flexDirection: 'row', alignItems: 'flex-end' },
  tileBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  tileIcon: { marginBottom: space.sm },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  unit: { marginLeft: 2, marginBottom: 3 },
  tileRow: { flexDirection: 'row', gap: 10 },
  pressed: { opacity: 0.8 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  veg: { width: 17, height: 17, borderWidth: 1.6, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  photo: { borderRadius: radius.md, backgroundColor: palette.sunken, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { borderRadius: radius.md },
  photoPressed: { opacity: 0.85 },
  photoEdit: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingVertical: 3,
    backgroundColor: 'rgba(26, 29, 33, 0.55)',
  },
  track: { height: 7, borderRadius: 4, backgroundColor: palette.lineSoft, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  emptyAction: { marginTop: space.sm },
  fab: {
    position: 'absolute',
    right: space.gutter,
    bottom: space.lg,
    height: 54,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow.floating,
  },
});
