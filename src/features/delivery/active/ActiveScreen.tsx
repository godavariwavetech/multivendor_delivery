import { Check, Navigation, Phone, Scooter } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  ChoiceRow,
  EmptyState,
  KeyValue,
  LinkButton,
  OsmMap,
  Pill,
  Screen,
  SectionLabel,
  SlideToConfirm,
  StageTracker,
  StatTile,
  Text,
  TileRow,
  TitleHeader,
  useToast,
} from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import type { ActiveTrip, DeliveryRequest } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { palette, radius, shadow, space, useTheme } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock } from '@/utils/datetime';
import { pickPhoto } from '@/utils/photo';
import { arriveBy, etaAt, keepHotMinutesLeft, paymentLine, readyAt } from '@/utils/trips';

import { PICKUP_COPY, PickupHandling, categoryPill, requiredChecks } from './handling';

/**
 * The Active tab follows the trip through its stages (board 3b):
 * to the store → pickup (2b, per category) → code → on the way → OTP → complete.
 */
export function ActiveScreen() {
  const { state, activeRequest } = useDelivery();
  const trip = state.active;

  if (!trip || !activeRequest) {
    return <NoTrip />;
  }
  switch (trip.stage) {
    case 'to_store':
      return <ToStoreView trip={trip} request={activeRequest} />;
    case 'at_store':
      return <PickupView trip={trip} request={activeRequest} />;
    case 'on_the_way':
    case 'arrived':
      return <OnTheWayView trip={trip} request={activeRequest} />;
    case 'complete':
      return <TripCompleteView trip={trip} request={activeRequest} />;
  }
}

function NoTrip() {
  const nav = useDeliveryNav();
  const { state, openRequests, actions } = useDelivery();
  return (
    <Screen tab>
      <TitleHeader title="Active" />
      {state.online ? (
        <EmptyState
          icon={Scooter}
          title="No active delivery"
          body={openRequests.length ? `${openRequests.length} requests are waiting near you.` : 'Accept a request to start a trip.'}
          action="See requests"
          onAction={() => nav.navigate('DeliveryTabs', { screen: 'Requests' })}
        />
      ) : (
        <EmptyState
          icon={Scooter}
          title="You're offline"
          body="Go online to receive delivery requests."
          action="Go online"
          onAction={() => actions.setOnline(true)}
        />
      )}
    </Screen>
  );
}

function ContactButtons({ callLabel, who }: { callLabel: string; who: string }) {
  const toast = useToast();
  return (
    <View style={styles.pair}>
      <Button label={callLabel} icon={Phone} variant="outline" flex={1} onPress={() => toast(`Calling ${who} via masked number…`)} />
      <Button label="Navigate" icon={Navigation} variant="outline" flex={1} onPress={() => toast('Opening turn-by-turn navigation')} />
    </View>
  );
}

/** Board 3b·2 — arrival target matched against the kitchen's ready time. */
function ToStoreView({ trip, request: r }: { trip: ActiveTrip; request: DeliveryRequest }) {
  const nav = useDeliveryNav();
  const { actions } = useDelivery();
  const food = r.category === 'food';
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.flex}>
        <OsmMap
          height={250}
          style={styles.map}
          points={[
            { ...r.store, kind: 'from', label: r.store.name },
            { ...r.drop, kind: 'to', label: r.drop.name },
          ]}
        />
        <View style={styles.body}>
          <Text v="label" muted>
            Step 1 of 2 · go to store
          </Text>
          <Text v="title" style={styles.storeName}>
            {r.store.name}
          </Text>
          <Text v="body" muted>
            {r.store.address}
          </Text>
          <View style={styles.tiles}>
            <TileRow>
              <StatTile small label="Distance" value={`${r.store.distanceKm} km`} />
              <StatTile small label="Arrive by" value={clock(arriveBy(trip, r)).replace(/ [AP]M$/, '')} />
              <StatTile
                small
                label={food ? 'Food ready' : 'Order ready'}
                value={r.readyInMin > 0 ? clock(readyAt(trip, r)).replace(/ [AP]M$/, '') : 'Now'}
                highlight
              />
            </TileRow>
          </View>
          <Card>
            <Text v="bodyStrong">{r.store.note}</Text>
            <Text v="body" muted>
              Vendor note for partners
            </Text>
          </Card>
          <ContactButtons callLabel="Call store" who={r.store.name} />
        </View>
      </View>
      <View style={styles.footer}>
        <SlideToConfirm label="Slide when you reach the store" onConfirm={actions.reachStore} />
        <LinkButton center label="Can't reach the store · report" color={palette.blue} onPress={() => nav.navigate('ReportProblem', { context: `#${r.id} · ${r.store.name}` })} />
      </View>
    </SafeAreaView>
  );
}

