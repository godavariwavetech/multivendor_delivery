import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackHeader, Banner, Button, Card, Divider, KeyValue, Pill, PhotoBox, Screen, Text, Toggle, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { Product } from '@/domain/types';
import { useVendorNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';
import { dayMonth } from '@/utils/datetime';

/** Board 2a·3 — rates change daily, so the whole screen is a rate sheet. */
export function RateSheetScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { store, products, state, actions } = useVendor();
  const [rates, setRates] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.sheet.kind === 'produce' ? String(p.sheet.rate) : '0'])),
  );

  const publish = () => {
    products.forEach(p => {
      if (p.sheet.kind !== 'produce') {
        return;
      }
      const rate = Number(rates[p.id]) || p.sheet.rate;
      const updated: Product = { ...p, priceLine: `₹${rate} / ${p.sheet.unit}`, sheet: { ...p.sheet, rate } };
      actions.saveProduct(updated);
    });
    actions.publishRates();
    toast("Today's rates are live");
    nav.goBack();
  };

  return (
    <Screen footer={<Button label={state.ratesPublished ? 'Update rates' : "Publish today's rates"} size="lg" flex={1} onPress={publish} />}>
      <BackHeader
        title="Today's rates"
        subtitle={`${store.name} · ${dayMonth(Date.now())}`}
        onBack={nav.goBack}
        pill={CATEGORY_LABEL[store.category]}
        pillTone="sky"
      />

      {state.ratesPublished ? (
        <Banner tone="leaf" title="Rates are live for today" body="Customers see these prices until you update them." />
      ) : (
        <Banner
          tone="sky"
          title="Rates not published for today"
          body="Items stay hidden until you publish."
          right={<Text v="bodyStrong" color={palette.blueDeep}>{`${products.length} items`}</Text>}
        />
      )}

      {products.map(p =>
        p.sheet.kind === 'produce' ? (
          <Card key={p.id}>
            <View style={styles.row}>
              <PhotoBox size={60} label="" />
              <View style={styles.flex}>
                <Text v="cardTitle">{p.name}</Text>
                <Text v="body" muted>
                  {p.sheet.note}
                </Text>
              </View>
              <View style={[styles.rate, p.sheet.yesterday ? styles.rateChanged : undefined]}>
                <Text v="body" muted>
                  ₹
                </Text>
                <TextInput
                  value={rates[p.id]}
                  onChangeText={v => setRates(r => ({ ...r, [p.id]: v.replace(/\D/g, '').slice(0, 4) }))}
                  keyboardType="number-pad"
                  style={styles.rateInput}
                  selectTextOnFocus
                />
                <Text v="body" muted>{`/${p.sheet.unit}`}</Text>
              </View>
            </View>
            {p.sheet.tags.length ? (
              <>
                <Divider style={styles.divider} />
                <View style={styles.tags}>
                  {p.sheet.tags.map((t, i) => (
                    <Pill key={t} label={t} tone={i === 0 ? 'sky' : 'neutral'} />
                  ))}
                </View>
              </>
            ) : null}
          </Card>
        ) : null,
      )}

      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">Allow substitution</Text>
            <Text v="body" muted>
              Partner may swap grade with customer's OK
            </Text>
          </View>
          <Toggle value={state.allowSubstitution} onChange={actions.setSubstitution} />
        </View>
      </Card>

      <Card>
        <KeyValue label="Weight tolerance" value="± 50 g" strong />
        <KeyValue label="Billing" value="On weighed quantity" strong />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.sunken,
  },
  rateChanged: { borderColor: palette.skyLine, backgroundColor: palette.skyWash },
  rateInput: { minWidth: 30, fontFamily: fonts.regular, fontSize: 18, color: palette.ink, paddingVertical: 0, textAlign: 'center' },
  divider: { marginVertical: space.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
