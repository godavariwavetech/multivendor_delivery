import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  Chip,
  ChipRow,
  ChoiceRow,
  Screen,
  SectionLabel,
  Text,
  Toggle,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import type { Coupon } from '@/domain/types';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';

import { couponSummary } from './CouponsScreen';

const VALIDITY = ['7 days', '30 days', 'End of month'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const endOfMonthDays = () => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(1, Math.round((last.getTime() - now.getTime()) / 86_400_000));
};

/** "7 days" from today as "25 Sep", for the row while the server catches up. */
const validTillLabel = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export function CouponEditScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { params } = useVendorRoute<'CouponEdit'>();
  const { state, actions } = useVendor();
  const existing = state.coupons.find(c => c.code === params.code);

  const [code, setCode] = useState(existing?.code ?? '');
  const [kind, setKind] = useState<Coupon['kind']>(existing?.kind ?? 'flat');
  const [value, setValue] = useState(String(existing?.value ?? 50));
  const [minOrder, setMinOrder] = useState(String(existing?.minOrder ?? 299));
  const [maxDiscount, setMaxDiscount] = useState(String(existing?.maxDiscount ?? 100));
  const [validity, setValidity] = useState('30 days');
  const [active, setActive] = useState(existing?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const validDays = validity === '7 days' ? 7 : validity === 'End of month' ? endOfMonthDays() : 30;
  const draft: Coupon = {
    code: code.toUpperCase(),
    kind,
    value: Number(value) || 0,
    minOrder: Number(minOrder) || 0,
    maxDiscount: kind === 'percent' ? Number(maxDiscount) || 0 : undefined,
    validTill: existing?.validTill ?? validTillLabel(validDays),
    validDays,
    couponId: existing?.couponId,
    used: existing?.used ?? 0,
    active,
  };

  const save = () => {
    if (!/^[A-Z0-9]{4,12}$/.test(draft.code)) {
      setError('Use 4–12 letters or numbers for the code.');
      return;
    }
    if (!draft.value) {
      setError('Enter a discount value.');
      return;
    }
    actions.saveCoupon(draft);
    toast(`${draft.code} saved`);
    nav.goBack();
  };

  return (
    <Screen footer={<Button label="Save coupon" size="lg" flex={1} onPress={save} />}>
      <BackHeader title={existing ? 'Edit coupon' : 'New coupon'} subtitle={draft.code ? couponSummary(draft) : 'Set the code and discount'} onBack={nav.goBack} />

      <SectionLabel style={styles.label}>Coupon code</SectionLabel>
      <Field value={code} onChangeText={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. DINNER20" editable={!existing} />

      <SectionLabel style={styles.label}>Discount</SectionLabel>
      <ChoiceRow
        options={[
          { key: 'flat' as const, label: 'Flat ₹' },
          { key: 'percent' as const, label: 'Percent %' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <View style={styles.pair}>
        <View style={styles.flex}>
          <Text v="caption" muted style={styles.fieldLabel}>
            {kind === 'flat' ? 'Amount off (₹)' : 'Percent off'}
          </Text>
          <Field value={value} onChangeText={v => setValue(v.replace(/\D/g, ''))} numeric />
        </View>
        {kind === 'percent' ? (
          <View style={styles.flex}>
            <Text v="caption" muted style={styles.fieldLabel}>
              Max discount (₹)
            </Text>
            <Field value={maxDiscount} onChangeText={v => setMaxDiscount(v.replace(/\D/g, ''))} numeric />
          </View>
        ) : null}
      </View>

      <SectionLabel style={styles.label}>Minimum order (₹)</SectionLabel>
      <Field value={minOrder} onChangeText={v => setMinOrder(v.replace(/\D/g, ''))} numeric />

      {!existing ? (
        <>
          <SectionLabel style={styles.label}>Valid for</SectionLabel>
          <ChipRow scroll={false}>
            {VALIDITY.map(v => (
              <Chip key={v} label={v} selected={v === validity} onPress={() => setValidity(v)} />
            ))}
          </ChipRow>
        </>
      ) : null}

      <Card style={styles.toggleCard}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">Active</Text>
            <Text v="body" muted>
              Customers can apply it at checkout
            </Text>
          </View>
          <Toggle value={active} onChange={setActive} />
        </View>
      </Card>

      {error ? (
        <Text v="caption" color={palette.alert}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  numeric,
  editable = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={[styles.field, !editable && styles.fieldLocked]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkSubtle}
        keyboardType={numeric ? 'number-pad' : 'default'}
        autoCapitalize="characters"
        editable={editable}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: space.sm, marginBottom: 0 },
  fieldLabel: { marginBottom: 6 },
  pair: { flexDirection: 'row', gap: 10, marginTop: space.sm },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  toggleCard: { marginTop: space.sm },
  field: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  fieldLocked: { backgroundColor: palette.sunken },
  input: { fontFamily: fonts.regular, fontSize: 14, color: palette.ink, paddingVertical: 0, letterSpacing: 0.4 },
});
