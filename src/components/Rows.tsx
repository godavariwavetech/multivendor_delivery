import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

import { formatAmount } from '@/utils/currency';
import { palette, space, useTheme } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

/** Uppercase, letter-spaced label: BREAKDOWN, DELIVER TO, HANDOVER CODE. */
export function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <Text v="label" muted style={[styles.sectionLabel, style]}>
      {children}
    </Text>
  );
}

/** "New order ········ See all 4" */
export function SectionHeader({
  title,
  action,
  onAction,
  actionColor,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  actionColor?: string;
}) {
  const { r } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text v="headline" style={styles.sectionTitle}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} disabled={!onAction}>
          <Text v="bodyStrong" color={actionColor ?? r.accent}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Label on the left, value on the right. */
export function KeyValue({
  label,
  value,
  strong,
  valueColor,
  style,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueColor?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.kv, style]}>
      <Text v="body" muted style={styles.kvLabel}>
        {label}
      </Text>
      <Text v={strong ? 'bodyStrong' : 'body'} color={valueColor} right style={styles.kvValue}>
        {value}
      </Text>
    </View>
  );
}

/** A money line in a breakdown; negative amounts render as deductions. */
export function AmountRow({ label, amount, total }: { label: string; amount: number; total?: boolean }) {
  const text = amount < 0 ? `−${formatAmount(-amount)}` : formatAmount(amount);
  if (total) {
    return (
      <>
        <Divider style={styles.totalDivider} />
        <View style={styles.kv}>
          <Text v="cardTitle">{label}</Text>
          <Text v="cardTitle">{text}</Text>
        </View>
      </>
    );
  }
  return <KeyValue label={label} value={text} />;
}

/** A settings-style group of rows inside one card. */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Card padded={false} style={style}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <Divider style={styles.groupDivider} /> : null}
          {child}
        </View>
      ))}
    </Card>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  right,
  onPress,
  chevron = true,
  danger,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text v="bodyStrong" color={danger ? palette.clayMid : undefined} style={styles.listTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text v="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text v="body" subtle numberOfLines={1} style={styles.listValue}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && chevron && !right ? <ChevronRight size={20} color={palette.inkSubtle} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: palette.lineSoft },
  sectionLabel: { marginBottom: space.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    marginBottom: space.xs,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 17 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: space.md },
  kvLabel: { flexShrink: 1 },
  kvValue: { flexShrink: 1 },
  totalDivider: { marginVertical: space.sm },
  groupDivider: { marginHorizontal: 0 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    minHeight: 58,
    paddingVertical: space.md,
  },
  listTitle: { fontSize: 15 },
  listValue: { flexShrink: 1, textAlign: 'right' },
  pressed: { backgroundColor: 'rgba(32, 30, 29, 0.04)' },
  flex: { flex: 1 },
});
