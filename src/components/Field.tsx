import React from 'react';
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';

import { fonts, palette, radius, space } from '@/theme';

import { Text } from './Text';

/**
 * A labelled text input, in the same pill shape as the sign-in fields. The
 * product and coupon forms are the only places the vendor types free text, so
 * this is deliberately plain: a label, the box, and an optional unit on the
 * right ("min", "₹").
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  prefix,
  suffix,
  autoFocus,
  maxLength,
  style,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  prefix?: string;
  suffix?: string;
  autoFocus?: boolean;
  maxLength?: number;
  style?: object;
}) {
  return (
    <View style={style}>
      {label ? (
        <Text v="bodyStrong" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.field}>
        {prefix ? (
          <Text v="body" muted>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.inkSubtle}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          maxLength={maxLength}
          style={styles.input}
        />
        {suffix ? (
          <Text v="body" muted>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
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
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
});
