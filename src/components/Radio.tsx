import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, useTheme } from '@/theme';

/** Round selection indicator used in single-choice lists (language, sound, zone). */
export function Radio({ selected }: { selected: boolean }) {
  const { r } = useTheme();
  return (
    <View style={[styles.radio, selected && { backgroundColor: r.accent, borderColor: r.accent }]}>
      {selected ? <Check size={14} color={palette.white} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
