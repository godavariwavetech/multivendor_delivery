import { Check, ChevronRight, Clock, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Pill, Text } from '@/components';
import type { Order } from '@/domain/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { ago, clock, formatCountdown } from '@/utils/datetime';
import { acceptSecondsLeft, itemsLabel, linesSummary } from '@/utils/orders';

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
  const left = acceptSecondsLeft(order, now);
  const chip =
    showCountdown === 'accept'
      ? left > 0
        ? `${formatCountdown(left)} to accept`
        : 'Accept now'
      : showCountdown === 'ago'
        ? ago(order.placedAt, now)
        : 'New';

  return (
    <Card tone={highlight ? 'highlight' : 'paper'} onPress={onOpen}>
      <View style={styles.head}>
        <Text v="cardTitle">{showCountdown === 'ago' ? `#${order.id} · ${itemsLabel(order)}` : `#${order.id}`}</Text>
        <Pill label={chip} tone="sky" icon={showCountdown ? Clock : undefined} />
      </View>
      <Text v="body" muted style={styles.gapTop}>
        {showCountdown === 'ago'
          ? linesSummary(order.lines)
          : `${linesSummary(order.lines)} · ${formatAmount(order.total)}`}
      </Text>
      {showCountdown === 'ago' ? (
        <Text v="body" muted>
          {`${payLabel(order)} ${formatAmount(order.total)}`}
        </Text>
      ) : null}
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
    </Card>
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
    <Card onPress={onOpen}>
      <Text v="cardTitle">{`#${order.id}`}</Text>
      <Text v="body" muted style={styles.gapTop}>
        {linesSummary(order.lines)}
      </Text>
      {order.partner ? (
        <Text v="body">{`Partner ${order.partner.name.split(' ')[0]} waiting at counter`}</Text>
      ) : null}
      <Button label="Mark ready" onPress={onReady} style={styles.gapTopLg} />
    </Card>
  );
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
    <Card onPress={onPress} style={closed ? styles.faded : undefined}>
      <View style={styles.rowWrap}>
        <View style={styles.flex}>
          <Text v="cardTitle" color={closed ? palette.inkMuted : undefined}>{`#${order.id}`}</Text>
          <Text v="body" muted style={styles.gapTopSm}>
            {`${itemsLabel(order)} · ${formatAmount(order.total)} · ${payLabel(order)}`}
          </Text>
          <Pill label={pill.label} tone={pill.tone} style={styles.gapTop} />
        </View>
        <ChevronRight size={22} color={palette.inkSubtle} strokeWidth={2.2} />
      </View>
    </Card>
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
});
