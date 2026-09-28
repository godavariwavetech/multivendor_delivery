import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, useTheme } from '@/theme';

import { Text } from './Text';

/**
 * The shared 5-slot tab bar. The active tab gets a soft pill behind its icon in the
 * role colour — peach for vendors, mint for partners.
 */
export function TabBar({
  state,
  navigation,
  descriptors,
  icons,
}: BottomTabBarProps & { icons: Record<string, LucideIcon> }) {
  const { r } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = icons[route.name];
        const label = descriptors[route.key].options.title ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}>
            <View style={[styles.iconPill, focused && { backgroundColor: r.soft, borderColor: r.line, borderWidth: 1 }]}>
              {Icon ? (
                <Icon size={24} color={focused ? r.accent : palette.inkSubtle} strokeWidth={focused ? 2.4 : 2} />
              ) : null}
            </View>
            <Text v="tab" color={focused ? r.accent : palette.inkSubtle}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: palette.paper,
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
    paddingTop: 7,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  iconPill: { width: 54, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
