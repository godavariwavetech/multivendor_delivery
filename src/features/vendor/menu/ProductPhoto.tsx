import React, { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { USE_MOCK_DATA } from '@config/constants';
import type { Product } from '@/domain/types';
import { photoUrl } from '@/utils/photo';

const atlas = require('@/assets/images/vendor-product-atlas.png');
const kalakandPhoto = require('@/assets/images/kalakand.png');
const chickenFriedRicePhoto = require('@/assets/images/chicken-fried-rice.png');

// The atlas is a regular 4 × 4 grid. Coordinates follow its reading order.
const photoCell: Record<string, number> = {
  'f-biryani': 0,
  'f-paneer': 1,
  'f-mutton': 2,
  'f-parotta': 3,
  'f-halwa': 4,
  'f-rasmalai': 5,
  'g-sambar': 6,
  'g-rice': 7,
  'g-oil': 8,
  'p-tomato': 9,
  'p-banana': 10,
  'p-spinach': 11,
  'b-butterscotch': 12,
  'b-bread': 13,
  'm-chicken': 14,
  'm-seer': 15,
};

const nameCells: Record<Product['category'], { match: RegExp; cell: number }[]> = {
  food: [
    { match: /biryani/i, cell: 0 },
    { match: /paneer/i, cell: 1 },
    { match: /mutton|chukka/i, cell: 2 },
    { match: /parotta/i, cell: 3 },
    { match: /halwa/i, cell: 4 },
    { match: /rasmalai/i, cell: 5 },
  ],
  grocery: [
    { match: /sambar|masala|spice|powder/i, cell: 6 },
    { match: /rice/i, cell: 7 },
    { match: /oil/i, cell: 8 },
  ],
  produce: [
    { match: /tomato/i, cell: 9 },
    { match: /banana/i, cell: 10 },
    { match: /spinach|greens/i, cell: 11 },
  ],
  bakery: [
    { match: /cake|cupcake|pastry/i, cell: 12 },
    { match: /bread|loaf/i, cell: 13 },
  ],
  meat: [
    { match: /chicken|poultry/i, cell: 14 },
    { match: /fish|seafood|seer|mutton|meat/i, cell: 15 },
  ],
};

/**
 * The bundled pictures above belong to the demo menu. With live data a dish shows the photo the server holds for
 * it, and a placeholder when there is none: a guess made from the dish name would put the wrong picture on it.
 */
const BUILT_IN_ART = USE_MOCK_DATA;

export function ProductPhoto({
  product,
  size,
  faded = false,
}: {
  product: Product;
  size: number;
  faded?: boolean;
}) {
  const name = product.name.toLowerCase();
  const namedCell = BUILT_IN_ART ? nameCells[product.category].find(({ match }) => match.test(name))?.cell : undefined;
  // No picture for a dish we don't have one for: the tile shows the placeholder rather than a wrong one.
  const cell = BUILT_IN_ART ? namedCell ?? photoCell[product.id] : undefined;
  const storedUri = photoUrl(product.image);
  const [failedUri, setFailedUri] = useState<string>();
  useEffect(() => setFailedUri(undefined), [storedUri]);
  // A stored path whose file is gone falls back to the demo picture, or the placeholder with live data.
  const remoteUri = storedUri && storedUri !== failedUri ? storedUri : undefined;
  const dedicatedImage = !BUILT_IN_ART || product.category !== 'food'
    ? null
    : /chicken\s+fried\s+rice/i.test(name)
      ? chickenFriedRicePhoto
      : /kalakand/i.test(name)
        ? kalakandPhoto
        : null;

  return (
    <View style={[styles.frame, { width: size, height: size }, faded ? styles.faded : undefined]}>
      {remoteUri ? (
        <Image
          source={{ uri: remoteUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailedUri(remoteUri)}
        />
      ) : dedicatedImage ? (
        <Image source={dedicatedImage} style={{ width: size, height: size }} resizeMode="cover" />
      ) : cell === undefined ? (
        <View testID="product-photo-placeholder" style={styles.placeholder}>
          <ImageIcon size={Math.round(size * 0.4)} color="#B9AEA0" strokeWidth={1.8} />
        </View>
      ) : (
        <Image
          source={atlas}
          resizeMode="stretch"
          style={[
            styles.atlas,
            { width: size * 4, height: size * 4, left: -(cell % 4) * size, top: -Math.floor(cell / 4) * size },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: 14, backgroundColor: '#F2EDE6' },
  atlas: { position: 'absolute' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.55 },
});
