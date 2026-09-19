import React from 'react';

import { AmountRow, BackHeader, Banner, Button, Card, KeyValue, Screen, SectionLabel, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav, useVendorRoute } from '@/navigation/types';

/** Vendor SRS 9 — settlement detail: what was sold, what was deducted, where it was paid. */
export function SettlementDetailScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { params } = useVendorRoute<'SettlementDetail'>();
  const { store, state } = useVendor();
  const commission = state.details?.commission;
  const s = state.settlements.find(x => x.id === params.id) ?? state.settlements[0];

  const pill = s.status === 'pending' ? 'Pending' : s.status === 'settled' ? 'Settled' : 'Refund';

  return (
    <Screen footer={<Button label="Download statement" variant="outline" flex={1} onPress={() => toast('Statement PDF saved to Downloads')} />}>
      <BackHeader
        title={s.status === 'refund' ? 'Refund adjustment' : 'Settlement'}
        subtitle={s.period}
        onBack={nav.goBack}
        pill={pill}
        pillTone={s.status === 'pending' ? 'sky' : s.status === 'settled' ? 'leaf' : 'neutral'}
      />

      {s.status === 'pending' ? (
        <Banner tone="sky" title={`${s.title}`} body={`${s.paidOn} to ${store.bank}. Orders until Sunday midnight are included.`} />
      ) : null}

      {s.status === 'refund' ? (
        <Card>
          <SectionLabel>Linked to original payment</SectionLabel>
          <KeyValue label="Order" value="#VK-2826" strong />
          <KeyValue label="Reason" value="Cancelled · out of stock" />
          <KeyValue label="Refunded to customer" value={`₹${s.amount}`} strong />
          <KeyValue label="Adjusted" value={s.paidOn ?? ''} />
        </Card>
      ) : (
        <>
          <Card>
            <SectionLabel>Breakdown</SectionLabel>
            <AmountRow label={`Gross sales · ${s.orders} orders`} amount={s.gross ?? 0} />
            <AmountRow
              label={commission ? `Platform commission (${commission}%)` : 'Platform commission'}
              amount={-(s.commission ?? 0)}
            />
            <AmountRow label="Refunds & cancellations" amount={-(s.refunds ?? 0)} />
            <AmountRow label="Net payable" amount={s.amount} total />
          </Card>
          <Card>
            <SectionLabel>Payout</SectionLabel>
            <KeyValue label="Bank account" value={store.bank} strong />
            <KeyValue label="Status" value={s.paidOn ?? ''} />
            {s.utr ? <KeyValue label="UTR" value={s.utr} strong /> : null}
            <KeyValue label="Cycle" value={`${s.period} · weekly`} />
          </Card>
        </>
      )}
    </Screen>
  );
}
