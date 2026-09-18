import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BackHeader, Card, Fab, NoteBox, Screen, Text, Toggle, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import type { Coupon } from '@/domain/types';
import { useVendorNav } from '@/navigation/types';
import { palette, space } from '@/theme';

export const couponSummary = (c: Coupon) =>
  c.kind === 'flat'
    ? `₹${c.value} off on orders above ₹${c.minOrder}`
    : `${c.value}% off up to ₹${c.maxDiscount ?? 0} · min ₹${c.minOrder}`;

/** Vendor SRS 8 — coupons (feature-gated by the tenant's plan). */
export function CouponsScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { state, actions } = useVendor();

  return (
    <View style={styles.root}>
      <Screen>
        <BackHeader title="Coupons" subtitle="Shown to customers at checkout" onBack={nav.goBack} />
        {state.coupons.map(c => (
          <Card key={c.code} onPress={() => nav.navigate('CouponEdit', { code: c.code })} style={!c.active ? styles.faded : undefined}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <View style={styles.codeTag}>
                  <Text v="bodyStrong" color={palette.clayDeep} style={styles.code}>
                    {c.code}
                  </Text>
                </View>
                <Text v="bodyStrong" style={styles.gap}>
                  {couponSummary(c)}
                </Text>
                <Text v="body" muted>{`Valid till ${c.validTill} · used ${c.used} times`}</Text>
              </View>
              <Toggle
                value={c.active}
                onChange={() => {
                  actions.toggleCoupon(c.code);
                  toast(c.active ? `${c.code} paused` : `${c.code} is live`);
                }}
              />
            </View>
          </Card>
        ))}
        <NoteBox>Inactive coupons can't be applied to new orders. Coupon discounts are shared as shown in your settlement.</NoteBox>
      </Screen>
      <Fab label="Create coupon" onPress={() => nav.navigate('CouponEdit', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  codeTag: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.peachLine,
    backgroundColor: palette.peachWash,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  code: { letterSpacing: 1.5 },
  gap: { marginTop: space.sm },
  faded: { opacity: 0.65 },
});
