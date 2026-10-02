import ImageEditor from '@react-native-community/image-editor';
import { Crop, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PanResponder, Pressable, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';

import { palette, space } from '@/theme';
import type { PickedPhoto } from '@/utils/photo';

import { Text } from './Text';

type Frame = { x: number; y: number; w: number; h: number };
type Grip = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MIN = 72; // smallest crop edge on screen, in dp
const HANDLE = 44; // touch target of a corner
const OUTPUT_EDGE = 1280; // longest edge of the saved photo; the server caps an upload at 8 MB

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * The "Crop photo" screen. The photo is fixed and a frame over it is moved by
 * its body and resized from its corners. Done saves exactly what is inside the
 * frame, scaled to at most OUTPUT_EDGE; the X backs out without a photo.
 */
export function PhotoCropper({
  photo,
  onCancel,
  onDone,
  onError,
}: {
  /** The photo to crop; the screen is shown while this is set. */
  photo: PickedPhoto | null;
  onCancel: () => void;
  onDone: (cropped: PickedPhoto) => void;
  onError: (message: string) => void;
}) {
  const { width, height } = useWindowDimensions();
  const areaH = Math.min(height * 0.62, width * 1.35);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<Frame>({ x: 0, y: 0, w: 0, h: 0 });
  const [saving, setSaving] = useState(false);

  // Where the photo sits inside the area (contain), and how much it is shrunk.
  const fit = useMemo(() => {
    if (!natural) {
      return null;
    }
    const scale = Math.min(width / natural.w, areaH / natural.h);
    const w = natural.w * scale;
    const h = natural.h * scale;
    return { scale, ox: (width - w) / 2, oy: (areaH - h) / 2, w, h };
  }, [natural, width, areaH]);

  const initialFrame = useCallback(
    (f: NonNullable<typeof fit>): Frame => ({ x: f.ox + f.w * 0.08, y: f.oy + f.h * 0.08, w: f.w * 0.84, h: f.h * 0.84 }),
    [],
  );

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    setNatural(null);
    setSaving(false);
    if (!photo) {
      return;
    }
    let live = true;
    Image.getSize(
      photo.uri,
      (w, h) => {
        if (live) {
          if (w > 0 && h > 0) {
            setNatural({ w, h });
          } else {
            onErrorRef.current('That photo could not be opened.');
          }
        }
      },
      () => live && onErrorRef.current('That photo could not be opened.'),
    );
    return () => {
      live = false;
    };
  }, [photo]);

  useEffect(() => {
    if (fit) {
      setFrame(initialFrame(fit));
    }
  }, [fit, initialFrame]);

  // Responders read the latest fit/frame through refs so they can be built once.
  const fitRef = useRef(fit);
  const frameRef = useRef(frame);
  fitRef.current = fit;
  frameRef.current = frame;

  const responders = useMemo(() => {
    const make = (grip: Grip) => {
      let start: Frame = { x: 0, y: 0, w: 0, h: 0 };
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start = frameRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const f = fitRef.current;
          if (!f) {
            return;
          }
          const minX = f.ox;
          const maxX = f.ox + f.w;
          const minY = f.oy;
          const maxY = f.oy + f.h;
          if (grip === 'move') {
            setFrame({
              ...start,
              x: clamp(start.x + g.dx, minX, maxX - start.w),
              y: clamp(start.y + g.dy, minY, maxY - start.h),
            });
            return;
          }
          let l = start.x;
          let r = start.x + start.w;
          let t = start.y;
          let b = start.y + start.h;
          if (grip === 'tl' || grip === 'bl') {
            l = clamp(l + g.dx, minX, r - MIN);
          } else {
            r = clamp(r + g.dx, l + MIN, maxX);
          }
          if (grip === 'tl' || grip === 'tr') {
            t = clamp(t + g.dy, minY, b - MIN);
          } else {
            b = clamp(b + g.dy, t + MIN, maxY);
          }
          setFrame({ x: l, y: t, w: r - l, h: b - t });
        },
      });
    };
    return { move: make('move'), tl: make('tl'), tr: make('tr'), bl: make('bl'), br: make('br') };
  }, []);

  const done = async () => {
    if (!photo || !fit || saving) {
      return;
    }
    setSaving(true);
    try {
      // Frame (screen dp) back to the photo's own pixels.
      const sx = (frame.x - fit.ox) / fit.scale;
      const sy = (frame.y - fit.oy) / fit.scale;
      const sw = frame.w / fit.scale;
      const sh = frame.h / fit.scale;
      const down = Math.min(1, OUTPUT_EDGE / Math.max(sw, sh));
      const result = await ImageEditor.cropImage(photo.uri, {
        offset: { x: Math.max(0, Math.round(sx)), y: Math.max(0, Math.round(sy)) },
        size: { width: Math.round(sw), height: Math.round(sh) },
        displaySize: { width: Math.round(sw * down), height: Math.round(sh * down) },
        resizeMode: 'contain',
        format: 'jpeg',
        quality: 0.85,
      });
      onDone({ uri: result.uri, name: result.name || `photo-${Date.now()}.jpg`, type: result.type || 'image/jpeg' });
    } catch (error) {
      setSaving(false);
      onError(error instanceof Error ? error.message : 'The photo could not be cropped.');
    }
  };

  const f = frame;
  const right = f.x + f.w;
  const bottom = f.y + f.h;
  const corner = (grip: 'tl' | 'tr' | 'bl' | 'br') => ({
    left: (grip === 'tl' || grip === 'bl' ? f.x : right) - HANDLE / 2,
    top: (grip === 'tl' || grip === 'tr' ? f.y : bottom) - HANDLE / 2,
  });

  return (
    <Modal visible={Boolean(photo)} animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={12} onPress={onCancel} style={styles.side}>
            <X size={24} color={palette.ink} strokeWidth={2.2} />
          </Pressable>
          <Text v="cardTitle" style={styles.title}>
            Crop photo
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            hitSlop={12}
            disabled={!fit || saving}
            onPress={done}
            style={[styles.side, styles.right]}>
            {saving ? (
              <ActivityIndicator color={palette.blue} />
            ) : (
              <Text v="bodyStrong" color={fit ? palette.blue : palette.inkSubtle}>
                Done
              </Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.area, { height: areaH }]}>
          {photo && fit ? (
            <>
              <Image
                source={{ uri: photo.uri }}
                style={{ position: 'absolute', left: fit.ox, top: fit.oy, width: fit.w, height: fit.h }}
                resizeMode="contain"
              />
              {/* Dim everything outside the frame. */}
              <View pointerEvents="none" style={[styles.dim, { left: 0, right: 0, top: 0, height: f.y }]} />
              <View pointerEvents="none" style={[styles.dim, { left: 0, right: 0, top: bottom, bottom: 0 }]} />
              <View pointerEvents="none" style={[styles.dim, { left: 0, width: f.x, top: f.y, height: f.h }]} />
              <View pointerEvents="none" style={[styles.dim, { left: right, right: 0, top: f.y, height: f.h }]} />
              <View {...responders.move.panHandlers} style={[styles.frame, { left: f.x, top: f.y, width: f.w, height: f.h }]}>
                <View pointerEvents="none" style={[styles.gridV, { left: '33.33%' }]} />
                <View pointerEvents="none" style={[styles.gridV, { left: '66.66%' }]} />
                <View pointerEvents="none" style={[styles.gridH, { top: '33.33%' }]} />
                <View pointerEvents="none" style={[styles.gridH, { top: '66.66%' }]} />
              </View>
              {(['tl', 'tr', 'bl', 'br'] as const).map(g => (
                <View key={g} {...responders[g].panHandlers} style={[styles.handle, corner(g)]}>
                  <View pointerEvents="none" style={styles.knob} />
                </View>
              ))}
            </>
          ) : (
            <ActivityIndicator color={palette.white} style={styles.loading} />
          )}
        </View>

        <View style={styles.tools}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset crop"
            disabled={!fit}
            onPress={() => fit && setFrame(initialFrame(fit))}
            style={styles.tool}>
            <View style={styles.toolIcon}>
              <Crop size={24} color={palette.ink} />
            </View>
            <Text v="caption" muted>
              Reset crop
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  header: { height: 56, marginTop: space.xl, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter },
  side: { width: 64, minHeight: 40, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  area: { backgroundColor: palette.night, overflow: 'hidden' },
  loading: { flex: 1 },
  dim: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  frame: { position: 'absolute', borderWidth: 1.5, borderColor: palette.white },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  handle: { position: 'absolute', width: HANDLE, height: HANDLE, alignItems: 'center', justifyContent: 'center' },
  knob: { width: 16, height: 16, borderRadius: 3, backgroundColor: palette.white },
  tools: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tool: { alignItems: 'center', gap: space.xs },
  toolIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: palette.sunken, alignItems: 'center', justifyContent: 'center' },
});
