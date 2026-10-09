import { Check, Phone, Share2, X } from 'lucide-react-native';
import React from 'react';
import { Share, StyleSheet, View } from 'react-native';

import {
  AmountRow,
  BackHeader,
  Button,
  Card,
  Divider,
  EmptyState,
  IconCircle,
  Screen,
  SectionLabel,
  StageTracker,
  Text,
  VegMark,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { ORDER_STATUS_LABEL, workLabel } from '@/domain/labels';
import type { OrderStatus } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { dayClock } from '@/utils/datetime';
import { invoiceText } from '@/utils/invoice';
import { itemsLabel } from '@/utils/orders';
import { SearchX } from 'lucide-react-native';

const STEP: Record<OrderStatus, number> = {
  new: 0,
  cooking: 1,
  ready: 2,
  picked_up: 3,
  delivered: 3,
  cancelled: 0,
  rejected: 0,
};

/** Board 1b·3 — items with variants and add-ons, bill, commission-adjusted payout. */
export function OrderDetailScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const now = useNow();
  const { params } = useVendorRoute<'OrderDetail'>();
  const { order: find, store, state, actions } = useVendor();
  const commission = state.details?.commission;
  const order = find(params.id);

  if (!order) {
    return (
      <Screen>
        <BackHeader title="Order" onBack={nav.goBack} />
        <EmptyState icon={SearchX} title="Order not found" body="It may belong to a different store." />
      </Screen>
    );
  }

  const work = workLabel(store.category);
  // An invoice only makes sense for an order the store has taken on.
  const canShareInvoice = order.status !== 'new' && order.status !== 'rejected' && order.status !== 'cancelled';
  const shareInvoice = async () => {
    try {
      await Share.share({ title: `Invoice #${order.id}`, message: invoiceText(order, store) });
    } catch {
      toast('Could not open sharing');
    }
  };
  const pillTone = order.status === 'new' || order.status === 'ready' ? 'sky' : order.status === 'cooking' ? 'leaf' : 'neutral';

  const footer =
    order.status === 'new' ? (
      <>
        <Button label="Reject" icon={X} variant="outline" flex={1} onPress={() => nav.navigate('RejectOrder', { id: order.id })} />
        <Button label="Accept & start preparing" icon={Check} flex={2.2} onPress={() => nav.navigate('AcceptOrder', { id: order.id })} />
      </>
    ) : order.status === 'cooking' ? (
      <>
        <Button
          label="+5 min"
          variant="outline"
          flex={1}
          onPress={() => {
            actions.addMinutes(order.id, 5);
            toast('Prep time extended by 5 minutes');
          }}
        />
        <Button
          label="Mark ready"
          flex={2}
          onPress={() => {
            actions.markReady(order.id);
            toast('Marked ready · partner notified');
          }}
        />
      </>
    ) : order.status === 'ready' ? (
      <Button label="Hand over to partner" flex={1} onPress={() => nav.navigate('Handover', { id: order.id })} />
    ) : undefined;

  return (
    <Screen footer={footer}>
      <BackHeader
        title={`#${order.id}`}
        subtitle={`${dayClock(order.placedAt, now)} · ${order.refunded ? 'Refunded' : order.payment === 'cod' ? 'COD' : 'Prepaid'}`}
        onBack={nav.goBack}
        pill={ORDER_STATUS_LABEL[order.status]}
        pillTone={pillTone}
      />

      {order.status === 'cancelled' || order.status === 'rejected' ? (
        <Card tone="sky">
          <Text v="bodyStrong" color={palette.blueDeep}>
            {order.closeNote}
          </Text>
          <Text v="body" color={palette.blueDeep}>
            {order.refunded ? `${formatAmount(order.total)} refunded to the customer's original payment.` : 'No payout for this order.'}
          </Text>
        </Card>
      ) : (
        <Card>
          <StageTracker steps={['Received', work, 'Ready', 'Picked up']} current={STEP[order.status]} />
        </Card>
      )}

      <Card>
        <SectionLabel>{itemsLabel(order)}</SectionLabel>
        {order.lines.map((l, i) => (
          <View key={`${l.name}-${i}`}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <View style={styles.line}>
              <View style={styles.vegWrap}>
                <VegMark veg={l.veg} />
              </View>
              <View style={styles.flex}>
                <Text v="bodyStrong" style={styles.lineName}>
                  {l.name}
                </Text>
                {l.variant || l.options ? (
                  <Text v="body" muted>
                    {[l.variant, l.options].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.right}>
                <Text v="bodyStrong">{`× ${l.qty}`}</Text>
                <Text v="body" muted>
                  {formatAmount(l.price)}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {order.note ? (
          <>
            <Divider style={styles.divider} />
            <Text v="body" muted>
              <Text v="bodyStrong">Customer note: </Text>
              {order.note}
            </Text>
          </>
        ) : null}
      </Card>

      <Card>
        <AmountRow label="Item total" amount={order.itemTotal} />
        <AmountRow label="Packing" amount={order.packing} />
        <AmountRow label="GST" amount={order.gst} />
        {order.coupon ? <AmountRow label={`Coupon ${order.coupon.code}`} amount={-order.coupon.amount} /> : null}
        <AmountRow label="Order total" amount={order.total} total />
        <Text v="caption" muted style={styles.payout}>
          {commission
            ? `Your payout after ${commission}% commission: ${formatAmount(order.payout)}`
            : `Your payout: ${formatAmount(order.payout)}`}
        </Text>
      </Card>

      <Card>
        <View style={styles.customer}>
          <View style={styles.flex}>
            <Text v="bodyStrong" style={styles.lineName}>
              {`${order.customer.name} · ${order.customer.area}`}
            </Text>
            <Text v="body" muted>
              {order.partner
                ? `${order.customer.distanceKm} km · ${order.partner.name} ${order.partner.atCounter ? 'at counter' : 'assigned'}`
                : `${order.customer.distanceKm} km · partner assigned after "Ready"`}
            </Text>
          </View>
          <IconCircle icon={Phone} onPress={() => toast(`Calling ${order.customer.name} via masked number…`)} />
        </View>
      </Card>

      {canShareInvoice ? <Button label="Share invoice" variant="outline" icon={Share2} onPress={shareInvoice} /> : null}

      {state.busyMode && order.status === 'new' ? (
        <Text v="caption" muted center>
          Busy mode is on — 10 minutes will be added to the prep time you choose.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: { marginVertical: space.md },
  line: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  vegWrap: { paddingTop: 3 },
  flex: { flex: 1 },
  lineName: { fontSize: 15 },
  right: { alignItems: 'flex-end' },
  payout: { marginTop: space.sm },
  customer: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
