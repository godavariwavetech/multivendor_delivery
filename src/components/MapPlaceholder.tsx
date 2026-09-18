import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { palette, radius } from '@/theme';

import { Text } from './Text';

/**
 * Stand-in for the maps SDK, drawn like the board's "LIVE MAP · MAPS SDK" block:
 * pale roads, a brown store pin and a green customer pin. Swap the body for a real
 * map view once a provider is chosen; overlays are positioned against this box.
 */
export function MapPlaceholder({
  height = 260,
  children,
  style,
  flipPins,
}: {
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
  flipPins?: boolean;
}) {
  return (
    <View style={[styles.map, { height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Line x1="120" y1="-10" x2="70" y2="270" stroke={palette.lineSoft} strokeWidth="14" />
        <Line x1="-10" y1="150" x2="420" y2="85" stroke={palette.lineSoft} strokeWidth="12" />
        <Line x1="250" y1="270" x2="410" y2="200" stroke={palette.lineSoft} strokeWidth="8" />
        <Circle cx={flipPins ? 300 : 70} cy={flipPins ? 40 : 90} r="11" fill={palette.white} />
        <Circle cx={flipPins ? 300 : 70} cy={flipPins ? 40 : 90} r="6.5" fill={palette.clay} />
        <Circle cx={flipPins ? 100 : 312} cy={flipPins ? 150 : 175} r="11" fill={palette.white} />
        <Circle cx={flipPins ? 100 : 312} cy={flipPins ? 150 : 175} r="6.5" fill={palette.sage} />
      </Svg>
      <View style={styles.chipWrap} pointerEvents="none">
        <View style={styles.chip}>
          <Text v="label" subtle>
            Live map · maps SDK
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { backgroundColor: '#EDE6DA', overflow: 'hidden' },
  chipWrap: { position: 'absolute', top: '42%', left: 0, right: 0, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(249, 244, 237, 0.85)',
  },
});
