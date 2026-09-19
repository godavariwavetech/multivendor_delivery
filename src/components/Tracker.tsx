import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, space, useTheme } from '@/theme';

import { Text } from './Text';

/**
 * Dots joined by lines: Accepted · Preparing · Ready · Picked up (vendor), or
 * At store · Picked up · On the way · Delivered (partner). `current` is the index
 * of the furthest step reached.
 */
export function StageTracker({ steps, current }: { steps: string[]; current: number }) {
  const { r, role } = useTheme();
  const doneLine = role === 'delivery' ? palette.leafLine : palette.skyLine;
  return (
    <View style={styles.tracker}>
      <View style={styles.dotsRow}>
        {steps.map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[styles.line, { backgroundColor: i <= current ? doneLine : palette.line }]} /> : null}
            <View style={[styles.dot, { backgroundColor: i <= current ? r.accent : palette.line }]} />
          </React.Fragment>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {steps.map((s, i) => (
          <Text
            key={s}
            v="caption"
            color={i <= current ? r.accentDeep : palette.inkSubtle}
            style={[styles.label, i === 0 && styles.first, i === steps.length - 1 && styles.last]}
            numberOfLines={1}>
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Pickup → drop route: brown dot for the store, green for the customer. */
export function RouteTimeline({
  from,
  to,
  toHollow,
}: {
  from: { title: string; subtitle: string };
  to: { title: string; subtitle: string };
  toHollow?: boolean;
}) {
  return (
    <View style={styles.route}>
      <View style={styles.rail}>
        <View style={[styles.routeDot, { backgroundColor: palette.blue }]} />
        <View style={styles.railLine} />
        <View style={[styles.routeDot, toHollow ? styles.hollow : { backgroundColor: palette.green }]} />
      </View>
      <View style={styles.routeText}>
        <View>
          <Text v="bodyStrong" style={styles.routeTitle}>
            {from.title}
          </Text>
          <Text v="body" muted>
            {from.subtitle}
          </Text>
        </View>
        <View>
          <Text v="bodyStrong" style={styles.routeTitle}>
            {to.title}
          </Text>
          <Text v="body" muted>
            {to.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const DOT = 16;

const styles = StyleSheet.create({
  tracker: { paddingVertical: space.xs },
  dotsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  line: { flex: 1, height: 3, borderRadius: 2, marginHorizontal: 8 },
  labelsRow: { flexDirection: 'row', marginTop: 6 },
  // Each label takes an equal share of the row so four of them always fit; the
  // outer two hug the card edges, under their dots.
  label: { flex: 1, textAlign: 'center', paddingHorizontal: 2 },
  first: { textAlign: 'left' },
  last: { textAlign: 'right' },
  route: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', paddingTop: 5, paddingBottom: 5 },
  routeDot: { width: 14, height: 14, borderRadius: 7 },
  hollow: { borderWidth: 3, borderColor: palette.green, backgroundColor: palette.paper },
  railLine: { flex: 1, width: 2, backgroundColor: palette.leafLineSoft, marginVertical: 3 },
  routeText: { flex: 1, gap: space.md },
  routeTitle: { fontSize: 15 },
});
