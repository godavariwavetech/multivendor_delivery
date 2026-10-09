import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { VegMark } from '@/components';
import { palette } from '@/theme';

export type Diet = 'veg' | 'nonveg';

const TRACK_W = 68;
const TRACK_H = 30;
const KNOB = 38;
const STOPS = { nonveg: 0, veg: TRACK_W - KNOB } as const;

/**
 * A small veg / non-veg switch: the knob sits on the green side for veg and the
 * brown side for non-veg, and a tap flips it to the other one.
 */
export function DietSwitch({ value, onChange }: { value: Diet; onChange: (next: Diet) => void }) {
  const x = useRef(new Animated.Value(STOPS[value])).current;

  useEffect(() => {
    Animated.timing(x, { toValue: STOPS[value], duration: 160, useNativeDriver: false }).start();
  }, [x, value]);

  const veg = value === 'veg';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Veg or non-veg"
      accessibilityState={{ checked: veg }}
      accessibilityValue={{ text: veg ? 'Veg' : 'Non-veg' }}
      hitSlop={8}
      onPress={() => onChange(veg ? 'nonveg' : 'veg')}
      style={styles.wrap}>
      <Animated.View style={[styles.track, { backgroundColor: veg ? palette.veg : palette.nonVeg }]} />
      <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]}>
        <VegMark veg={veg} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: TRACK_W, height: KNOB, justifyContent: 'center' },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2 },
  knob: {
    position: 'absolute',
    left: 0,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
});
