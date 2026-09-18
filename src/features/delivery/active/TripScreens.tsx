import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  BackHeader,
  Banner,
  Button,
  Card,
  ChecklistRow,
  CodeBoxes,
  Divider,
  KeyValue,
  ListGroup,
  ListRow,
  NumericKeypad,
  ProgressBar,
  Radio,
  Screen,
  SectionLabel,
  Text,
  applyKey,
  useToast,
} from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { DELIVERY_FAILURE_REASONS } from '@/domain/labels';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { formatCountdown } from '@/utils/datetime';

import { categoryPill, requiredChecks } from './handling';

/** Board 3b·3 — pairs with the vendor's handover screen so both sides agree the order changed hands. */
export function PickupCodeScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { state, activeRequest: r, actions } = useDelivery();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!r || !state.active) {
    return null;
  }
  const trip = state.active;
  const checks = requiredChecks(r).slice(0, 2);

  const confirm = async () => {
    const result = await actions.confirmPickup(code);
    if (!result.ok) {
      setError(result.error);
      setCode('');
      return;
    }
    toast(`Picked up · head to ${r.drop.name}`);
    nav.goBack();
  };

  return (
    <Screen scroll={false} gap={10}>
      <BackHeader title="At the counter" subtitle={`#${r.id} · ${r.store.name}`} onBack={nav.goBack} right={categoryPill(r)} />
      <Banner tone="mint" title="Ask the vendor for the handover code" body="It is on their handover screen." />
      <CodeBoxes value={code} length={4} error={Boolean(error)} />
      {error ? (
        <Text v="caption" color={palette.clayMid}>
          {error}
        </Text>
      ) : r.handoverCode ? (
        <Text v="caption" subtle>{`Demo code: ${r.handoverCode}`}</Text>
      ) : (
        <Text v="caption" subtle>
          The store reads the code from their handover screen.
        </Text>
      )}
      <Card>
        <SectionLabel>Check while you pack</SectionLabel>
        {checks.map((c, i) => (
          <View key={c.key}>
            {i > 0 ? <Divider /> : null}
            <ChecklistRow label={c.label} hint={c.hint} checked={Boolean(trip.checks[c.key])} onToggle={() => actions.toggleCheck(c.key)} />
          </View>
        ))}
      </Card>
      <View style={styles.flex} />
      <NumericKeypad
        onKey={k => {
          setError(null);
          setCode(c => applyKey(c, k, 4));
        }}
      />
      <Button label="Confirm pickup" size="lg" disabled={code.length < 4} onPress={confirm} style={styles.bottom} />
    </Screen>
  );
}

/** Board 1c·4 — OTP verification, optional proof photo, customer-unavailable path. */
export function DeliveryOtpScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { state, activeRequest: r, actions } = useDelivery();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!r || !state.active) {
    return null;
  }

  const verify = async () => {
    const result = await actions.complete(code);
    if (!result.ok) {
      setError(result.error);
      setCode('');
      return;
    }
    toast(`Delivered · ${formatAmount(r.payout)} earned`);
    nav.goBack();
  };

  return (
    <Screen scroll={false} gap={10}>
      <BackHeader title="Complete delivery" subtitle={`#${r.id} · ${r.drop.name}`} onBack={nav.goBack} />
      <Banner tone="mint" title="Ask the customer for their 4-digit OTP" body="It is shown in their order screen." />
      <CodeBoxes value={code} length={4} error={Boolean(error)} />
      {error ? (
        <Text v="caption" color={palette.clayMid}>
          {error}
        </Text>
      ) : r.customerOtp ? (
        <Text v="caption" subtle>{`Demo OTP: ${r.customerOtp}`}</Text>
      ) : (
        <Text v="caption" subtle>
          The customer reads the OTP from their order screen.
        </Text>
      )}
      <View style={styles.pair}>
        <Card style={styles.half} onPress={() => nav.navigate('ProofPhoto')}>
          <Text v="bodyStrong" center>
            Proof photo
          </Text>
          <Text v="caption" muted center>
            {state.active.proofPhoto ? 'Added ✓' : 'Optional'}
          </Text>
        </Card>
        <Card style={styles.half} onPress={() => nav.navigate('DeliveryFailed')}>
          <Text v="bodyStrong" center>
            Customer unavailable
          </Text>
          <Text v="caption" muted center>
            Report issue
          </Text>
        </Card>
      </View>
      <View style={styles.flex} />
      <NumericKeypad
        onKey={k => {
          setError(null);
          setCode(c => applyKey(c, k, 4));
        }}
      />
      <Button label="Verify & complete" size="lg" disabled={code.length < 4} onPress={verify} style={styles.bottom} />
    </Screen>
  );
}

