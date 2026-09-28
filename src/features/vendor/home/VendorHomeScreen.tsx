import React, { useState } from 'react';
import { MapPin, ShoppingBag, Store, UtensilsCrossed } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  Card,
  DateRangePicker,
  Avatar,
  BellButton,
  LinkButton,
  MiniBars,
  Screen,
  SectionHeader,
  StatTile,
  Text,
  TileRow,
  Toggle,
} from '@/components';
import { USE_MOCK_DATA } from '@config/constants';
import { useVendor } from '@/data/vendorStore';
import { workLabel } from '@/domain/labels';
import { useNow } from '@/hooks/useNow';
import { useVendorNav } from '@/navigation/types';
import { palette, radius, space, useTheme } from '@/theme';
import { formatAmount } from '@/utils/currency';

import { NewOrderCard } from '../orders/OrderCards';

type HistoryRange = { from: Date | null; to: Date | null };

const apiDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Board 4a·1 (Food home) — queue first, money second. */
export function VendorHomeScreen() {
  const nav = useVendorNav();
  const now = useNow();
  const { store, state, newOrders, cookingOrders, readyOrders, unread, actions } = useVendor();
  const { r } = useTheme();
  const first = newOrders[0];
  const [historyRange, setHistoryRange] = useState<HistoryRange>({ from: null, to: null });
  const openHistory = (range: HistoryRange) => {
    setHistoryRange(range);
    if (range.from && range.to) nav.navigate('HistoryDetails', { from: apiDate(range.from), to: apiDate(range.to) });
  };

  const status = !state.open
    ? 'Closed · not accepting orders'
    : state.busyMode
      ? 'Open · busy mode +10 min'
      : `Open · ${store.hours}`;

  const goOrders = (tab: 'new' | 'cooking' | 'ready') => nav.navigate('VendorTabs', { screen: 'Orders', params: { tab } });

  return (
    <Screen tab contentStyle={styles.screen} gap={0}>
      <View style={[styles.hero, { backgroundColor: r.accent }]}>
        <View pointerEvents="none" style={styles.pattern}>
          <ShoppingBag style={styles.patternOne} size={86} color={palette.white} strokeWidth={1} />
          <Store style={styles.patternTwo} size={70} color={palette.white} strokeWidth={1} />
          <UtensilsCrossed style={styles.patternThree} size={56} color={palette.white} strokeWidth={1} />
        </View>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <Text v="headline" color={palette.white} style={styles.storeName}>
              {store.name}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: state.open ? '#7CE783' : '#FFB3AE' }]} />
              <Text v="caption" color="rgba(255,255,255,0.90)">
                {status}
              </Text>
            </View>
          </View>
          <View style={styles.profileAction}>
            <Avatar initials={store.initials} size={46} tone="onDark" />
            <BellButton onPress={() => nav.navigate('Notifications')} dot={unread > 0} />
          </View>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color="rgba(255,255,255,0.88)" strokeWidth={2.2} />
          <Text v="caption" color="rgba(255,255,255,0.88)">
            {`${store.category} store · ${store.area}`}
          </Text>
        </View>
      </View>

      <View style={styles.workspace}>
        <View style={styles.workspaceHeading}>
          <Text v="cardTitle">Today’s workspace</Text>
          <Text v="caption" muted>{`${newOrders.length + cookingOrders.length + readyOrders.length} active orders`}</Text>
        </View>
        <DateRangePicker value={historyRange} onChange={openHistory} />

      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">{state.open ? 'Accepting orders' : 'Not accepting orders'}</Text>
            <Text v="body" muted>
              {state.open ? `${store.service} · closes ${store.closesAt}` : 'Customers see the store as closed'}
            </Text>
          </View>
          <Toggle value={state.open} onChange={actions.toggleOpen} />
        </View>
      </Card>

      <TileRow>
        <StatTile value={String(newOrders.length)} label="New" onPress={() => goOrders('new')} />
        <StatTile value={String(cookingOrders.length)} label={workLabel(store.category)} onPress={() => goOrders('cooking')} />
        <StatTile value={String(readyOrders.length)} label="Ready" onPress={() => goOrders('ready')} />
      </TileRow>

      <Card onPress={() => nav.navigate('VendorTabs', { screen: 'Earnings' })}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="body" muted>
              Today
            </Text>
            <Text v="display">{formatAmount(state.today.amount)}</Text>
            <Text v="body" muted>
              {`${state.today.orders} orders · avg ${formatAmount(state.today.avg)}`}
            </Text>
          </View>
          <MiniBars values={state.today.bars} />
        </View>
      </Card>

      {newOrders.length > 1 ? (
        <SectionHeader title="New order" action={`See all ${newOrders.length}`} onAction={() => goOrders('new')} />
      ) : null}

      {first ? (
        <NewOrderCard
          order={first}
          now={now}
          highlight
          showCountdown="ago"
          onOpen={() => nav.navigate('AcceptOrder', { id: first.id })}
          onAccept={() => nav.navigate('AcceptOrder', { id: first.id })}
          onReject={() => nav.navigate('RejectOrder', { id: first.id })}
        />
      ) : (
        <Card>
          <Text v="cardTitle">No new orders</Text>
          <Text v="body" muted style={styles.gap}>
            {state.open ? "You're all caught up. New orders appear here instantly." : 'Turn on accepting orders to receive new ones.'}
          </Text>
          {USE_MOCK_DATA ? (
            <LinkButton label="Simulate a new order (demo)" onPress={actions.simulateOrder} style={styles.gapLg} />
          ) : null}
        </Card>
      )}
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  hero: { minHeight: 158, overflow: 'hidden', paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: 24 },
  pattern: { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  patternOne: { position: 'absolute', right: -8, top: -18, transform: [{ rotate: '-18deg' }] },
  patternTwo: { position: 'absolute', right: 90, top: 50, transform: [{ rotate: '15deg' }] },
  patternThree: { position: 'absolute', left: -8, bottom: -16, transform: [{ rotate: '-24deg' }] },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  storeName: { fontSize: 19, lineHeight: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  profileAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 20 },
  workspace: {
    gap: 12,
    marginTop: -12,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.xxl + 60,
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  workspaceHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  gap: { marginTop: 4 },
  gapLg: { marginTop: space.md },
});
