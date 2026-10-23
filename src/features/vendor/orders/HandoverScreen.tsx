import { Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  BackHeader,
  Button,
  Card,
  ChecklistRow,
  CodeBoxes,
  Divider,
  IconCircle,
  KeyValue,
  LinkButton,
  NoteBox,
  NumericKeypad,
  Screen,
  SectionLabel,
  Text,
  applyKey,
  useToast,
  appAlert,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock } from '@/utils/datetime';

/**
 * Board 3a·4 — "who took the food", verified by a code the partner types in on
 * their pickup screen (3b·3).
 */
export function HandoverScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { params } = useVendorRoute<'Handover'>();
  const { order: find, store, actions } = useVendor();
  const order = find(params.id);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!order) {
    return null;
  }

  const partner = order.partner;
  const items =
    store.category === 'food'
      ? [`${order.parcels} parcels sealed with sticker`, 'Gravy packed separately', 'Bill slip inside the bag']
      : [`${order.parcels} bags tagged with #${order.id}`, 'Fragile items packed on top', 'Bill slip inside the bag'];
  const allChecked = items.every(i => checks[i]);

  const confirm = () => {
    const done = async () => {
      const result = await actions.handover(order.id, code);
      if (!result.ok) {
        setError(result.error);
        setCode('');
        return;
      }
      toast(`Handed over to ${partner?.name ?? 'partner'}`);
      nav.goBack();
    };
    if (allChecked) {
      done();
      return;
    }
    appAlert('Checklist not complete', 'Some items are not ticked. Hand over anyway?', [
      { text: 'Go back', style: 'cancel' },
      { text: 'Hand over', onPress: done },
    ]);
  };

  if (order.status !== 'ready') {
    return (
      <Screen>
        <BackHeader title="Handover" subtitle={`#${order.id}`} onBack={nav.goBack} />
        <Card>
          <Text v="body">{order.status === 'picked_up' ? `Already picked up by ${partner?.name}.` : 'This order is not ready for handover.'}</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label="Confirm handover" size="lg" disabled={code.length < 4} onPress={confirm} />
          <LinkButton center label="Partner not here · report" onPress={() => nav.navigate('ReportProblem', { context: `Handover #${order.id}` })} />
        </View>
      }>
      <BackHeader
        title="Handover"
        subtitle={`#${order.id} · ready ${order.readyAt ? clock(order.readyAt) : ''}`}
        onBack={nav.goBack}
      />

      {partner ? (
        <Card tone="green">
          <View style={styles.partner}>
            <Avatar initials={partner.initials} tone="onDark" size={56} />
            <View style={styles.flex}>
              <Text v="cardTitle" color={palette.canvas}>
                {partner.atCounter ? `${partner.name} is at your counter` : `${partner.name} arrives in ~3 min`}
              </Text>
              <Text v="body" color="rgba(255, 255, 255, 0.85)">
                {`${partner.vehicle} · ★ ${partner.rating}`}
              </Text>
            </View>
            <IconCircle icon={Phone} bg={palette.white} color={palette.greenDeep} onPress={() => toast(`Calling ${partner.name}…`)} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.codeCard}>
        <SectionLabel style={styles.center}>Handover code</SectionLabel>
        <Text v="body" muted center>
          Ask the partner for the code on their phone, then enter it to hand the order over.
        </Text>
        <CodeBoxes value={code} length={4} error={Boolean(error)} />
        {error ? (
          <Text v="caption" color={palette.alert}>
            {error}
          </Text>
        ) : null}
      </Card>
      <NumericKeypad
        onKey={k => {
          setError(null);
          setCode(c => applyKey(c, k, 4));
        }}
      />

      <Card>
        <SectionLabel>{`Order details · ${order.lines.length} ${order.lines.length === 1 ? 'item' : 'items'}`}</SectionLabel>
        {order.lines.map((l, i) => (
          <View key={`${l.name}-${i}`}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.line}>
              <View style={styles.flex}>
                <Text v="bodyStrong">{l.name}</Text>
                <Text v="body" muted>
                  {[l.variant, l.options, l.productId ? `Code #${l.productId}` : undefined].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.right}>
                <Text v="bodyStrong">{`× ${l.qty}`}</Text>
                <Text v="body" muted>
                  {formatAmount(l.price)}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <Divider />
        <KeyValue label="Item total" value={formatAmount(order.itemTotal)} />
        {order.packing > 0 ? <KeyValue label="Packing" value={formatAmount(order.packing)} /> : null}
        {order.gst > 0 ? <KeyValue label="GST" value={formatAmount(order.gst)} /> : null}
        {order.coupon ? <KeyValue label={`Coupon ${order.coupon.code}`} value={`−${formatAmount(order.coupon.amount)}`} /> : null}
        <KeyValue label="Order total" value={formatAmount(order.total)} strong />
        {order.note ? (
          <Text v="body" muted style={styles.note}>
            <Text v="bodyStrong">Customer note: </Text>
            {order.note}
          </Text>
        ) : null}
      </Card>

      <Card>
        <SectionLabel>Before you hand over</SectionLabel>
        {items.map((item, i) => (
          <View key={item}>
            {i > 0 ? <Divider /> : null}
            <ChecklistRow label={item} checked={Boolean(checks[item])} onToggle={() => setChecks(c => ({ ...c, [item]: !c[item] }))} />
          </View>
        ))}
      </Card>

      <NoteBox>
        {order.payment === 'cod'
          ? `COD order · partner collects ${formatAmount(order.total)} from the customer.`
          : 'Prepaid order · nothing to collect from the partner.'}
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  partner: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  codeCard: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  center: { textAlign: 'center' },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.xs },
  right: { alignItems: 'flex-end' },
  note: { marginTop: space.sm },
  footer: { flex: 1, gap: space.md },
});
