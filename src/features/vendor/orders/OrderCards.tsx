import { Check, ImageIcon, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button, OrderSummary, RoundPhoto } from '@/components';
import { useVendor } from '@/data/vendorStore';
import type { Order, OrderLine, Product } from '@/domain/types';
import { ProductPhoto } from '../menu/ProductPhoto';
import { palette, space } from '@/theme';
import { ago, clock } from '@/utils/datetime';
import { photoUrl } from '@/utils/photo';
import { itemsLabel, linesSummary } from '@/utils/orders';

const payLabel = (o: Order) => (o.refunded ? 'Refunded' : o.payment === 'cod' ? 'COD' : 'Prepaid');

/** A new order awaiting a decision (board 4a·1, 4a·2). */
export function NewOrderCard({
  order,
  now,
  highlight,
  quickAcceptMinutes,
  onAccept,
  onReject,
  onOpen,
  showCountdown,
}: {
  order: Order;
  now: number;
  highlight?: boolean;
  quickAcceptMinutes?: number;
  onAccept: () => void;
  onReject: () => void;
  onOpen: () => void;
  showCountdown?: 'ago' | 'accept';
}) {
  // ON HOLD: the 'accept' countdown chip ("2:18 to accept"); a new order has no time limit.
  const status = showCountdown === 'ago' ? `New · ${ago(order.placedAt, now)}` : 'New';

  return (
    <OrderSummary
      tone={highlight ? 'highlight' : 'paper'}
      thumb={<OrderThumb order={order} />}
      number={order.id}
      at={order.placedAt}
      status={status}
      total={order.total}
      note={`${linesSummary(order.lines)} · ${payLabel(order)}`}
      area={order.customer.area}
      address={order.customer.address}
      onPress={onOpen}>
      <View style={styles.actions}>
        <Button label="Reject" icon={X} variant="outline" size="sm" flex={1} onPress={onReject} />
        <Button
          icon={Check}
          size="sm"
          label={quickAcceptMinutes ? `Accept · ${quickAcceptMinutes} min` : 'Accept order'}
          flex={1.8}
          onPress={onAccept}
        />
      </View>
    </OrderSummary>
  );
}

/**
 * A prep ticket (board 3a·3), reduced to what the vendor acts on: which order,
 * what is in it, and the one button that moves it on. No countdown — a ticket
 * is either still being prepared or it is ready.
 */
export function CookingCard({
  order,
  onReady,
  onOpen,
}: {
  order: Order;
  onReady: () => void;
  onOpen: () => void;
}) {
  return (
    <OrderSummary
      thumb={<OrderThumb order={order} />}
      number={order.id}
      at={order.placedAt}
      status={order.partner ? `Preparing · ${order.partner.name.split(' ')[0]} waiting at counter` : 'Preparing'}
      total={order.total}
      note={`${linesSummary(order.lines)} · ${payLabel(order)}`}
      area={order.customer.area}
      address={order.customer.address}
      onPress={onOpen}>
      <Button label="Mark ready" onPress={onReady} style={styles.gapTopLg} />
    </OrderSummary>
  );
}

const THUMB = 56;

/**
 * The menu dish an order line is for. The line's own product id is the match, so a dish renamed since the order
 * is still found. Only a line with no id (an older backend, the demo seed) falls back to its name.
 */
const lineProduct = (line: OrderLine, products: Product[]) => {
  if (line.productId) {
    return products.find(p => p.id === line.productId);
  }
  const name = line.name.trim().toLowerCase();
  return products.find(p => p.name.trim().toLowerCase() === name);
};

export type LinePhotoSource = { kind: 'menu'; product: Product } | { kind: 'stored'; path: string } | { kind: 'none' };

/** Where an order line's picture comes from: the menu dish, else the photo the server sent with the line, else none. */
export const resolveLinePhoto = (line: OrderLine | undefined, products: Product[]): LinePhotoSource => {
  if (!line) {
    return { kind: 'none' };
  }
  const product = lineProduct(line, products);
  if (product) {
    return { kind: 'menu', product };
  }
  return line.image ? { kind: 'stored', path: line.image } : { kind: 'none' };
};

