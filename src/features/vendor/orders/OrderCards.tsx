import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Pill, ProgressBar, Text } from '@/components';
import type { Order } from '@/domain/types';
import { palette, radius, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { ago, clock, formatCountdown } from '@/utils/datetime';
import {
  acceptSecondsLeft,
  itemsLabel,
  linesSummary,
  prepLabel,
  prepProgress,
  prepSecondsLeft,
} from '@/utils/orders';

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
        <Pill label={chip} tone="peach" />
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
        <Button label="Reject" variant="outline" flex={1} onPress={onReject} />
        <Button
          label={quickAcceptMinutes ? `Accept · ${quickAcceptMinutes} min` : 'Accept order'}
          flex={1.8}
          onPress={onAccept}
        />
      </View>
    </Card>
  );
}

/** A live prep ticket (board 3a·3). Late tickets are pulled to the top and outlined. */
export function CookingCard({
  order,
  now,
  onReady,
  onPlusFive,
  onOpen,
  compact,
}: {
  order: Order;
  now: number;
  onReady: () => void;
  onPlusFive: () => void;
  onOpen: () => void;
  compact?: boolean;
}) {
  const left = prepSecondsLeft(order, now);
  const late = left < 0;

  if (late) {
    return (
      <Pressable onPress={onOpen}>
        <View style={styles.lateCard}>
          <View style={styles.head}>
            <Text v="cardTitle">{`#${order.id}`}</Text>
            <Text v="cardTitle">{prepLabel(order, now)}</Text>
          </View>
          <Text v="body" style={styles.gapTop}>
            {linesSummary(order.lines)}
          </Text>
          {order.partner ? (
            <Text v="body">{`Partner ${order.partner.name.split(' ')[0]} waiting at counter`}</Text>
          ) : null}
          <Button label="Mark ready" onPress={onReady} style={styles.gapTopLg} />
        </View>
      </Pressable>
    );
  }

  return (
    <Card onPress={onOpen}>
      <View style={styles.head}>
        <Text v="cardTitle">{`#${order.id}`}</Text>
        <Text v="bodyStrong" color={palette.sageDeep} style={styles.timer}>
          {prepLabel(order, now)}
        </Text>
      </View>
      <ProgressBar progress={prepProgress(order, now)} style={styles.progress} />
      <Text v="body" muted>
        {linesSummary(order.lines)}
      </Text>
      {!compact ? (
        <View style={styles.actions}>
          <Button label="+5 min" variant="outline" size="sm" flex={1} onPress={onPlusFive} />
          <Button label="Mark ready" variant="outline" size="sm" flex={1} onPress={onReady} />
        </View>
      ) : null}
    </Card>
  );
}

/** Any order past the "new" stage, as a tappable summary row (board 1b·2, 4a·2). */
export function OrderRow({ order, now, onPress, workLabel }: { order: Order; now: number; onPress: () => void; workLabel: string }) {
  const closed = order.status === 'cancelled' || order.status === 'rejected';
  let pill: { label: string; tone: 'mint' | 'peach' | 'neutral' };
  switch (order.status) {
    case 'cooking':
      pill = prepSecondsLeft(order, now) < 0
        ? { label: `${workLabel} · ${prepLabel(order, now)}`, tone: 'peach' }
        : { label: `${workLabel} · ${prepLabel(order, now)}`, tone: 'mint' };
      break;
    case 'ready':
      pill = order.partner?.atCounter
        ? { label: `Ready · ${order.partner.name.split(' ')[0]} at counter`, tone: 'peach' }
        : { label: 'Ready · waiting for partner', tone: 'peach' };
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
  progress: { marginTop: space.md, marginBottom: space.md },
  timer: { fontSize: 15 },
  lateCard: {
    backgroundColor: palette.peachWash,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: palette.clayMid,
    padding: space.lg,
  },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  faded: { opacity: 0.72 },
});
