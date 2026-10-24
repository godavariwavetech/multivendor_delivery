import { Check, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { AmountRow, BackHeader, Banner, Button, Card, Screen, SectionLabel, Text, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import { useDeliveryNav, useDeliveryRoute } from '@/navigation/types';
import { space } from '@/theme';
import { clock } from '@/utils/datetime';

import { OrderDetailCards, OrderHero } from '../OrderDetailCards';

/** Board 1c·2 / 3b·1 — one request in full: payout, dishes and bill, payment, route. No response timer. */
export function IncomingRequestScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { params } = useDeliveryRoute<'IncomingRequest'>();
  const { request, state, actions } = useDelivery();
  const r = request(params.id);
  const busy = Boolean(state.active && state.active.stage !== 'complete');

  // ON HOLD: the 20-second window and the auto-skip when it ran out.
  // const [openedAt] = useState(() => Date.now());
  // const left = RESPOND_SECONDS - (now - openedAt) / 1000;
  // useEffect(() => {
  //   // Busy partners are only looking: the list does not expire a request for them either.
  //   if (left <= 0 && r?.status === 'open' && !busy) {
  //     actions.skip(r.id);
  //     toast('Request expired · reassigned');
  //     nav.goBack();
  //   }
  // }, [actions, busy, left, nav, r, toast]);

  // The partner who accepts first gets the order; if another partner took it while this sheet was open, close it.
  const accepting = useRef(false);
  useEffect(() => {
    if (!accepting.current && (!r || r.status === 'taken')) {
      toast('This order was taken by another partner');
      nav.goBack();
    }
  }, [nav, r, toast]);

  if (!r) {
    return null;
  }

  const food = r.category === 'food';
  const title = food ? 'Food pickup' : `${CATEGORY_LABEL[r.category]} pickup`;

  const accept = () => {
    if (busy) {
      toast('Finish your active delivery first');
      return;
    }
    accepting.current = true;
    actions.accept(r.id);
    nav.goBack();
    nav.navigate('DeliveryTabs', { screen: 'Active' });
  };

  return (
    <Screen
      footer={
        <>
          <Button
            label="Reject"
            icon={X}
            variant="outline"
            size="lg"
            flex={1}
            onPress={() => {
              actions.skip(r.id);
              nav.goBack();
            }}
          />
          <Button label="Accept delivery" icon={Check} variant="green" size="lg" flex={1.8} onPress={accept} />
        </>
      }>
      <BackHeader title={`Order #${r.id}`} subtitle={`${title} · ${r.store.name}`} onBack={nav.goBack} />

      <OrderHero request={r} />

      {food && r.readyInMin > 0 ? (
        <Banner
          tone="leaf"
          title={`Food is ready at ${clock(Date.now() + r.readyInMin * 60_000)}.`}
          body="Reach the store around then — no long wait expected."
        />
      ) : null}

      <Card>
        <SectionLabel>Your delivery payout</SectionLabel>
        <AmountRow label="Base pay" amount={r.breakdown.base} />
        <AmountRow label={`Distance pay · ${r.drop.distanceKm} km`} amount={r.breakdown.distance} />
        {r.breakdown.tip ? <AmountRow label="Customer tip" amount={r.breakdown.tip} /> : null}
        <AmountRow label="You earn" amount={r.payout} total />
        <Text v="caption" subtle style={styles.note}>
          This is your pay for delivering the order. It is not the price the customer pays.
        </Text>
      </Card>

      <OrderDetailCards request={r} />

      <Text v="caption" subtle center>
        Rejected requests are reassigned automatically.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: space.sm },
});