function PhotoPlaceholder() {
  return (
    <View testID="order-thumb-placeholder" style={styles.thumbPlaceholder}>
      <ImageIcon size={22} color="#B9AEA0" strokeWidth={1.8} />
    </View>
  );
}

/** A dish that has left the menu keeps the photo the server sent with the line. */
function LinePhoto({ stored, faded }: { stored?: string | null; faded: boolean }) {
  const uri = photoUrl(stored);
  const [failed, setFailed] = useState<string>();
  if (!uri || failed === uri) {
    return <PhotoPlaceholder />;
  }
  return (
    <View style={[styles.thumbFrame, faded ? styles.faded : undefined]}>
      <Image testID="order-thumb-image" source={{ uri }} style={styles.thumbImage} resizeMode="cover" onError={() => setFailed(uri)} />
    </View>
  );
}

/** One order line's dish as a round photo: its menu photo, else the photo sent with the line, else a neutral tile. */
export function LineThumb({ line, size = 48 }: { line: OrderLine; size?: number }) {
  const { state } = useVendor();
  const source = resolveLinePhoto(line, state.products);
  if (source.kind === 'menu') {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <ProductPhoto product={source.product} size={size} faded={false} />
      </View>
    );
  }
  return <RoundPhoto stored={source.kind === 'stored' ? source.path : null} size={size} />;
}

/** The order's first item: its menu photo, else the photo sent with the line, else a neutral tile. */
function OrderThumb({ order }: { order: Order }) {
  const { state } = useVendor();
  const source = resolveLinePhoto(order.lines[0], state.products);
  const faded = order.status === 'cancelled' || order.status === 'rejected';
  if (source.kind === 'menu') {
    return <ProductPhoto product={source.product} size={THUMB} faded={faded} />;
  }
  return source.kind === 'stored' ? <LinePhoto stored={source.path} faded={faded} /> : <PhotoPlaceholder />;
}

/** Any order past the "new" stage, as a tappable summary row (board 1b·2, 4a·2). */
export function OrderRow({ order, onPress, workLabel }: { order: Order; onPress: () => void; workLabel: string }) {
  const closed = order.status === 'cancelled' || order.status === 'rejected';
  let pill: { label: string; tone: 'leaf' | 'sky' | 'neutral' };
  switch (order.status) {
    case 'cooking':
      pill = { label: workLabel, tone: 'leaf' };
      break;
    case 'ready':
      pill = order.partner?.atCounter
        ? { label: `Ready · ${order.partner.name.split(' ')[0]} at counter`, tone: 'sky' }
        : { label: 'Ready · waiting for partner', tone: 'sky' };
      break;
    case 'picked_up':
      pill = { label: order.closeNote ?? 'Picked up', tone: 'neutral' };
      break;
    case 'delivered':
      pill = { label: order.closeNote ?? `Delivered ${order.closedAt ? clock(order.closedAt) : ''}`, tone: 'neutral' };
      break;
    default:
      pill = { label: order.closeNote ?? 'Closed', tone: 'neutral' };
  }

  return (
    <OrderSummary
      thumb={<OrderThumb order={order} />}
      number={order.id}
      at={order.placedAt}
      status={pill.label}
      statusColor={closed ? palette.inkSubtle : undefined}
      total={order.total}
      note={`${itemsLabel(order)} · ${payLabel(order)}`}
      area={order.customer.area}
      address={order.customer.address}
      faded={closed}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  gapTopSm: { marginTop: 4 },
  gapTop: { marginTop: space.sm },
  gapTopLg: { marginTop: space.lg },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.lg },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  faded: { opacity: 0.72 },
  thumbFrame: { width: THUMB, height: THUMB, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F2EDE6' },
  thumbImage: { width: THUMB, height: THUMB },
  thumbPlaceholder: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    backgroundColor: '#F2EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
