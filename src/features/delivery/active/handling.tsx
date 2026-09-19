import { Camera, Check } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  ChecklistRow,
  Divider,
  IconCircle,
  KeyValue,
  Pill,
  SectionLabel,
  StatTile,
  Text,
  TileRow,
  useToast,
} from '@/components';
import type {
  ActiveTrip,
  BakeryPickup,
  ChecklistItem,
  DeliveryRequest,
  FoodPickup,
  GroceryPickup,
  MeatPickup,
  ProducePickup,
} from '@/domain/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { formatCountdown } from '@/utils/datetime';
import { readyAt } from '@/utils/trips';

type HandlingProps<P> = {
  request: DeliveryRequest;
  pickup: P;
  trip: ActiveTrip;
  now: number;
  onToggle: (key: string) => void;
  onPhoto: () => void;
};

function Checklist({
  title,
  items,
  trip,
  onToggle,
}: {
  title: string;
  items: ChecklistItem[];
  trip: ActiveTrip;
  onToggle: (key: string) => void;
}) {
  return (
    <Card>
      <SectionLabel>{title}</SectionLabel>
      {items.map((item, i) => (
        <View key={item.key}>
          {i > 0 ? <Divider /> : null}
          <ChecklistRow label={item.label} hint={item.hint} checked={Boolean(trip.checks[item.key])} onToggle={() => onToggle(item.key)} />
        </View>
      ))}
    </Card>
  );
}

const paymentValue = (r: DeliveryRequest) =>
  r.payment === 'cod' ? `Collect ${formatAmount(r.codAmount ?? 0)} cash` : `Prepaid ${formatAmount(r.orderTotal)}`;

// ─── Food: prep countdown, parcel count, hot-bag checklist, tight window ─────

function FoodHandling({ request: r, pickup, trip, now, onToggle }: HandlingProps<FoodPickup>) {
  const left = Math.round((readyAt(trip, r) - now) / 1000);
  return (
    <>
      <Card tone="green">
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle" color={palette.canvas}>
              {left > 0 ? `Food ready in ${Math.ceil(left / 60)} min` : 'Food is ready'}
            </Text>
            <Text v="body" color="rgba(255, 255, 255, 0.86)">
              {left > 0 ? 'Wait at counter · vendor is packing' : 'Collect it from the counter'}
            </Text>
          </View>
          <Text v="display" color={palette.canvas}>
            {left > 0 ? formatCountdown(left) : 'Ready'}
          </Text>
        </View>
      </Card>
      <Checklist title="Confirm before you leave" items={pickup.checklist} trip={trip} onToggle={onToggle} />
      <Card>
        <KeyValue label="Items" value={`${r.items} · ${r.parcels} parcels`} strong />
        <KeyValue label="Payment" value={paymentValue(r)} strong />
        <KeyValue label="Deliver within" value={`${pickup.deliverWithinMin} min · keep hot`} strong />
      </Card>
      <Banner tone="sky" title={pickup.warning.title} body={pickup.warning.body} />
    </>
  );
}

// ─── Grocery: bag-by-bag tally, load weight, short-supply refund note ────────

function GroceryHandling({ request: r, pickup, trip, onToggle }: HandlingProps<GroceryPickup>) {
  return (
    <>
      <TileRow>
        <StatTile small label="Bags" value={String(pickup.bags.length)} />
        <StatTile small label="Weight" value={String(pickup.weightKg)} unit="kg" />
        <StatTile small label="Payout" value={formatAmount(r.payout)} highlight />
      </TileRow>
      <Checklist title="Bag tally" items={pickup.bags} trip={trip} onToggle={onToggle} />
      {pickup.shortSupply ? (
        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text v="cardTitle">{pickup.shortSupply.title}</Text>
              <Text v="body" muted>
                {pickup.shortSupply.body}
              </Text>
            </View>
            <Text
              v="bodyStrong"
              color={palette.blueDeep}
              style={styles.viewPill}
              onPress={() => {
                const short = pickup.shortSupply;
                if (short) {
                  Alert.alert(short.title, short.body);
                }
              }}>
              View
            </Text>
          </View>
        </Card>
      ) : null}
      <Banner tone="sky" title={pickup.warning.title} body={pickup.warning.body} />
    </>
  );
}

// ─── Fruits & Veg: ordered vs weighed, billing on weight, substitution ───────

function ProduceHandling({ request: r, pickup, trip, onToggle }: HandlingProps<ProducePickup>) {
  const toast = useToast();
  const decided = trip.checks.substitution;
  return (
    <>
      <Card>
        <SectionLabel>Weighed at store</SectionLabel>
        {pickup.weighed.map((w, i) => (
          <View key={w.name}>
            {i > 0 ? <Divider style={styles.dividerSm} /> : null}
            <View style={styles.weighRow}>
              <Text v="cardTitle" style={styles.flex}>
                {w.name}
              </Text>
              <Text v="body" muted>
                {w.ordered}
              </Text>
              <Text v="cardTitle" style={styles.weight}>
                {w.actual}
              </Text>
            </View>
          </View>
        ))}
        <Divider style={styles.dividerSm} />
        <KeyValue label="Billed on actual weight" value={formatAmount(pickup.billed)} strong />
      </Card>

      {!pickup.substitution ? null : decided ? (
        <Banner tone="leaf" title="Substitution sent to customer" body="You'll be notified if they decline. Carry on with the pickup." />
      ) : (
        <Card tone="sky">
          <Text v="cardTitle" color={palette.blueDeep}>
            {pickup.substitution.title}
          </Text>
          <Text v="body" color={palette.blueDeep} style={styles.gap}>
            {pickup.substitution.body}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Skip item"
              variant="outline"
              size="sm"
              flex={1}
              onPress={() => {
                onToggle('substitution');
                toast('Capsicum removed · customer refunded');
              }}
            />
            <Button
              label="Ask customer"
              variant="blue"
              size="sm"
              flex={1.3}
              onPress={() => {
                onToggle('substitution');
                toast(`Approval request sent to ${r.drop.name}`);
              }}
            />
          </View>
        </Card>
      )}

      <Card>
        {pickup.checklist.map((item, i) => (
          <View key={item.key}>
            {i > 0 ? <Divider /> : null}
            <ChecklistRow label={item.label} checked={Boolean(trip.checks[item.key])} onToggle={() => onToggle(item.key)} />
          </View>
        ))}
      </Card>
    </>
  );
}

