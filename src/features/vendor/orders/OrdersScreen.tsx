import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { ClipboardCheck, CookingPot, PackageCheck, ReceiptText } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { EmptyState, NoteBox, Screen, TabPills, Text, TitleHeader, useToast } from '@/components';
import { USE_MOCK_DATA } from '@config/constants';
import { useVendor } from '@/data/vendorStore';
import { workLabel } from '@/domain/labels';
import { useNow } from '@/hooks/useNow';
import { useVendorNav, VendorTabParams } from '@/navigation/types';
import { prepSecondsLeft } from '@/utils/orders';

import { CookingCard, NewOrderCard, OrderRow } from './OrderCards';

type TabKey = 'new' | 'cooking' | 'ready' | 'past';

/** Board 4a·2 (orders by status) with 3a·3 (the cooking queue) as the middle tab. */
export function OrdersScreen() {
  const nav = useVendorNav();
  const route = useRoute<RouteProp<VendorTabParams, 'Orders'>>();
  const now = useNow();
  const toast = useToast();
  const { store, newOrders, cookingOrders, readyOrders, pastOrders, actions } = useVendor();
  const [tab, setTab] = useState<TabKey>(route.params?.tab ?? 'new');
  const work = workLabel(store.category);

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  // Oldest ticket first, so the queue reads in the order it was accepted.
  const cooking = [...cookingOrders].sort((a, b) => prepSecondsLeft(a, now) - prepSecondsLeft(b, now));

  const tabs = [
    { key: 'new' as const, label: `New · ${newOrders.length}` },
    { key: 'cooking' as const, label: `${work} · ${cookingOrders.length}` },
    { key: 'ready' as const, label: `Ready · ${readyOrders.length}` },
    { key: 'past' as const, label: 'Past' },
  ];

  const open = (id: string) => nav.navigate('OrderDetail', { id });

  return (
    <Screen tab>
      <TitleHeader
        title="Orders"
        right={
          tab === 'cooking' && cooking.length ? (
            <Text v="body" muted>{`${cooking.length} tickets`}</Text>
          ) : undefined
        }
      />
      <TabPills tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'new' &&
        (newOrders.length ? (
          newOrders.map((o, i) => (
            <NewOrderCard
              key={o.id}
              order={o}
              now={now}
              highlight={i === 0}
              showCountdown={i === 0 ? 'accept' : undefined}
              quickAcceptMinutes={i === 0 ? 15 : 25}
              onOpen={() => nav.navigate('AcceptOrder', { id: o.id })}
              onReject={() => nav.navigate('RejectOrder', { id: o.id })}
              onAccept={() => {
                const minutes = i === 0 ? 15 : 25;
                actions.accept(o.id, minutes);
                toast(`#${o.id} accepted · ${minutes} min`);
              }}
            />
          ))
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="No new orders"
            body="New orders show up here with a 3-minute accept window."
            action={USE_MOCK_DATA ? 'Simulate a new order' : undefined}
            onAction={USE_MOCK_DATA ? actions.simulateOrder : undefined}
          />
        ))}

      {tab === 'cooking' &&
        (cooking.length ? (
          <>
            {cooking.map(o => (
              <CookingCard
                key={o.id}
                order={o}
                onOpen={() => open(o.id)}
                onReady={() => {
                  actions.markReady(o.id);
                  toast(`#${o.id} ready · partner notified`);
                }}
              />
            ))}
            <NoteBox style={styles.note}>
              Marking ready notifies the assigned partner immediately.
            </NoteBox>
          </>
        ) : (
          <EmptyState icon={CookingPot} title={`Nothing ${work.toLowerCase()}`} body="Accepted orders appear here until you mark them ready." />
        ))}

      {tab === 'ready' &&
        (readyOrders.length ? (
          readyOrders.map(o => <OrderRow key={o.id} order={o} workLabel={work} onPress={() => nav.navigate('Handover', { id: o.id })} />)
        ) : (
          <EmptyState icon={PackageCheck} title="No orders waiting" body="Orders marked ready wait here until the partner collects them." />
        ))}

      {tab === 'past' &&
        (pastOrders.length ? (
          pastOrders.map(o => <OrderRow key={o.id} order={o} workLabel={work} onPress={() => open(o.id)} />)
        ) : (
          <EmptyState icon={ClipboardCheck} title="No past orders" body="Completed, cancelled and rejected orders are listed here." />
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 4 },
});
