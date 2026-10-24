import { ImageIcon, Navigation } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { palette, space } from '@/theme';
import { orderStamp } from '@/utils/datetime';
import { photoUrl } from '@/utils/photo';

import { Card } from './Card';
import type { CardTone } from './Card';
import { Text } from './Text';

const THUMB = 56;

/**
 * One order, the same way wherever the app lists it: dish photo, order number, when it was placed, its status,
 * the total, then the area and full address. `thumb` replaces the photo for a caller that resolves its own
 * (the vendor's menu photos); `children` are the actions under the row.
 */
export function OrderSummary({
  number,
  at,
  status,
  statusColor,
  total,
  note,
  area,
  address,
  photo,
  thumb,
  faded,
  tone,
  onPress,
  children,
}: {
  number: string;
  at?: number;
  status: string;
  statusColor?: string;
  total: number;
  /** One more muted line under the total, e.g. what the partner earned. */
  note?: string;
  area?: string;
  address?: string;
  photo?: string | null;
  thumb?: React.ReactNode;
  faded?: boolean;
  tone?: CardTone;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Card tone={tone} onPress={onPress} style={faded ? styles.faded : undefined}>
      <View style={styles.row}>
        <View style={styles.clip}>{thumb ?? <Thumb stored={photo} />}</View>
        <View style={styles.flex}>
          <Text v="cardTitle">{`#${number}`}</Text>
          {at ? (
            <Text v="body" muted>
              {orderStamp(at)}
            </Text>
          ) : null}
          <Text v="bodyStrong" color={statusColor ?? palette.inkMuted}>
            {status}
          </Text>
          <Text v="body">{`Total: Rs. ${Math.round(total)}/-`}</Text>
          {note ? (
            <Text v="body" muted>
              {note}
            </Text>
          ) : null}
          {area ? <Text v="body">{area}</Text> : null}
          {address ? (
            <View style={styles.addressRow}>
              <Navigation size={15} color={palette.inkMuted} strokeWidth={2.2} style={styles.pin} />
              <Text v="body" muted style={styles.flex}>
                {address}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

/** A round photo (a dish, a store); a neutral tile when there is none or it cannot be fetched. */
export function RoundPhoto({ stored, size = THUMB }: { stored?: string | null; size?: number }) {
  const uri = photoUrl(stored);
  const [failed, setFailed] = useState<string>();
  const frame = { width: size, height: size, borderRadius: size / 2 };
  if (!uri || failed === uri) {
    return (
      <View style={[styles.thumb, frame, styles.placeholder]}>
        <ImageIcon size={Math.round(size * 0.4)} color="#B9AEA0" strokeWidth={1.8} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[styles.thumb, frame]} resizeMode="cover" onError={() => setFailed(uri)} />;
}

const Thumb = RoundPhoto;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  flex: { flex: 1, gap: 2 },
  clip: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, overflow: 'hidden' },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: '#F2EDE6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  pin: { marginTop: 4 },
  faded: { opacity: 0.72 },
});