// ─── Bakery: fragile banner, flat crate, cake message, photo proof ───────────

function BakeryHandling({ request: r, pickup, trip, onToggle, onPhoto }: HandlingProps<BakeryPickup>) {
  return (
    <>
      <Banner tone="blue" title={pickup.banner.title} body={pickup.banner.body} />
      <Checklist title="Handling checklist" items={pickup.checklist} trip={trip} onToggle={onToggle} />
      <Card>
        <KeyValue label="Message on cake" value={pickup.message} strong />
        <KeyValue label="Slot" value={pickup.slot} strong />
        <KeyValue label="Payment" value={paymentValue(r)} strong />
      </Card>
      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">Photo of the box</Text>
            <Text v="body" muted>
              {trip.proofPhoto ? 'Photo saved · attached to the order' : 'Required for fragile items at pickup'}
            </Text>
          </View>
          {trip.proofPhoto ? (
            <IconCircle icon={Check} bg={palette.green} color={palette.white} />
          ) : (
            <IconCircle icon={Camera} bg={palette.leaf} color={palette.greenDeep} onPress={onPhoto} />
          )}
        </View>
      </Card>
    </>
  );
}

// ─── Meat & Seafood: cold chain, ice pack and leak checks, weighed, COD ──────

function MeatHandling({ request: r, pickup, trip, onToggle }: HandlingProps<MeatPickup>) {
  return (
    <>
      <Banner tone="green" title={pickup.banner.title} body={pickup.banner.body} />
      <Checklist title="Confirm at counter" items={pickup.checklist} trip={trip} onToggle={onToggle} />
      <Card>
        {pickup.lines.map((l, i) => (
          <View key={l.name}>
            {i > 0 ? <Divider style={styles.dividerSm} /> : null}
            <View style={styles.weighRow}>
              <Text v="cardTitle" style={styles.flex}>
                {l.name}
              </Text>
              <Text v="cardTitle">{l.weight}</Text>
            </View>
          </View>
        ))}
        <Divider style={styles.dividerSm} />
        <KeyValue label={r.payment === 'cod' ? 'Collect cash on delivery' : 'Prepaid'} value={formatAmount(r.codAmount ?? r.orderTotal)} strong />
      </Card>
      <Banner tone="sky" title={pickup.warning.title} body={pickup.warning.body} />
    </>
  );
}

/** Board 2c — the partner's pickup screen switches only this block by category. */
export function PickupHandling(props: Omit<HandlingProps<never>, 'pickup'>) {
  const { request } = props;
  const p = request.pickup;
  switch (p.kind) {
    case 'food':
      return <FoodHandling {...props} pickup={p} />;
    case 'grocery':
      return <GroceryHandling {...props} pickup={p} />;
    case 'produce':
      return <ProduceHandling {...props} pickup={p} />;
    case 'bakery':
      return <BakeryHandling {...props} pickup={p} />;
    case 'meat':
      return <MeatHandling {...props} pickup={p} />;
  }
}

/** Every item the partner must tick before the pickup slide is accepted. */
export const requiredChecks = (r: DeliveryRequest): ChecklistItem[] => {
  const p = r.pickup;
  switch (p.kind) {
    case 'grocery':
      return p.bags;
    default:
      return p.checklist;
  }
};

export const PICKUP_COPY: Record<DeliveryRequest['category'], (r: DeliveryRequest) => { slide: string; report: string }> = {
  food: () => ({ slide: 'Slide to confirm pickup', report: 'Order not ready · report delay' }),
  grocery: r => ({ slide: `Slide to confirm ${r.pickup.kind === 'grocery' ? r.pickup.bags.length : r.parcels} bags`, report: 'Bag missing · report' }),
  produce: () => ({ slide: 'Slide to confirm pickup', report: 'Weight mismatch · report' }),
  bakery: () => ({ slide: 'Slide to confirm pickup', report: 'Box damaged · report' }),
  meat: () => ({ slide: 'Slide to confirm pickup', report: 'No ice pack available · report' }),
};

export const categoryPill = (r: DeliveryRequest) => <Pill label={labelFor(r)} tone="leaf" />;

const labelFor = (r: DeliveryRequest) =>
  ({ food: 'Food', grocery: 'Grocery', produce: 'Fruits & Veg', bakery: 'Bakery', meat: 'Meat' })[r.category];

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  gap: { marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.md },
  dividerSm: { marginVertical: space.sm },
  weighRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4 },
  weight: { minWidth: 70, textAlign: 'right' },
  viewPill: {
    backgroundColor: palette.sky,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
