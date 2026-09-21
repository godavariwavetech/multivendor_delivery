import { Check, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { palette, radius, shadow, space, useTheme } from '@/theme';

import { Text } from './Text';

export type DropdownOption = { key: string | number; label: string };

/**
 * A labelled single-choice dropdown, in the same pill shape as `TextField`. Tapping
 * it opens the options in a list over the screen; picking one closes it. With
 * `clearable`, a selected field shows an × that empties it (`onSelect(null)`)
 * without opening the list.
 */
export function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select',
  clearable,
  disabled,
  style,
}: {
  label?: string;
  /** The selected option's key, or null / undefined for none. */
  value: string | number | null | undefined;
  options: DropdownOption[];
  onSelect: (key: string | number | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  const { r } = useTheme();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.key === value);

  const pick = (key: string | number | null) => {
    setOpen(false);
    onSelect(key);
  };

  return (
    <View style={style}>
      {label ? (
        <Text v="bodyStrong" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, disabled && styles.disabled, pressed && styles.pressed]}>
        <Text v="body" color={selected ? palette.ink : palette.inkSubtle} numberOfLines={1} style={styles.value}>
          {selected ? selected.label : placeholder}
        </Text>
        {clearable && selected && !disabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label ?? 'selection'}`}
            hitSlop={10}
            onPress={() => onSelect(null)}
            style={styles.clear}>
            <X size={14} color={palette.inkMuted} strokeWidth={2.6} />
          </Pressable>
        ) : null}
        <ChevronDown size={20} color={palette.inkMuted} strokeWidth={2.2} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={styles.overlay}>
          <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
            <View style={styles.scrim} />
          </Pressable>
          <View style={styles.panel}>
            {label ? (
              <Text v="cardTitle" style={styles.title}>
                {label}
              </Text>
            ) : null}
            <ScrollView style={{ maxHeight: height * 0.55 }} keyboardShouldPersistTaps="handled">
              {options.map(o => (
                <Row key={o.key} label={o.label} selected={o.key === selected?.key} accent={r.accent} onPress={() => pick(o.key)} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, selected, accent, onPress }: { label: string; selected: boolean; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text v={selected ? 'bodyStrong' : 'body'} style={styles.value}>
        {label}
      </Text>
      {selected ? <Check size={20} color={accent} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.lg,
  },
  value: { flex: 1 },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.55, backgroundColor: palette.sunken },
  pressed: { opacity: 0.85 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: palette.night, opacity: 0.45 },
  panel: {
    backgroundColor: palette.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    paddingHorizontal: space.gutter,
    ...shadow.floating,
  },
  title: { marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
  },
  rowPressed: { backgroundColor: palette.sunken },
});
