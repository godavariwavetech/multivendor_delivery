import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Card,
  HomeHeader,
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
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

import { NewOrderCard } from '../orders/OrderCards';

/** Board 4a·1 (Food home) — queue first, money second. */
export function VendorHomeScreen() {
  const nav = useVendorNav();
  const now = useNow();
  const { store, state, newOrders, cookingOrders, readyOrders, unread, actions } = useVendor();
  const first = newOrders[0];

  const status = !state.open
    ? 'Closed · not accepting orders'
    : state.busyMode
      ? 'Open · busy mode +10 min'
      : `Open · ${store.hours}`;

  const goOrders = (tab: 'new' | 'cooking' | 'ready') => nav.navigate('VendorTabs', { screen: 'Orders', params: { tab } });

  return (
    <Screen tab>
      <HomeHeader
        initials={store.initials}
        name={store.name}
        status={status}
        statusDot
        statusColor={state.open ? palette.sageDeep : palette.clayMid}
        onBell={() => nav.navigate('Notifications')}
        unread={unread > 0}
      />

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
        <StatTile value={String(newOrders.length)} label="New" highlight onPress={() => goOrders('new')} />
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

    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  gap: { marginTop: 4 },
  gapLg: { marginTop: space.md },
});
