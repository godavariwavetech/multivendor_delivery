import type { LucideIcon } from 'lucide-react-native';
import { Bell, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { palette, radius, shadow, useTheme } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'outline' | 'light' | 'blue' | 'green';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md' | 'sm';
  icon?: LucideIcon;
  disabled?: boolean;
  style?: ViewStyle;
  flex?: number;
};

/** Pill buttons with semibold labels, used on every screen of the board. */
export function Button({ label, onPress, variant = 'primary', size = 'md', icon: Icon, disabled, style, flex }: ButtonProps) {
  const { r, brand } = useTheme();
  const height = { lg: 50, md: 44, sm: 36 }[size];

  const vendor = brand?.vendor;
  const delivery = brand?.delivery;
  const scheme = {
    primary: { bg: r.accent, fg: r.onAccent, border: r.accent },
    blue: { bg: vendor?.button ?? palette.blue, fg: vendor?.onAccent ?? palette.white, border: vendor?.button ?? palette.blue },
    green: { bg: delivery?.button ?? palette.green, fg: delivery?.onAccent ?? palette.white, border: delivery?.button ?? palette.green },
    outline: { bg: 'transparent', fg: palette.ink, border: palette.line },
    light: { bg: palette.white, fg: palette.ink, border: palette.white },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        flex !== undefined && { flex },
        style,
      ]}>
      {Icon ? <Icon size={18} color={scheme.fg} strokeWidth={2.2} /> : null}
      <Text v={size === 'sm' ? 'buttonSm' : 'button'} color={scheme.fg} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Text-only action: "Use OTP instead", "Report a problem", "Timings". */
export function LinkButton({
  label,
  onPress,
  color,
  center,
  style,
}: {
  label: string;
  onPress?: () => void;
  color?: string;
  center?: boolean;
  style?: ViewStyle;
}) {
  const { r } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[center && styles.center, style]}>
      {({ pressed }) => (
        <Text v="bodyStrong" color={color ?? r.accent} style={{ opacity: pressed ? 0.6 : 1 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Round outlined back button used in every detail header. */
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
      <ChevronLeft size={22} color={palette.ink} strokeWidth={2.2} />
    </Pressable>
  );
}

export function BellButton({ onPress, dot }: { onPress: () => void; dot?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
      <Bell size={21} color={palette.ink} strokeWidth={2.2} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

/** Small round icon action, e.g. the call button on a customer row. */
export function IconCircle({
  icon: Icon,
  onPress,
  bg,
  color,
  size = 44,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  bg?: string;
  color?: string;
  size?: number;
}) {
  const { r } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, backgroundColor: bg ?? r.soft },
        pressed && styles.pressed,
      ]}>
      <Icon size={size * 0.44} color={color ?? r.accentDeep} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  center: { alignSelf: 'center' },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  dot: { position: 'absolute', top: 10, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: palette.alert },
  circle: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  pressed: { opacity: 0.7 },
});
