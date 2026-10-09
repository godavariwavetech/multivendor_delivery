import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, HomeHeader, Pill, ProgressBar, Screen, StatTile, Text, TileRow, Toggle, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock } from '@/utils/datetime';
import { etaAt, tripStatusPill } from '@/utils/trips';

/** Board 4b·1 / 1c·1 — online switch, today's three-up, active trip, nearby requests. */
export function PartnerHomeScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow(15_000);
  const { state, profile, activeRequest, openRequests, today, unread, refresh, actions } = useDelivery();
  const trip = state.active;
  const foodOnly = openRequests.every(r => r.category === 'food');

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

      <TileRow>
        <StatTile tone="sky" value={String(today.deliveries)} label="Deliveries" />
        <StatTile tone="lavender" value={String(today.km)} unit="km" label="Distance" />
        <StatTile tone="mint" value={formatAmount(today.earned)} label="Today" onPress={() => nav.navigate('DeliveryTabs', { screen: 'Earnings' })} />
      </TileRow>

      {trip && activeRequest && trip.stage !== 'complete' ? (
        <Card tone="highlight">
          <View style={styles.head}>
            <Text v="cardTitle">{`#${activeRequest.id} · active`}</Text>
            <Pill label={tripStatusPill(trip, activeRequest, now)} tone="leaf" />
          </View>
          <Text v="body" muted style={styles.gap}>
            {`${activeRequest.store.name} → ${activeRequest.drop.area}`}
          </Text>
          <Text v="body" muted>
            {`${activeRequest.drop.distanceKm} km · ETA ${clock(etaAt(trip, activeRequest, now))}`}
          </Text>
          <Button label="Continue delivery" style={styles.gapLg} onPress={() => nav.navigate('DeliveryTabs', { screen: 'Active' })} />
        </Card>
      ) : null}

      {state.online ? (
        <Card onPress={() => nav.navigate('DeliveryTabs', { screen: 'Requests' })}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text v="cardTitle">
                {openRequests.length
                  ? `${openRequests.length} ${foodOnly ? 'food ' : ''}requests nearby`
                  : 'No requests nearby right now'}
              </Text>
              <Text v="body" muted>
                {openRequests.length
                  ? `Within 2 km · ${[...new Set(openRequests.map(r => CATEGORY_LABEL[r.category]))].join(', ')}`
                  : 'Stay online — new requests arrive every few minutes'}
              </Text>
            </View>
            <ChevronRight size={22} color={palette.inkSubtle} strokeWidth={2.2} />
          </View>
        </Card>
      ) : null}

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
      </Card>
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
