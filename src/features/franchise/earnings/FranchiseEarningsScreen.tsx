import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, KeyValue, Pill, Screen, SectionHeader, Text, TitleHeader } from '@/components';
import { useFranchise } from '@/data/franchiseStore';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

/**
 * Commission earned: `commissionPct` of the sub-total of every order the franchise's
 * vendors delivered, counted on the day of delivery. Payouts are made by the platform
 * admin; this screen shows what has been earned, not what has been transferred.
 */
export function FranchiseEarningsScreen() {
  const { state, refresh } = useFranchise();
  const { profile, month, weeks } = state;

  return (
    <Screen tab onRefresh={refresh}>
      <TitleHeader title="Earnings" />

      <Card tone="accent" style={styles.hero}>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          Last 30 days
        </Text>
        <Text v="hero" color={palette.white} style={styles.heroValue}>
          {formatAmount(month.earned)}
        </Text>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          {`${profile.commissionPct}% of ${formatAmount(month.sales)} · ${month.orders} orders delivered`}
        </Text>
      </Card>

      <Card>
        <KeyValue label="Delivered orders" value={String(month.orders)} />
        <KeyValue label="Sales from your vendors" value={formatAmount(month.sales)} />
        <KeyValue label="Cancelled or rejected" value={String(month.cancelled)} />
        <KeyValue label="Commission rate" value={`${profile.commissionPct}%`} />
        <KeyValue label="Payout account" value={profile.bank || 'Not added'} strong />
      </Card>

      <SectionHeader title="Weekly statements" />
      {weeks.map(w => (
        <Card key={w.id} tone={w.current ? 'highlight' : 'paper'}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text v="cardTitle">{w.label}</Text>
              <Text v="body" muted>
                {`${w.orders} orders · ${formatAmount(w.sales)} sales`}
              </Text>
            </View>
            <View style={styles.right}>
              <Text v="stat">{formatAmount(w.earned)}</Text>
              {w.current ? <Pill label="This week" tone="soft" /> : null}
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.xl, borderRadius: 26, gap: 2 },
  heroValue: { fontSize: 34, lineHeight: 40, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
});
