import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// ON HOLD: ProgressBar, StatTile, TileRow — today's stats and the peak-bonus card are hidden from Home.
import { Button, Card, HomeHeader, Screen, TabPills, Text, Toggle, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { clock } from '@/utils/datetime';
import { tripStatusPill } from '@/utils/trips';

import { RequestRow } from '../requests/RequestsScreen';

/** Board 4b·1 / 1c·1 — online switch, then only the ongoing trip and the pending requests. */
export function PartnerHomeScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow(15_000);
  const { state, profile, activeRequest, openRequests, unread, refresh, actions } = useDelivery();
  const trip = state.active;
  const ongoing = Boolean(trip && activeRequest && trip.stage !== 'complete');
  const [tab, setTab] = useState<'pending' | 'ongoing'>('pending');
  const tabs = [
    { key: 'pending' as const, label: `Pending · ${openRequests.length}`, tone: 'sky' as const },
    { key: 'ongoing' as const, label: `Ongoing · ${ongoing ? 1 : 0}`, tone: 'mint' as const },
  ];

  return (
    <Screen tab onRefresh={refresh}>
      <HomeHeader
        initials={profile.initials}
        name={profile.name}
        status={`${profile.zone.toLowerCase()} · ★ ${profile.rating}`}
        onBell={() => nav.navigate('Notifications')}
        unread={unread > 0}
      />

      <Card tone={state.online ? 'green' : 'paper'} style={styles.hero}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="display" color={state.online ? palette.canvas : palette.ink} style={styles.heroTitle}>
              {state.online ? "You're online" : "You're offline"}
            </Text>
            <Text v="body" color={state.online ? 'rgba(255, 255, 255, 0.88)' : palette.inkMuted}>
              {state.online ? `Food deliveries · since ${clock(state.onlineSince)}` : 'Go online to receive delivery requests'}
            </Text>
          </View>
          <Toggle
            value={state.online}
            onDark={state.online}
            onChange={on => {
              if (!on && trip && trip.stage !== 'complete') {
                toast('Finish your active delivery before going offline');
                return;
              }
              actions.setOnline(on);
              toast(on ? "You're online · receiving requests" : "You're offline");
            }}
          />
        </View>
      </Card>

      {/* ON HOLD: today's three-up.
      <TileRow>
        <StatTile tone="sky" value={String(today.deliveries)} label="Deliveries" />
        <StatTile tone="lavender" value={String(today.km)} unit="km" label="Distance" />
        <StatTile tone="mint" value={formatAmount(today.earned)} label="Today" onPress={() => nav.navigate('DeliveryTabs', { screen: 'Earnings' })} />
      </TileRow> */}

      <TabPills tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'ongoing' ? (
        ongoing && trip && activeRequest ? (
        <RequestRow request={activeRequest} status={tripStatusPill(trip, activeRequest, now)} statusColor={palette.greenDeep} tone="highlight">
          <Button label="Continue delivery" style={styles.gapLg} onPress={() => nav.navigate('DeliveryTabs', { screen: 'Active' })} />
        </RequestRow>
      ) : (
        <Card>
          <Text v="body" muted>
            No ongoing order
          </Text>
        </Card>
        )
      ) : null}

      {tab === 'pending' ? (
        state.online ? (
        <>
          {openRequests.length ? (
            openRequests.map(r => (
              <RequestRow key={r.id} request={r} status="Pending" onPress={() => nav.navigate('IncomingRequest', { id: r.id })} />
            ))
          ) : (
            <Card>
              <Text v="body" muted>
                No pending orders right now. Stay online — new requests appear here.
              </Text>
            </Card>
          )}
        </>
        ) : (
          <Card>
            <Text v="body" muted>
              You're offline. Go online to receive delivery requests.
            </Text>
          </Card>
        )
      ) : null}

      {/* ON HOLD: Dinner peak bonus card.
      <Card>
        <View style={styles.head}>
          <Text v="cardTitle">Dinner peak bonus</Text>
          <Text v="bodyStrong" color={palette.greenDeep}>{`${today.peakDone} of ${today.peakTarget} trips`}</Text>
        </View>
        <ProgressBar progress={today.peakDone / today.peakTarget} style={styles.progress} />
        <Text v="body" muted>
          {today.peakDone >= today.peakTarget
            ? `Bonus unlocked · +${formatAmount(today.peakReward)} added to this week`
            : `Finish ${today.peakTarget} trips before 10 PM for +${formatAmount(today.peakReward)}`}
        </Text>
      </Card> */}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.xl, borderRadius: 26 },
  heroTitle: { fontSize: 24, lineHeight: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  gap: { marginTop: space.sm },
  gapLg: { marginTop: space.lg },
  progress: { marginVertical: space.md },
});
