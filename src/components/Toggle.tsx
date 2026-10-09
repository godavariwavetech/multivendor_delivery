import { Check } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { palette, space, useTheme } from '@/theme';

import { Text } from './Text';

const TRACK_W = 52;
const TRACK_H = 30;
const KNOB = 24;

/** The board's switch: the workspace's accent when on, white knob. */
export function Toggle({
  value,
  onChange,
  onDark,
  disabled,
}: {
  value: boolean;
  onChange?: (next: boolean) => void;
  onDark?: boolean;
  disabled?: boolean;
}) {
  const { r } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [anim, value]);

  const trackOn = onDark ? 'rgba(255, 255, 255, 0.32)' : r.accent;
  const trackOff = onDark ? 'rgba(255, 255, 255, 0.18)' : palette.lineSoft;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange?.(!value)}>
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [trackOff, trackOn] }),
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: value || onDark ? palette.white : palette.paper,
              transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [3, TRACK_W - KNOB - 3] }) }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  const { r } = useTheme();
  return (
    <View style={[styles.box, checked ? { backgroundColor: r.accent } : styles.boxOff]}>
      {checked ? <Check size={16} color={r.onAccent} strokeWidth={3} /> : null}
    </View>
  );
}

/** A tappable checklist line: "2 sealed parcels collected". */
export function ChecklistRow({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <Checkbox checked={checked} />
      <Text v="body" style={styles.flex}>
        {label}
        {hint ? <Text v="body" muted>{` ${hint}`}</Text> : null}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, justifyContent: 'center' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2 },
  box: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  boxOff: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  pressed: { opacity: 0.7 },
  flex: { flex: 1 },
});
