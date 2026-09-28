import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { apiClient, endpoints } from '@/api';
import { BackHeader, Card, Pill, Screen, SectionHeader, Text } from '@/components';
import { USE_MOCK_HISTORY } from '@config/constants';
import { mockHistorySummary, type HistorySummary } from '@/data/demo/vendorHistory';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { palette, useTheme } from '@/theme';
import { formatAmount } from '@/utils/currency';

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const rangeLabel = (from: Date, to: Date) => `${from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

/** Sales and completed-order details for the period chosen on the vendor home screen. */
export function HistoryDetailsScreen() {
  const nav = useVendorNav();
  const { params } = useVendorRoute<'HistoryDetails'>();
  const { r } = useTheme();
  const from = parseDate(params.from);
  const to = parseDate(params.to);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    if (USE_MOCK_HISTORY) {
      setSummary(mockHistorySummary(parseDate(params.from), parseDate(params.to)));
      setLoading(false);
      return () => { current = false; };
    }
    apiClient
      .get<{ data: HistorySummary }>(`${endpoints.vendor.history}?from=${params.from}&to=${params.to}`)
      .then(response => { if (current) setSummary(response.data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [params.from, params.to]);

  return (
    <Screen>
      <BackHeader title="History details" subtitle={rangeLabel(from, to)} onBack={nav.goBack} pill={USE_MOCK_HISTORY ? 'Demo data' : undefined} />

      <Card tone="sky">
        <Text v="body" muted>{rangeLabel(from, to)}</Text>
        <Text v="hero">{loading ? '…' : error ? '—' : formatAmount(summary?.gross ?? 0)}</Text>
        <Text v="body" muted>{loading ? 'Loading orders…' : error ? 'Could not load this period.' : `${summary?.orders ?? 0} orders · avg ${formatAmount(summary?.avg ?? 0)}`}</Text>
        {!loading && !error ? <Text v="caption" muted style={styles.payout}>{`Net payout ${formatAmount(summary?.payout ?? 0)}`}</Text> : null}
      </Card>

      <SectionHeader title={`Recent orders (${summary?.orders ?? 0})`} />
      <Card style={styles.ordersCard}>
        {summary?.recentOrders.length ? summary.recentOrders.map((order, index) => (
          <View key={order.id} style={[styles.order, index < summary.recentOrders.length - 1 && styles.orderBorder]}>
            <View style={[styles.icon, { backgroundColor: r.soft }]}><ShoppingBag size={16} color={r.accentDeep} /></View>
            <View style={styles.flex}>
              <Text v="bodyStrong">{order.id}</Text>
              <Text v="caption" muted>{order.placedAt}</Text>
            </View>
            <Text v="bodyStrong">{formatAmount(order.amount)}</Text>
            <Pill label={order.status} tone={order.status === 'Ready' ? 'leaf' : order.status === 'Cooking' ? 'sky' : 'neutral'} style={styles.pill} />
          </View>
        )) : <Text v="body" muted>{loading ? 'Loading recent orders…' : 'No completed orders in this period.'}</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  payout: { marginTop: 4 },
  ordersCard: { gap: 0, paddingVertical: 2 },
  order: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9 },
  orderBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pill: { marginLeft: 2, paddingHorizontal: 8, paddingVertical: 3 },
});
