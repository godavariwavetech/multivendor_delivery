import React from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { AmountRow, Button, Card, Divider, KeyValue, RoundPhoto, RouteTimeline, SectionLabel, Text } from '@/components';
import type { DeliveryRequest } from '@/domain/types';
import { space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { photoUrl } from '@/utils/photo';
import { requestItemNames } from '@/utils/trips';

/** The big picture of the order: its first dish. Nothing when the order has none. */
export function OrderHero({ request: r }: { request: DeliveryRequest }) {
  const uri = photoUrl(r.photo);
  return uri ? <Image source={{ uri }} style={styles.hero} resizeMode="cover" /> : null;
}

/**
 * Everything the partner is told about an order, the same on a request and on a finished trip: the dishes with
 * their photos and prices and the bill, the store, the payment, and the route with both addresses.
 * `finished` drops what only makes sense before the trip (distance from you, the time estimate).
 */
export function OrderDetailCards({ request: r, finished }: { request: DeliveryRequest; finished?: boolean }) {
  const bill = r.bill;
  const handling = r.pickup.kind === 'food' ? 'Hot bag' : r.pickup.kind === 'meat' ? 'Cold bag' : r.pickup.kind === 'bakery' ? 'Fragile' : null;

  return (
    <>
      <Card>
        <SectionLabel>{`Order items · ${r.items} ${r.items === 1 ? 'item' : 'items'}`}</SectionLabel>
        {bill ? (
          <>
            {bill.lines.map((l, i) => (
              <View key={`${l.name}-${i}`} style={styles.line}>
                <RoundPhoto stored={l.image} size={44} />
                <Text v="body" style={styles.lineName}>
                  {`${l.qty} × ${l.name}${l.variant ? ` (${l.variant})` : ''}`}
                </Text>
                <Text v="body">{formatAmount(l.amount)}</Text>
              </View>
            ))}
            <Divider style={styles.divider} />
            <AmountRow label="Item total" amount={bill.itemTotal} />
            {bill.packing ? <AmountRow label="Packing charges" amount={bill.packing} /> : null}
            {bill.tax ? <AmountRow label="Taxes" amount={bill.tax} /> : null}
            {bill.delivery ? <AmountRow label="Delivery charges" amount={bill.delivery} /> : null}
            {bill.discount ? <AmountRow label={bill.couponCode ? `Discount · ${bill.couponCode}` : 'Discount'} amount={-bill.discount} /> : null}
            {bill.tip ? <AmountRow label="Tip" amount={bill.tip} /> : null}
            <AmountRow label="Order total" amount={bill.total} total />
          </>
        ) : (
          <>
            <Text v="body" muted>
              {requestItemNames(r)}
            </Text>
            <AmountRow label="Order total" amount={r.orderTotal} total />
          </>
        )}
      </Card>

      <Card>
        <SectionLabel>Store details</SectionLabel>
        <View style={styles.line}>
          <RoundPhoto stored={r.store.photo} size={56} />
          <View style={styles.lineName}>
            <Text v="cardTitle">{r.store.name}</Text>
            {r.store.area ? (
              <Text v="body" muted>
                {r.store.area}
              </Text>
            ) : null}
          </View>
        </View>
        {r.store.address ? (
          <Text v="body" muted style={styles.address}>
            {r.store.address}
          </Text>
        ) : null}
        {r.store.hours ? <KeyValue label="Open" value={r.store.hours} /> : null}
        {finished ? null : <KeyValue label="Distance from you" value={`${r.store.distanceKm} km`} />}
        {r.store.phone ? (
          <>
            <KeyValue label="Phone" value={r.store.phone} />
            <Button label="Call store" variant="outline" size="sm" style={styles.call} onPress={() => Linking.openURL(`tel:${r.store.phone}`)} />
          </>
        ) : null}
      </Card>

      <Card>
        <SectionLabel>Payment</SectionLabel>
        <KeyValue label="Mode" value={r.payment === 'cod' ? 'Cash on delivery' : 'Prepaid'} />
        <KeyValue
          label={finished ? 'Collected from customer' : 'Collect from customer'}
          value={r.payment === 'cod' ? formatAmount(r.codAmount ?? r.orderTotal) : 'Nothing to collect'}
          strong={r.payment === 'cod'}
        />
        {handling ? <KeyValue label="Handling" value={handling} /> : null}
      </Card>

      <Card>
        <SectionLabel>Route</SectionLabel>
        <RouteTimeline
          from={{ title: r.store.name, subtitle: `${r.store.address || r.store.area}${finished ? '' : ` · ${r.store.distanceKm} km away`}` }}
          to={{ title: r.drop.name, subtitle: `${r.drop.address || r.drop.area} · ${r.drop.distanceKm} km from pickup` }}
        />
        <Divider style={styles.divider} />
        <KeyValue label="Total distance" value={`${r.totalKm} km`} />
        {finished ? null : <KeyValue label="Estimated time" value={`~${r.etaMin} min`} />}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 190, borderRadius: 20, backgroundColor: '#F2EDE6' },
  divider: { marginVertical: space.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  lineName: { flex: 1 },
  address: { marginTop: space.sm, marginBottom: space.xs },
  call: { marginTop: space.sm },
});
