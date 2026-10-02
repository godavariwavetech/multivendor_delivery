import { Camera, ChevronRight, Image as ImageIcon, Trash2, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { palette, radius, shadow, space } from '@/theme';

import { Text } from './Text';

type Props = {
  visible: boolean;
  /** "Remove photo" is only offered when there is something to remove. */
  hasPhoto: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
};

/** The "Add photo" bottom sheet: take a photo, choose one, or remove the current one. */
export function PhotoSourceSheet({ visible, hasPhoto, onClose, onCamera, onGallery, onRemove }: Props) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={styles.scrim} />
        </Pressable>
        <View style={styles.panel}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text v="cardTitle" style={styles.flex}>
              Add photo
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose} style={styles.close}>
              <X size={18} color={palette.ink} strokeWidth={2.4} />
            </Pressable>
          </View>
          <Option icon={<Camera size={22} color={palette.ink} />} label="Take photo" onPress={onCamera} />
          <Option icon={<ImageIcon size={22} color={palette.ink} />} label="Choose from gallery" onPress={onGallery} />
          {hasPhoto ? <Option icon={<Trash2 size={22} color={palette.alert} />} label="Remove photo" danger onPress={onRemove} /> : null}
        </View>
      </View>
    </Modal>
  );
}

function Option({ icon, label, danger, onPress }: { icon: React.ReactNode; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
      {icon}
      <Text v="body" color={danger ? palette.alert : palette.ink} style={styles.flex}>
        {label}
      </Text>
      {danger ? null : <ChevronRight size={20} color={palette.inkMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: palette.night, opacity: 0.45 },
  panel: {
    backgroundColor: palette.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
    paddingHorizontal: space.gutter,
    gap: space.sm,
    ...shadow.floating,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.xs },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.sunken, alignItems: 'center', justifyContent: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: palette.paper,
  },
  pressed: { backgroundColor: palette.sunken },
  flex: { flex: 1 },
});