/** Board 2b — pickup handling that changes with the store's category. */
function PickupView({ trip, request: r }: { trip: ActiveTrip; request: DeliveryRequest }) {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow();
  const { actions } = useDelivery();
  const copy = PICKUP_COPY[r.category](r);

  const slide = () => {
    const missing = requiredChecks(r).filter(i => !trip.checks[i.key]);
    if (missing.length) {
      Alert.alert('Finish the checklist', `Tick ${missing.map(m => `"${m.label}"`).join(', ')} before you leave the store.`);
      return;
    }
    if (r.pickup.kind === 'bakery' && !trip.proofPhoto) {
      Alert.alert('Photo required', 'Take a photo of the box before leaving with a fragile order.');
      return;
    }
    nav.navigate('PickupCode');
  };

  return (
    <Screen
      tab
      footer={
        <View style={styles.footerCol}>
          <SlideToConfirm label={copy.slide} onConfirm={slide} />
          <LinkButton center label={copy.report} color={palette.blue} onPress={() => nav.navigate('ReportProblem', { context: `#${r.id} · ${r.store.name}` })} />
        </View>
      }>
      <View style={styles.pickupHead}>
        <View style={styles.flex}>
          <Text v="headline">{`Pickup · #${r.id}`}</Text>
          <Text v="body" muted>{`${r.store.name} · ${r.store.distanceKm} km`}</Text>
        </View>
        {categoryPill(r)}
      </View>
      <PickupHandling
        request={r}
        trip={trip}
        now={now}
        onToggle={actions.toggleCheck}
        onPhoto={async () => {
          const picked = await pickPhoto('Photo of the parcel');
          if (!picked) {
            return;
          }
          const result = await actions.proofPhoto(picked);
          toast(result.ok ? 'Photo of the box saved' : result.error);
        }}
      />
    </Screen>
  );
}

/** Board 4b·3 / 3b·4 / 1c·3 — drop stage with contact, payment and slide to arrive. */
function OnTheWayView({ trip, request: r }: { trip: ActiveTrip; request: DeliveryRequest }) {
  const nav = useDeliveryNav();
  const now = useNow(10_000);
  const insets = useSafeAreaInsets();
  const { actions } = useDelivery();
  const hot = keepHotMinutesLeft(trip, r, now);
  const pay = paymentLine(r);
  const arrived = trip.stage === 'arrived';

  return (
    <View style={styles.root}>
      <View style={styles.flex}>
        <OsmMap
          height={250 + insets.top}
          style={styles.map}
          points={[
            { ...r.store, kind: 'from', label: r.store.name },
            { ...r.drop, kind: 'to', label: r.drop.name },
          ]}>
          <View style={[styles.mapHeader, { top: insets.top + space.sm }]}>
            <Text v="bodyStrong" style={styles.flex} numberOfLines={1}>
              {hot !== null ? `Keep it hot · ${hot} min left` : `#${r.id} · on the way`}
            </Text>
            <Text v="body" muted>
              {hot !== null ? `${r.drop.distanceKm} km` : `${r.drop.distanceKm} km · ETA ${clock(etaAt(trip, r, now)).replace(/ [AP]M$/, '')}`}
            </Text>
          </View>
        </OsmMap>
        <View style={styles.body}>
          <StageTracker steps={['Picked up', 'On the way', 'Arrived', 'Delivered']} current={arrived ? 2 : 1} />
          <Card>
            <SectionLabel>Deliver to</SectionLabel>
            <Text v="headline" style={styles.dropName}>
              {r.drop.name}
            </Text>
            <Text v="body" muted>
              {r.drop.address}
            </Text>
            <View style={styles.gapLg}>
              <ContactButtons callLabel="Call" who={r.drop.name} />
            </View>
          </Card>
          <Card>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text v="bodyStrong">{pay.title}</Text>
                <Text v="body" muted>
                  {pay.subtitle}
                </Text>
              </View>
              <Pill label={pay.pill} tone={pay.paid ? 'leaf' : 'sky'} />
            </View>
          </Card>
        </View>
      </View>
      <View style={styles.footer}>
        {arrived ? (
          <Button label="Enter customer OTP" size="lg" onPress={() => nav.navigate('DeliveryOtp')} />
        ) : (
          <SlideToConfirm
            label="Slide to mark arrived"
            onConfirm={() => {
              actions.arrived();
              nav.navigate('DeliveryOtp');
            }}
          />
        )}
        <LinkButton center label="Report a problem" color={palette.blue} onPress={() => nav.navigate('ReportProblem', { context: `#${r.id} · ${r.drop.name}` })} />
      </View>
    </View>
  );
}

