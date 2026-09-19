import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, PhotoBox, Text, Toggle, VegMark } from '@/components';
import type { Product } from '@/domain/types';
import { palette, space } from '@/theme';

/** Board 4a·3 — photo, veg marker, price line, stock line and availability switch. */
export function ProductCard({
  product,
  onPress,
  onToggle,
  right,
}: {
  product: Product;
  onPress: () => void;
  onToggle?: (available: boolean) => void;
  right?: React.ReactNode;
}) {
  const off = !product.available;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <PhotoBox size={72} faded={off} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <VegMark veg={product.veg} faded={off} />
            <Text v="cardTitle" color={off ? palette.inkMuted : undefined} numberOfLines={2} style={styles.flex}>
              {product.name}
            </Text>
          </View>
          <Text v="body" color={off ? palette.inkSubtle : palette.inkMuted} numberOfLines={2}>
            {product.priceLine}
          </Text>
          <Text v="bodyStrong" color={off ? palette.inkMuted : palette.greenDeep} numberOfLines={1}>
            {off ? `Out of stock${product.outNote ? ` · ${product.outNote}` : ''}` : product.stockLine}
          </Text>
        </View>
        {right ?? (onToggle ? <Toggle value={product.available} onChange={onToggle} /> : null)}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
});
