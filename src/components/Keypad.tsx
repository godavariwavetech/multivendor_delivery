import { Delete } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { Text } from './Text';

/**
 * OTP / code boxes. Filled boxes take the role's soft border, the next empty box
 * is outlined in the role colour with a caret, the rest stay plain.
 */
export function CodeBoxes({ value, length, error }: { value: string; length: number; error?: boolean }) {
  const { r } = useTheme();
  return (
    <View style={styles.boxes}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        const active = i === value.length;
        const borderColor = error ? palette.clayMid : active ? r.accent : filled ? r.line : palette.line;
        return (
          <View key={i} style={[styles.box, { borderColor, borderWidth: active ? 2.5 : 1.5 }, length === 4 && styles.boxLarge]}>
            {filled ? (
              <Text v="title" style={length === 4 ? styles.digitLarge : undefined}>
                {value[i]}
              </Text>
            ) : active ? (
              <View style={[styles.caret, { backgroundColor: r.accent }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function NumericKeypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <View style={styles.pad}>
      {KEYS.map((k, i) =>
        k === '' ? (
          <View key={i} style={styles.keySpacer} />
        ) : (
          <Pressable
            key={i}
            accessibilityLabel={k === 'del' ? 'Delete' : k}
            onPress={() => onKey(k)}
            style={({ pressed }) => [k === 'del' ? styles.keyBare : styles.key, pressed && styles.keyPressed]}>
            {k === 'del' ? (
              <Delete size={26} color={palette.inkMuted} strokeWidth={2} />
            ) : (
              <Text v="keypad">{k}</Text>
            )}
          </Pressable>
        ),
      )}
    </View>
  );
}

/** Applies a keypad key to a code string. */
export const applyKey = (value: string, key: string, length: number) =>
  key === 'del' ? value.slice(0, -1) : value.length < length ? value + key : value;

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 10 },
  box: {
    flex: 1,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLarge: { height: 66 },
  digitLarge: { fontSize: 28, lineHeight: 34 },
  caret: { width: 2.5, height: 30, borderRadius: 2 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  key: {
    width: '31.8%',
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.key,
  },
  keyBare: { width: '31.8%', height: 52, alignItems: 'center', justifyContent: 'center' },
  keySpacer: { width: '31.8%', height: 52 },
  keyPressed: { backgroundColor: palette.sunken },
});

export const keypadSpacing = space.md;