/** Board 3b·5 — payout broken into base, distance and tip; handover feedback. */
function TripCompleteView({ trip, request: r }: { trip: ActiveTrip; request: DeliveryRequest }) {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { r: theme } = useTheme();
  const { actions } = useDelivery();
  const delivered = trip.deliveredAt ?? Date.now();
  const minutes = Math.max(8, Math.round((delivered - (trip.pickedUpAt ?? trip.acceptedAt)) / 60_000));
  const early = Math.max(0, r.etaMin - minutes);

  return (
    <Screen
      tab
      footer={
        <View style={styles.footerCol}>
          <Button
            label="Next request"
            size="lg"
            onPress={() => {
              actions.finish();
              nav.navigate('DeliveryTabs', { screen: 'Requests' });
            }}
          />
          <LinkButton
            center
            label="Take a break · go offline"
            color={palette.blue}
            onPress={() => {
              actions.finish();
              actions.setOnline(false);
              toast("You're offline · enjoy the break");
              nav.navigate('DeliveryTabs', { screen: 'Home' });
            }}
          />
        </View>
      }>
      <View style={[styles.check, { backgroundColor: theme.accent }]}>
        <Check size={44} color={theme.onAccent} strokeWidth={3} />
      </View>
      <Text v="hero">Delivered</Text>
      <Text v="body" muted style={styles.sub}>
        {`#${r.id} · ${clock(delivered)}${early ? ` · ${early} min early` : ''}`}
      </Text>

      <Card tone="green" style={styles.hero}>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          Earned on this trip
        </Text>
        <Text v="hero" color={palette.canvas} style={styles.heroAmount}>
          {formatAmount(r.payout)}
        </Text>
        <View style={styles.breakdown}>
          <Text v="body" color={palette.canvas}>{`Base ${formatAmount(r.breakdown.base)}`}</Text>
          <Text v="body" color={palette.canvas}>{`Distance ${formatAmount(r.breakdown.distance)}`}</Text>
          <Text v="body" color={palette.canvas}>{`Tip ${formatAmount(r.breakdown.tip)}`}</Text>
        </View>
      </Card>

      <Card>
        <KeyValue label="Trip time" value={`${minutes} min`} strong />
        <KeyValue label="Distance" value={`${r.totalKm} km`} strong />
        <KeyValue label="Verified by" value={`Customer OTP ${r.customerOtp}`} strong />
        {trip.proofPhoto ? <KeyValue label="Proof photo" value="Attached" strong /> : null}
      </Card>

      <Card>
        <Text v="cardTitle" style={styles.question}>
          How was the store handover?
        </Text>
        <ChoiceRow
          options={[
            { key: 'slow' as const, label: 'Slow' },
            { key: 'fine' as const, label: 'Fine' },
            { key: 'quick' as const, label: 'Quick' },
          ]}
          value={trip.handoverRating}
          onChange={rating => {
            actions.rateHandover(rating);
            toast('Thanks · shared with the store team');
          }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 0 },
  root: { flex: 1, backgroundColor: palette.canvas },
  flex: { flex: 1 },
  body: { paddingHorizontal: space.gutter, paddingTop: space.lg, gap: 10 },
  storeName: { marginTop: 2 },
  tiles: { marginTop: space.sm },
  pair: { flexDirection: 'row', gap: 10 },
  footer: { paddingHorizontal: space.gutter, paddingBottom: space.md, paddingTop: space.sm, gap: space.md },
  footerCol: { flex: 1, gap: space.md },
  pickupHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  mapHeader: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.paper,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    height: 52,
    ...shadow.floating,
  },
  dropName: { marginTop: 2, marginBottom: 2 },
  gapLg: { marginTop: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xl,
    marginBottom: space.lg,
  },
  sub: { marginBottom: space.md, fontSize: 15 },
  hero: { padding: space.xl, borderRadius: 26 },
  heroAmount: { fontSize: 38, lineHeight: 46, marginVertical: space.xs },
  breakdown: { flexDirection: 'row', gap: space.xl, marginTop: space.sm },
  question: { marginBottom: space.md },
});
