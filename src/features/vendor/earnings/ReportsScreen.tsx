import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  Chip,
  ChipRow,
  DayBars,
  KeyValue,
  Screen,
  SectionLabel,
  TabPills,
  Text,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav } from '@/navigation/types';
import { space } from '@/theme';
import { formatAmount } from '@/utils/currency';

type Kind = 'orders' | 'sales' | 'settlements';

/** Vendor SRS 11 — order, sales and settlement reports for a period. */
export function ReportsScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { store, state } = useVendor();
  const [kind, setKind] = useState<Kind>('sales');
  const [period, setPeriod] = useState('This month');

  const headline =
    kind === 'orders'
      ? { label: 'Orders', value: String(state.earnings.month.orders) }
      : kind === 'sales'
        ? { label: 'Gross sales', value: formatAmount(state.earnings.month.gross) }
        : { label: 'Net payable', value: formatAmount(state.earnings.month.net) };

  return (
    <Screen footer={<Button label="Download CSV" flex={1} onPress={() => toast(`${period} ${kind} report saved to Downloads`)} />}>
      <BackHeader title="Reports" subtitle={store.name} onBack={nav.goBack} />
      <TabPills
        tabs={[
          { key: 'orders', label: 'Orders' },
          { key: 'sales', label: 'Sales' },
          { key: 'settlements', label: 'Settlements' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <ChipRow>
        {['Today', 'This week', 'This month', 'Last month'].map(p => (
          <Chip key={p} label={p} selected={p === period} onPress={() => setPeriod(p)} />
        ))}
      </ChipRow>

      <Card>
        <Text v="body" muted>{`${headline.label} · ${period}`}</Text>
        <Text v="display">{headline.value}</Text>
        <DayBars data={state.dailySales} height={70} />
      </Card>

      <Card>
        <SectionLabel>Summary</SectionLabel>
        {state.reportRows[kind].map(r => (
          <KeyValue key={r.label} label={r.label} value={r.value} strong />
        ))}
      </Card>

      <View style={styles.pad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { height: space.sm },
});
