import { Route } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountRow,
  BackHeader,
  Button,
  Card,
  EmptyState,
  HeroBars,
  KeyValue,
  LinkButton,
  Pill,
  RouteTimeline,
  Screen,
  SectionHeader,
  SectionLabel,
  TabPills,
  Text,
  TitleHeader,
  useToast,
} from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import type { Trip } from '@/domain/types';
import { useDeliveryNav, useDeliveryRoute } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock } from '@/utils/datetime';

export function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const cancelled = trip.status === 'cancelled';
  const detail = cancelled
    ? `${clock(trip.at)} · ${trip.note}`
    : `${clock(trip.at)} · ${trip.km} km · ${trip.minutes} min${trip.tip ? ` · +${formatAmount(trip.tip)} tip` : ''}`;
  return (
    <Card onPress={onPress} style={cancelled ? styles.faded : undefined}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text v="bodyStrong" numberOfLines={1} style={styles.tripTitle}>{`#${trip.id} · ${trip.store}`}</Text>
          <Text v="body" muted numberOfLines={1}>
            {detail}
          </Text>
        </View>
        <View style={styles.right}>
          <Text v="cardTitle">{formatAmount(trip.earning)}</Text>
          <Text v="captionStrong" color={cancelled ? palette.inkSubtle : palette.greenDeep}>
            {cancelled ? 'Cancelled' : 'Delivered'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** Board 4b·4 / 1c·5 — weekly earnings, how it adds up, payout status, today's trips. */
export function PartnerEarningsScreen() {
  const nav = useDeliveryNav();
  const { week, today, state } = useDelivery();

  return (
    <Screen tab>
      <TitleHeader title="Earnings" right={<LinkButton label="Statement" color={palette.greenDeep} onPress={() => nav.navigate('Statement')} />} />

      <Card tone="green" style={styles.hero}>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          {week.label}
        </Text>
        <Text v="hero" color={palette.canvas} style={styles.heroAmount}>
          {formatAmount(week.total)}
        </Text>
        <Text v="body" color={palette.canvas}>{`${week.trips} food deliveries · ${week.km} km`}</Text>
        <View style={styles.bars}>
          <HeroBars values={week.bars} height={64} />
        </View>
      </Card>

      <Card>
        <SectionLabel>How it adds up</SectionLabel>
        <AmountRow label={`Trip base · ${week.trips} trips`} amount={week.base} />
        <AmountRow label="Distance pay" amount={week.distance} />
        <AmountRow label="Peak bonus" amount={week.peak} />
        <AmountRow label="Tips" amount={week.tips} />
        <AmountRow label="Payable" amount={week.base + week.distance + week.peak + week.tips} total />
      </Card>

      <Card tone="sky">
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">{`Payout on ${week.payoutDate}`}</Text>
            <Text v="body">{`${formatAmount(week.total)} · ${week.bank}`}</Text>
          </View>
          <Pill label="Pending" tone="sky" />
        </View>
      </Card>

      <SectionHeader
        title={`Today · ${today.deliveries} trips`}
        action={formatAmount(today.earned)}
        actionColor={palette.greenDeep}
      />
      {state.trips.map(t => (
        <TripRow key={`${t.id}-${t.at}`} trip={t} onPress={() => nav.navigate('TripDetail', { id: t.id })} />
      ))}
      <LinkButton center label="See full history" color={palette.greenDeep} onPress={() => nav.navigate('History')} style={styles.more} />
    </Screen>
  );
}

export function StatementScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { week, statements } = useDelivery();
  return (
    <Screen footer={<Button label="Download statement" variant="outline" flex={1} onPress={() => toast('Statement PDF saved to Downloads')} />}>
      <BackHeader title="Statement" subtitle={`Weekly payouts · ${week.bank}`} onBack={nav.goBack} />
      {statements.map((s, i) => {
        const amount = i === 0 ? week.total : s.amount;
        const trips = i === 0 ? week.trips : s.trips;
        return (
          <Card key={s.id} tone={s.status === 'pending' ? 'sky' : 'paper'}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text v="cardTitle">{formatAmount(amount)}</Text>
                <Text v="body" muted>{`${s.label} · ${trips} trips`}</Text>
                <Text v="caption" muted>
                  {s.note}
                </Text>
              </View>
              <Pill label={s.status === 'pending' ? 'Pending' : 'Paid'} tone={s.status === 'pending' ? 'sky' : 'leaf'} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

export function TripDetailScreen() {
  const nav = useDeliveryNav();
  const { params } = useDeliveryRoute<'TripDetail'>();
  const { trip: find, request } = useDelivery();
  const t = find(params.id);
  const req = request(params.id);

  if (!t) {
    return (
      <Screen>
        <BackHeader title={`#${params.id}`} onBack={nav.goBack} />
        <EmptyState icon={Route} title="Trip not found" body="It may be from an earlier week." />
      </Screen>
    );
  }

  const b = t.breakdown ?? { base: t.earning - t.tip, distance: 0, tip: t.tip };
  const cancelled = t.status === 'cancelled';

  return (
    <Screen
      footer={
        <Button label="Report an issue with this trip" variant="outline" flex={1} onPress={() => nav.navigate('ReportProblem', { context: `Trip #${t.id}` })} />
      }>
      <BackHeader
        title={`#${t.id}`}
        subtitle={`${t.store} · ${clock(t.at)}`}
        onBack={nav.goBack}
        pill={cancelled ? 'Cancelled' : 'Delivered'}
        pillTone={cancelled ? 'neutral' : 'leaf'}
      />
      <Card>
        <RouteTimeline
          from={{ title: t.store, subtitle: req ? req.store.area : 'Pickup' }}
          to={{ title: t.customer ?? 'Customer', subtitle: req ? req.drop.area : 'Drop' }}
        />
      </Card>
      <Card>
        <SectionLabel>Earnings</SectionLabel>
        <AmountRow label={cancelled ? 'Attempt pay' : 'Base'} amount={b.base} />
        {!cancelled ? <AmountRow label="Distance" amount={b.distance} /> : null}
        {!cancelled ? <AmountRow label="Tip" amount={b.tip} /> : null}
        <AmountRow label="Earned" amount={t.earning} total />
      </Card>
      <Card>
        <KeyValue label="Distance" value={`${t.km} km`} strong />
        <KeyValue label="Trip time" value={`${t.minutes} min`} strong />
        {cancelled ? (
          <KeyValue label="Reason" value={t.note ?? '—'} strong />
        ) : (
          <KeyValue label="Verified by" value={t.verifiedBy ?? 'Customer OTP'} strong />
        )}
      </Card>
    </Screen>
  );
}

type Filter = 'all' | 'delivered' | 'cancelled';

/** Delivery SRS 11 — completed deliveries and cancelled attempts. */
export function HistoryScreen() {
  const nav = useDeliveryNav();
  const { state } = useDelivery();
  const [filter, setFilter] = useState<Filter>('all');
  const trips = state.trips.filter(t => filter === 'all' || t.status === filter);

  return (
    <Screen>
      <BackHeader title="Delivery history" subtitle={`Today · ${state.trips.length} trips shown`} onBack={nav.goBack} />
      <TabPills
        tabs={[
          { key: 'all', label: 'All' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {trips.length ? (
        trips.map(t => <TripRow key={`${t.id}-${t.at}`} trip={t} onPress={() => nav.navigate('TripDetail', { id: t.id })} />)
      ) : (
        <EmptyState icon={Route} title="No trips here" body="Trips that match this filter will show up here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
  tripTitle: { fontSize: 15 },
  faded: { opacity: 0.7 },
  hero: { padding: space.xl, borderRadius: 26 },
  heroAmount: { fontSize: 38, lineHeight: 46, marginVertical: 2 },
  bars: { marginTop: space.xl },
  more: { marginTop: space.sm },
});
