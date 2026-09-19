import { MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Linking, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { MAP_ATTRIBUTION, MAP_TILE_KEY, MAP_TILE_URL } from '@config/constants';
import { palette, radius, space, useTheme } from '@/theme';

import { Text } from './Text';

const TILE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;

/**
 * A still map, drawn from map tiles.
 *
 * Tiles are plain images, so this needs no map SDK and no native module. Give
 * it one point for a single pin, or two (store and drop) and it picks the zoom
 * that fits both. Tapping opens the phone's own maps app.
 *
 * The tile host and its attribution live in config/constants.ts.
 */
const TILE_URL = (z: number, x: number, y: number) =>
  MAP_TILE_URL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)).replace('{key}', MAP_TILE_KEY);

/** Tile hosts expect a request to say which app it belongs to. */
const TILE_HEADERS = { 'User-Agent': 'eKart360Partner/1.0 (Android)' };

/** Slippy-map maths: a longitude/latitude to fractional tile coordinates. */
const tileX = (lon: number, zoom: number) => ((lon + 180) / 360) * Math.pow(2, zoom);
const tileY = (lat: number, zoom: number) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
};

export type MapPoint = {
  latitude?: number | null;
  longitude?: number | null;
  /** 'from' is the pickup (store), 'to' the destination. */
  kind?: 'from' | 'to';
  label?: string;
};

const usable = (p?: MapPoint | null): p is Required<Pick<MapPoint, 'latitude' | 'longitude'>> & MapPoint =>
  Boolean(p) && typeof p?.latitude === 'number' && typeof p?.longitude === 'number';

export function OsmMap({
  latitude,
  longitude,
  points,
  label,
  height = 150,
  zoom,
  style,
  children,
}: {
  latitude?: number | null;
  longitude?: number | null;
  /** Two points draw a store pin and a drop pin, zoomed to fit. */
  points?: MapPoint[];
  /** Shown as the pin's name when the maps app opens. */
  label?: string;
  height?: number;
  zoom?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const { r } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const marks = (points && points.length ? points : [{ latitude, longitude, label }]).filter(usable);

  if (!marks.length) {
    return (
      <View style={[styles.map, { height }, style]}>
        <Text v="caption" subtle>
          NO LOCATION SET
        </Text>
        {children}
      </View>
    );
  }

  // One point keeps a street-level view; two are framed so both fit the box.
  let view = { zoom: zoom ?? MAX_ZOOM - 1, centreX: 0, centreY: 0 };
  if (width > 0) {
    for (let z = zoom ?? MAX_ZOOM; z >= MIN_ZOOM; z--) {
      const xs = marks.map(m => tileX(m.longitude as number, z) * TILE);
      const ys = marks.map(m => tileY(m.latitude as number, z) * TILE);
      const spanX = Math.max(...xs) - Math.min(...xs);
      const spanY = Math.max(...ys) - Math.min(...ys);
      const fits = spanX <= width - 72 && spanY <= height - 72;
      view = { zoom: z, centreX: (Math.max(...xs) + Math.min(...xs)) / 2, centreY: (Math.max(...ys) + Math.min(...ys)) / 2 };
      if (fits || zoom) {
        break;
      }
    }
  }

  const left = view.centreX - width / 2;
  const top = view.centreY - height / 2;

  const tiles = [];
  if (width > 0) {
    for (let x = Math.floor(left / TILE); x <= Math.floor((left + width) / TILE); x++) {
      for (let y = Math.floor(top / TILE); y <= Math.floor((top + height) / TILE); y++) {
        tiles.push({ x, y, offsetX: x * TILE - left, offsetY: y * TILE - top });
      }
    }
  }

  const open = () => {
    // The last point is the one worth navigating to: the drop.
    const target = marks[marks.length - 1];
    const point = `${target.latitude},${target.longitude}`;
    const name = target.label ?? label;
    Linking.openURL(`geo:${point}?q=${name ? `${point}(${encodeURIComponent(name)})` : point}`).catch(() =>
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${target.latitude}&mlon=${target.longitude}`),
    );
  };

  return (
    <Pressable onPress={open} onLayout={onLayout} style={[styles.map, { height }, style]}>
      {tiles.map(t => (
        <Image
          key={`${t.x}-${t.y}`}
          source={{ uri: TILE_URL(view.zoom, t.x, t.y), headers: TILE_HEADERS }}
          style={[styles.tile, { left: t.offsetX, top: t.offsetY }]}
        />
      ))}

      {width > 0 &&
        marks.map((m, i) => {
          const pinLeft = tileX(m.longitude as number, view.zoom) * TILE - left;
          const pinTop = tileY(m.latitude as number, view.zoom) * TILE - top;
          const from = m.kind === 'from';
          return (
            <View
              key={`${m.latitude}-${m.longitude}-${i}`}
              pointerEvents="none"
              style={[styles.pin, { left: pinLeft - 15, top: pinTop - 30 }]}>
              <MapPin
                size={30}
                color={from ? palette.blue : r.accent}
                fill={from ? palette.sky : r.soft}
                strokeWidth={2.2}
              />
            </View>
          );
        })}

      <View style={styles.credit} pointerEvents="none">
        <Text v="caption" subtle style={styles.creditText}>
          {MAP_ATTRIBUTION}
        </Text>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: {
    borderRadius: radius.lg,
    backgroundColor: palette.sunken,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: { position: 'absolute', width: TILE, height: TILE },
  pin: { position: 'absolute' },
  credit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderTopLeftRadius: radius.sm,
  },
  creditText: { fontSize: 10 },
});
