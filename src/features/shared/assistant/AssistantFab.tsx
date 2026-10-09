import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { BotIcon } from './BotIcon';

/**
 * The round chat button that opens the assistant. It floats bottom-right, clear
 * of the tab bar and of the sticky action bars, and is drawn once for the whole app.
 */
export function AssistantFab({ onPress, lifted }: { onPress: () => void; /** Rise above a screen's own floating button (Menu's "Add dish"). */ lifted?: boolean }) {
  const { r } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ask the assistant"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 96 + (lifted ? 72 : 0), borderColor: r.line, opacity: pressed ? 0.88 : 1 }]}>
      <BotIcon size={38} color={r.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.gutter,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: palette.paper,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
});