/** Delivery SRS 9 — optional photo proof of delivery. */
export function ProofPhotoScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { activeRequest: r, state, actions } = useDelivery();
  const taken = Boolean(state.active?.proofPhoto);

  return (
    <Screen
      scroll={false}
      footer={
        <Button
          label={taken ? 'Done' : 'Take photo'}
          size="lg"
          flex={1}
          onPress={() => {
            if (!taken) {
              actions.proofPhoto();
              toast('Photo attached to the order');
            }
            nav.goBack();
          }}
        />
      }>
      <BackHeader title="Proof of delivery" subtitle={r ? `#${r.id} · optional` : 'Optional'} onBack={nav.goBack} />
      <View style={styles.viewfinder}>
        {taken ? (
          <View style={styles.taken}>
            <Check size={40} color={palette.cream} strokeWidth={3} />
            <Text v="cardTitle" color={palette.cream}>
              Photo saved
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Text v="bodyStrong" color={palette.cream} center>
              Point at the parcel at the door
            </Text>
          </>
        )}
      </View>
      <Text v="caption" muted center>
        Photos are only shown to support if the customer raises a dispute.
      </Text>
    </Screen>
  );
}

const WAIT_SECONDS = 5 * 60;

/** Delivery SRS 10 — customer unavailable, failure reason, return process. */
export function DeliveryFailedScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow();
  const { activeRequest: r, actions } = useDelivery();
  const [openedAt] = useState(() => Date.now());
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [skipWait, setSkipWait] = useState(false);

  const waited = Math.floor((now - openedAt) / 1000);
  const left = Math.max(0, WAIT_SECONDS - waited);
  const canReport = Boolean(reason) && (left === 0 || skipWait);

  if (!r) {
    return null;
  }

  const attemptPay = Math.round(r.payout * 0.35);

  return (
    <Screen
      footer={
        <Button
          label="Report & return order"
          variant="clay"
          size="lg"
          flex={1}
          disabled={!canReport}
          onPress={() => {
            actions.fail(reason ?? 'Customer unavailable');
            toast(`Reported · return #${r.id} to ${r.store.name}`);
            nav.popToTop();
            nav.navigate('DeliveryTabs', { screen: 'Home' });
          }}
        />
      }>
      <BackHeader title="Can't deliver?" subtitle={`#${r.id} · ${r.drop.name}`} onBack={nav.goBack} />

      <Card>
        <View style={styles.waitHead}>
          <Text v="cardTitle">Waiting at the location</Text>
          <Text v="cardTitle" color={left ? palette.clayMid : palette.sageDeep}>
            {left ? formatCountdown(left) : 'Done'}
          </Text>
        </View>
        <ProgressBar progress={waited / WAIT_SECONDS} style={styles.progress} />
        <Text v="body" muted>
          Call the customer twice and wait 5 minutes before reporting.
        </Text>
        {left > 0 && !skipWait ? (
          <Text v="bodyStrong" color={palette.clay} style={styles.skip} onPress={() => setSkipWait(true)}>
            Skip wait (demo)
          </Text>
        ) : null}
      </Card>

      <SectionLabel style={styles.label}>What happened?</SectionLabel>
      <ListGroup>
        {DELIVERY_FAILURE_REASONS.map(x => (
          <ListRow key={x} title={x} onPress={() => setReason(x)} right={<Radio selected={reason === x} />} />
        ))}
      </ListGroup>

      <Card padded={false}>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Anything support should know (optional)"
          placeholderTextColor={palette.inkSubtle}
          style={styles.note}
        />
      </Card>

      <Banner
        tone="peach"
        title="Return the order to the store"
        body={`${r.category === 'food' ? 'Food orders go' : 'The order goes'} back to ${r.store.name}. You're paid ${formatAmount(attemptPay)} for the attempt.`}
      />
      <Card tone="sunken">
        <KeyValue label="Customer called" value="2 times" />
        <KeyValue label="Distance travelled" value={`${r.totalKm} km`} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bottom: { marginTop: space.md, marginBottom: space.lg },
  pair: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, paddingVertical: space.md },
  viewfinder: {
    flex: 1,
    marginVertical: space.lg,
    borderRadius: radius.xl,
    backgroundColor: palette.night,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  taken: { alignItems: 'center', gap: space.md },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: palette.cream },
  tl: { top: 24, left: 24, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 24, right: 24, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 24, left: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 24, right: 24, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  waitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { marginVertical: space.md },
  skip: { marginTop: space.md },
  label: { marginTop: space.sm, marginBottom: 0 },
  note: {
    minHeight: 90,
    padding: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.ink,
    textAlignVertical: 'top',
  },
});
