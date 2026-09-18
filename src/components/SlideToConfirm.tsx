import { ChevronRight } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { palette, radius, useTheme } from '@/theme';

import { Text } from './Text';

const HEIGHT = 60;
const KNOB = 48;
const PAD = 6;

/**
 * "Slide to mark arrived" / "Slide to confirm pickup". Drag the knob past 85% of
 * the track to confirm; anything less springs back.
 */
export function SlideToConfirm({
  label,
  onConfirm,
  color,
  disabled,
}: {
  label: string;
  onConfirm: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const { r } = useTheme();
  const fill = color ?? r.accent;
  const x = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const max = Math.max(0, width - KNOB - PAD * 2);
  const maxRef = useRef(0);
  maxRef.current = max;
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_, g) => !disabled && Math.abs(g.dx) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => {
          x.setValue(Math.max(0, Math.min(maxRef.current, g.dx)));
        },
        onPanResponderRelease: (_, g) => {
          const reached = g.dx >= maxRef.current * 0.85;
          if (reached) {
            Animated.timing(x, { toValue: maxRef.current, duration: 120, useNativeDriver: true }).start(() => {
              confirmRef.current();
              x.setValue(0);
            });
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [disabled, x],
  );

  const labelOpacity = x.interpolate({ inputRange: [0, Math.max(1, max * 0.6)], outputRange: [1, 0.15], extrapolate: 'clamp' });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: fill, opacity: disabled ? 0.5 : 1 }]}>
      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]}>
        <Text v="cardTitle" color={palette.cream} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View {...responder.panHandlers} style={[styles.knob, { transform: [{ translateX: x }] }]}>
        <ChevronRight size={24} color={fill} strokeWidth={2.6} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: HEIGHT, borderRadius: radius.pill, justifyContent: 'center' },
  labelWrap: { position: 'absolute', left: KNOB + PAD * 2 + 10, right: 16 },
  knob: {
    position: 'absolute',
    left: PAD,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
