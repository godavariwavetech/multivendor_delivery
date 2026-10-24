import { Check, Inbox, WifiOff, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, Button, Card, EmptyState, LinkButton, NoteBox, OrderSummary, Screen, TabPills, Text, TitleHeader, useToast } from '@/components';
import type { CardTone } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import type { DeliveryRequest } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { TripRow } from '../earnings/EarningsScreens';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { requestItemNames, tripStatusPill } from '@/utils/trips';

// ON HOLD: requests have no response time limit — the first partner to accept gets the order.
// export const RESPOND_SECONDS = 20;

/** A request as the shared order row: photo, number, time, status, total, area and address; actions go in `children`. */
export function RequestRow({
  request: r,
  status,
  statusColor,
  tone,
  onPress,
  children,
}: {
  request: DeliveryRequest;
  status: string;
  statusColor?: string;
  tone?: CardTone;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const note = [requestItemNames(r), r.payment === 'cod' ? `COD ${formatAmount(r.codAmount ?? r.orderTotal)}` : 'Prepaid', r.waitingMin ? `Waiting ${r.waitingMin} min` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <OrderSummary
      number={r.id}
      at={r.placedAt}
      status={status}
      statusColor={statusColor}
      total={r.orderTotal}
      note={note}
      area={r.drop.area}
      address={r.drop.address}
      photo={r.photo}
      tone={tone}
      onPress={onPress}>
      {children}
    </OrderSummary>
  );
}

/** Board 4b·2 — open requests go to every online partner; the first to accept gets the order. */
export function RequestsScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow();
  const { state, openRequests, activeRequest, refresh, actions } = useDelivery();

  const [tab, setTab] = useState<'pending' | 'ongoing' | 'completed'>('pending');
  const completed = state.trips.filter(t => t.status === 'delivered');
  const first = openRequests[0];
  const busy = Boolean(state.active && state.active.stage !== 'complete');
  const trip = state.active;
  const tabs = [
    { key: 'pending' as const, label: `Pending · ${openRequests.length}`, tone: 'sky' as const },
    { key: 'ongoing' as const, label: `Ongoing · ${busy ? 1 : 0}`, tone: 'mint' as const },
    { key: 'completed' as const, label: `Completed · ${completed.length}`, tone: 'lavender' as const },
  ];

  // ON HOLD: the 20-second window and the auto-skip when it ran out.
  // const [offer, setOffer] = useState<{ id: string; at: number } | null>(null);
  // useEffect(() => {
  //   if (first && offer?.id !== first.id) {
  //     setOffer({ id: first.id, at: Date.now() });
  //   }
  // }, [first, offer?.id]);
  // const left = offer ? RESPOND_SECONDS - Math.floor((now - offer.at) / 1000) : RESPOND_SECONDS;
  // useEffect(() => {
  //   if (state.online && !busy && first && offer?.id === first.id && left <= 0) {
  //     actions.skip(first.id);
  //     toast('Request expired · reassigned to another partner');
  //   }
  // }, [actions, busy, first, left, offer?.id, state.online, toast]);

  const accept = (r: DeliveryRequest) => {
    if (busy) {
      toast(`Finish #${activeRequest?.id} first`);
      return;
    }
    actions.accept(r.id);
    toast(`#${r.id} accepted · head to ${r.store.name}`);
    nav.navigate('DeliveryTabs', { screen: 'Active' });
  };

  const others = state.requests.filter(r => r.id !== first?.id && (r.status === 'open' || r.status === 'taken'));

  return (
    <Screen tab onRefresh={refresh}>
      <TitleHeader
        title="Requests"
        right={
          <Text v="body" muted>
            {`Zone 4 · ${state.online ? 'online' : 'offline'}`}
          </Text>
        }
      />

      {!state.online ? (
        <EmptyState
          icon={WifiOff}
          title="You're offline"
          body="Go online to see delivery requests near you."
          action="Go online"
          onAction={() => actions.setOnline(true)}
        />
      ) : (
        <>
          <TabPills tabs={tabs} value={tab} onChange={setTab} />

          {tab === 'ongoing' ? (
            busy && trip && activeRequest ? (
              <RequestRow request={activeRequest} status={tripStatusPill(trip, activeRequest, now)} statusColor={palette.greenDeep} tone="highlight">
                <Button label="Continue delivery" style={styles.gap} onPress={() => nav.navigate('DeliveryTabs', { screen: 'Active' })} />
              </RequestRow>
            ) : (
              <EmptyState icon={Inbox} title="No ongoing orders" body="An order you accept shows up here until it is delivered." />
            )
          ) : null}

          {tab === 'completed' ? (
            completed.length ? (
              completed.map(t => <TripRow key={`${t.id}-${t.at}`} trip={t} onPress={() => nav.navigate('TripDetail', { id: t.id })} />)
            ) : (
              <EmptyState icon={Inbox} title="No completed orders yet" body="Orders you deliver today show up here with their details." />
            )
          ) : null}

          {tab === 'pending' && busy && activeRequest ? (
            <Banner
              tone="leaf"
              title={`Finish #${activeRequest.id} first`}
              body="You can look, but new requests can be accepted after your active delivery."
              right={<LinkButton label="Continue" color={palette.greenDeep} onPress={() => nav.navigate('DeliveryTabs', { screen: 'Active' })} />}
            />
          ) : null}

          {tab === 'pending' && first ? (
            <RequestRow request={first} status="Pending" tone="highlight" onPress={() => nav.navigate('IncomingRequest', { id: first.id })}>
              <View style={styles.actions}>
                <Button
                  label="Skip"
                  icon={X}
                  variant="outline"
                  flex={1}
                  onPress={() => {
                    actions.skip(first.id);
                    toast('Skipped · offered to another partner');
                  }}
                />
                <Button icon={Check} label="Accept" flex={1.8} disabled={busy} onPress={() => accept(first)} />
              </View>
            </RequestRow>
          ) : null}

          {(tab === 'pending' ? others : []).map(r =>
            r.status === 'taken' ? (
              <Card key={r.id} style={styles.faded}>
                <View style={styles.head}>
                  <Text v="cardTitle" color={palette.inkMuted}>
                    {r.store.name}
                  </Text>
                  <Text v="cardTitle" color={palette.inkMuted}>
                    {formatAmount(r.payout)}
                  </Text>
                </View>
                <Text v="body" subtle style={styles.gap}>
                  Taken by another partner
                </Text>
              </Card>
            ) : (
              <RequestRow key={r.id} request={r} status="Pending" onPress={() => nav.navigate('IncomingRequest', { id: r.id })} />
            ),
          )}

          {tab === 'pending' && !first && !others.length ? (
            <EmptyState
              icon={Inbox}
              title="No requests right now"
              body="Stay online. Requests near you appear here the moment a store marks an order ready."
              action="Load more requests (demo)"
              onAction={actions.refreshRequests}
            />
          ) : null}

          <NoteBox>Requests have no time limit. The first partner to accept gets the order. Skipping does not affect your rating.</NoteBox>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  gap: { marginTop: space.md },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.lg },
  faded: { opacity: 0.7 },
});
