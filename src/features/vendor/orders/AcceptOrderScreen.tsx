import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountRow,
  BackHeader,
  Banner,
  Button,
  Card,
  ChoiceRow,
  Divider,
  Screen,
  SectionLabel,
  Text,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useNow } from '@/hooks/useNow';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { PREP_TIME_OPTIONS } from '@config/constants';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock, formatCountdown } from '@/utils/datetime';
import { acceptSecondsLeft } from '@/utils/orders';

const PREP_OPTIONS = PREP_TIME_OPTIONS.map(m => ({ key: m, label: `${m} m` }));

/** Board 3a·2 — the prep estimate the vendor picks drives partner assignment. */
export function AcceptOrderScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const now = useNow();
  const { params } = useVendorRoute<'AcceptOrder'>();
  const { order: find, store, state, actions } = useVendor();
  const order = find(params.id);
  const [prep, setPrep] = useState(15);

  if (!order) {
    return null;
  }

  const left = acceptSecondsLeft(order, now);
  const food = store.category === 'food';
  const effective = prep + (state.busyMode ? 10 : 0);

  const accept = () => {
    actions.accept(order.id, prep);
    toast(`#${order.id} accepted · ${effective} min`);
    nav.goBack();
    nav.navigate('VendorTabs', { screen: 'Orders', params: { tab: 'cooking' } });
  };

  if (order.status !== 'new') {
    return (
      <Screen>
        <BackHeader title={`#${order.id}`} subtitle="Already handled" onBack={nav.goBack} />
        <Card>
          <Text v="body">This order is no longer waiting for a decision.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button label="Reject" variant="outline" flex={1} onPress={() => nav.navigate('RejectOrder', { id: order.id })} />
          <Button label={`Accept · ${effective} min`} flex={2} onPress={accept} />
        </>
      }>
      <BackHeader
        title={`#${order.id}`}
        subtitle={`Today ${clock(order.placedAt)} · ${order.payment === 'cod' ? 'COD' : 'Prepaid'} ${formatAmount(order.total)}`}
        onBack={nav.goBack}
        pill={left > 0 ? `${formatCountdown(left)} left` : 'Accept now'}
        pillTone="sky"
      />

      <Card>
        <SectionLabel>{food ? 'Kitchen ticket' : 'Packing slip'}</SectionLabel>
        {order.lines.map((l, i) => (
          <View key={`${l.name}-${i}`}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <View style={styles.ticketLine}>
              <Text v="cardTitle" style={styles.qty}>{`${l.qty}×`}</Text>
              <View style={styles.flex}>
                <Text v="cardTitle" style={styles.lineName}>
                  {l.variant ? `${l.name} · ${l.variant}` : l.name}
                </Text>
                {l.options ? (
                  <Text v="body" muted>
                    {l.options}
                  </Text>
                ) : null}
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
        <SectionLabel>{food ? 'Prep time you promise' : 'Packing time you promise'}</SectionLabel>
        <ChoiceRow options={PREP_OPTIONS} value={prep} onChange={setPrep} />
        <Text v="body" muted style={styles.note}>
          {`A partner is assigned to arrive at ${clock(now + effective * 60_000)}.`}
          {state.busyMode ? ' Busy mode adds 10 min.' : ''}
        </Text>
      </Card>

      <Card>
        <AmountRow label="Item total" amount={order.itemTotal} />
        <AmountRow label="Packing + GST" amount={order.packing + order.gst} />
        {order.coupon ? <AmountRow label={`Coupon ${order.coupon.code}`} amount={-order.coupon.amount} /> : null}
        <AmountRow label="Your payout" amount={order.payout} total />
      </Card>

      <Banner
        tone="sky"
        title="Rejecting needs a reason"
        body="Item unavailable · kitchen overloaded · store closing. Repeated rejections affect your rating."
      />
      <Text v="caption" color={palette.inkSubtle} center>
        Orders not accepted within 3 minutes are passed to the store admin.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: { marginVertical: space.md },
  ticketLine: { flexDirection: 'row', gap: space.md },
  qty: { width: 32 },
  lineName: { fontSize: 15 },
  flex: { flex: 1 },
  note: { marginTop: space.md },
});
