import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { Text } from './Text';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type DialogRequest = { title: string; message?: string; buttons: DialogButton[] };

let present: ((request: DialogRequest) => void) | null = null;

/**
 * Drop-in for `Alert.alert(title, message, buttons)` drawn in the app's own style
 * instead of the system dialog. Needs <DialogHost /> mounted once near the root.
 */
export const appAlert = (title: string, message?: string, buttons?: DialogButton[]) => {
  const request = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  if (present) {
    present(request);
  }
};

export function DialogHost() {
  const { r } = useTheme();
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    present = request => setQueue(q => [...q, request]);
    return () => {
      present = null;
    };
  }, []);

  const close = useCallback((button?: DialogButton) => {
    setQueue(q => q.slice(1));
    button?.onPress?.();
  }, []);

  if (!current) {
    return null;
  }

  const cancel = current.buttons.find(b => b.style === 'cancel');
  // Two buttons sit side by side; more than two stack, the way a list of choices reads best.
  const stacked = current.buttons.length > 2;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={() => close(cancel)}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Dismiss" style={StyleSheet.absoluteFill} onPress={() => close(cancel)}>
          <View style={styles.scrim} />
        </Pressable>
        <View accessibilityViewIsModal style={styles.card}>
          <Text v="cardTitle">{current.title}</Text>
          {current.message ? (
            <Text v="body" muted style={styles.message}>
              {current.message}
            </Text>
          ) : null}
          <View style={[styles.buttons, stacked && styles.stacked]}>
            {current.buttons.map(b => {
              const destructive = b.style === 'destructive';
              const quiet = b.style === 'cancel';
              return (
                <Pressable
                  key={b.text}
                  accessibilityRole="button"
                  onPress={() => close(b)}
                  style={({ pressed }) => [
                    styles.button,
                    !stacked && styles.grow,
                    quiet ? styles.quiet : { backgroundColor: destructive ? palette.alert : r.accent },
                    pressed && styles.pressed,
                  ]}>
                  <Text v="button" color={quiet ? palette.ink : palette.white} numberOfLines={1}>
                    {b.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: space.gutter + 8 },
  scrim: { flex: 1, backgroundColor: palette.night, opacity: 0.5 },
  card: {
    backgroundColor: palette.paper,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.sm,
    ...shadow.floating,
  },
  message: { marginTop: 2 },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  stacked: { flexDirection: 'column' },
  grow: { flex: 1 },
  button: { height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  quiet: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  pressed: { opacity: 0.8 },
});
