import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountRow,
  Card,
  DayBars,
  HeroSegment,
  LinkButton,
  Pill,
  Screen,
  SectionHeader,
  SectionLabel,
  Text,
  TitleHeader,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import type { Settlement } from '@/domain/types';
import { useVendorNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

type Period = 'month' | 'lastMonth' | 'custom';

/** Board 4a·4 / 1b·5 — earnings after deductions, settlement history, refunds. */
export function EarningsScreen() {
  const nav = useVendorNav();
  const { store, state } = useVendor();
  const [period, setPeriod] = useState<Period>('month');
  const e = state.earnings[period];
  const salesLabel = store.category === 'food' ? 'Food sales' : 'Sales';
  const commission = state.details?.commission;

  return (
    <Screen tab>
      <TitleHeader title="Earnings" right={<LinkButton label="Reports" onPress={() => nav.navigate('Reports')} />} />

      <Card tone="accent" style={styles.hero}>
        <Text v="body" color="rgba(249, 244, 237, 0.85)">{`Net payable · ${e.label}`}</Text>
        <Text v="hero" color={palette.cream} style={styles.heroAmount}>
          {formatAmount(e.net)}
        </Text>
        <HeroSegment
          tabs={[
            { key: 'month', label: 'This month' },
            { key: 'lastMonth', label: 'Last month' },
            { key: 'custom', label: 'Custom' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </Card>

      <Card>
        <SectionLabel>Breakdown</SectionLabel>
        <AmountRow label={`${salesLabel} · ${e.orders} orders`} amount={e.gross} />
        <AmountRow label={commission ? `Commission (${commission}%)` : 'Commission'} amount={-e.commission} />
        <AmountRow label="Coupon share" amount={-e.coupon} />
        <AmountRow label="Net payable" amount={e.net} total />
      </Card>

      <Card>
        <View style={styles.row}>
          <Text v="cardTitle">Daily sales</Text>
          <Text v="body" muted>
            Last 7 days
          </Text>
        </View>
        <DayBars data={state.dailySales} />
      </Card>

      <SectionHeader title="Settlements" action="Report" onAction={() => nav.navigate('Reports')} />
      {state.settlements.map(s => (
        <SettlementCard key={s.id} settlement={s} onPress={() => nav.navigate('SettlementDetail', { id: s.id })} />
      ))}
    </Screen>
  );
}

export function SettlementCard({ settlement: s, onPress }: { settlement: Settlement; onPress: () => void }) {
  const pill =
    s.status === 'pending'
      ? { label: 'Pending', tone: 'peach' as const }
      : s.status === 'settled'
        ? { label: 'Settled', tone: 'mint' as const }
        : { label: 'Refund', tone: 'neutral' as const };
  return (
    <Card tone={s.status === 'pending' ? 'peach' : 'paper'} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text v="cardTitle">{s.title}</Text>
          <Text v="body" muted numberOfLines={1}>
            {s.subtitle}
          </Text>
        </View>
        <Pill label={pill.label} tone={pill.tone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.xl, borderRadius: 26 },
  heroAmount: { fontSize: 36, lineHeight: 44, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  flex: { flex: 1 },
});
