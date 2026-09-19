import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette, radius, space, useTheme } from '@/theme';

import { Text } from './Text';

/** The small rising bars on the vendor "Today" card. */
export function MiniBars({ values, height = 52 }: { values: number[]; height?: number }) {
  return (
    <View style={[styles.miniBars, { height }]}>
      {values.map((v, i) => {
        const color = i >= values.length - 1 ? palette.blue : i >= values.length - 3 ? palette.blueMid : palette.skyLine;
        return <View key={i} style={[styles.miniBar, { height: Math.max(8, v * height), backgroundColor: color }]} />;
      })}
    </View>
  );
}

/** Blocky bars on the partner's green earnings card; the latest day is solid white. */
export function HeroBars({ values, height = 50 }: { values: number[]; height?: number }) {
  return (
    <View style={[styles.heroBars, { height }]}>
      {values.map((v, i) => {
        const last = i === values.length - 1;
        const color = last ? palette.white : i === values.length - 2 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.34)';
        return <View key={i} style={[styles.heroBar, { height: Math.max(12, v * height), backgroundColor: color }]} />;
      })}
    </View>
  );
}

/** "Daily sales · Last 7 days" chart on the vendor Earnings tab. */
export function DayBars({
  data,
  height = 90,
}: {
  data: { day: string; value: number; tone: 'light' | 'mid' | 'dark' }[];
  height?: number;
}) {
  const tone = { light: palette.skyLine, mid: palette.blueMid, dark: palette.blue };
  return (
    <View style={styles.dayBars}>
      {data.map(d => (
        <View key={d.day} style={styles.dayCol}>
          <View style={[styles.dayTrack, { height }]}>
            <View style={[styles.dayBar, { height: Math.max(10, d.value * height), backgroundColor: tone[d.tone] }]} />
          </View>
          <Text v="caption" subtle>
            {d.day}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Countdown ring on the incoming-request sheet. */
export function CountdownRing({ seconds, total, size = 66 }: { seconds: number; total: number; size?: number }) {
  const { r: role } = useTheme();
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, seconds / total));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={role.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringLabel]}>
        <Text v="cardTitle" style={styles.ringNumber}>
          {Math.max(0, Math.ceil(seconds))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  miniBar: { width: 11, borderRadius: 6 },
  heroBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroBar: { flex: 1, borderRadius: 8 },
  dayBars: { flexDirection: 'row', gap: 8, marginTop: space.md },
  dayCol: { flex: 1, alignItems: 'center', gap: 6 },
  dayTrack: { width: '100%', justifyContent: 'flex-end' },
  dayBar: { width: '100%', borderRadius: radius.sm - 2 },
  ringLabel: { alignItems: 'center', justifyContent: 'center' },
  ringNumber: { fontSize: 18 },
});
