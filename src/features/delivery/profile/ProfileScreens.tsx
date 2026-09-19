import { Bike } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  BackHeader,
  Banner,
  Button,
  Card,
  ChoiceRow,
  KeyValue,
  ListGroup,
  ListRow,
  NoteBox,
  Pill,
  Radio,
  Screen,
  SectionLabel,
  StatTile,
  Text,
  TileRow,
  TitleHeader,
  Toggle,
  useToast,
} from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { useDeliveryNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

import { LogoutBlock, WorkspaceSwitch } from '../../shared/AccountSections';

/** Board 4b·5 — partner profile, performance, documents and settings. */
export function PartnerProfileScreen() {
  const nav = useDeliveryNav();
  const { state, profile: P, actions } = useDelivery();

  return (
    <Screen tab>
      <TitleHeader title="Profile" />

      <Card style={styles.profileCard}>
        <View style={styles.row}>
          <Avatar initials={P.initials} size={76} />
          <View style={styles.flex}>
            <Text v="headline">{P.name}</Text>
            <Text v="body" muted>{`Partner ID ${P.id} · ${P.mobile}`}</Text>
            <View style={styles.pills}>
              <Pill label={`★ ${P.rating}`} tone="leaf" />
              <Pill label={`${formatAmount(P.trips, '')} trips`} tone="neutral" />
            </View>
          </View>
        </View>
      </Card>

      <TileRow>
        <StatTile small label="On-time" value={`${P.onTime}%`} />
        <StatTile small label="Acceptance" value={`${P.acceptance}%`} />
        <StatTile small label="Cancels" value={`${P.cancels}%`} />
      </TileRow>

      <ListGroup>
        <ListRow title="Vehicle & licence" value={P.vehicle} onPress={() => nav.navigate('Vehicle')} />
        <ListRow title="Documents & KYC" right={<Pill label="Verified" tone="leaf" />} onPress={() => nav.navigate('Kyc')} />
        <ListRow title="Bank account" value={P.bank} onPress={() => nav.navigate('BankAccount', { role: 'delivery' })} />
        <ListRow
          title="Zone & shift preference"
          value={`${state.prefs.zone} · ${state.prefs.shift}`}
          onPress={() => nav.navigate('ZoneShift')}
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          title="Request alerts"
          right={<Toggle value={state.prefs.requestAlerts} onChange={v => actions.setPref('requestAlerts', v)} />}
        />
        <ListRow title="Delivery history" onPress={() => nav.navigate('History')} />
        <ListRow title="Help & support" onPress={() => nav.navigate('Help')} />
        <ListRow title="Terms & privacy" onPress={() => nav.navigate('Privacy')} />
      </ListGroup>

      <WorkspaceSwitch />
      <LogoutBlock onDeleteAccount={() => nav.navigate('Privacy')} />
    </Screen>
  );
}

export function VehicleScreen() {
  const nav = useDeliveryNav();
  const { profile: P } = useDelivery();
  return (
    <Screen footer={<Button label="Contact support to change" variant="outline" flex={1} onPress={() => nav.navigate('Help')} />}>
      <BackHeader
        title="Vehicle & licence"
        subtitle="Used for pickup verification"
        onBack={nav.goBack}
        pill={P.kycVerified ? 'Verified' : 'In review'}
        pillTone={P.kycVerified ? 'leaf' : 'sky'}
      />
      <Card>
        <View style={styles.row}>
          <View style={styles.vehicleIcon}>
            <Bike size={28} color={palette.greenDeep} strokeWidth={2} />
          </View>
          <View style={styles.flex}>
            <Text v="headline">{P.vehicle}</Text>
            <Text v="body" muted>
              {P.vehicleType}
            </Text>
          </View>
        </View>
      </Card>
      <Card>
        <SectionLabel>Vehicle</SectionLabel>
        <KeyValue label="Registration" value={P.vehicle} strong />
        <KeyValue label="Type" value={P.vehicleType} strong />
      </Card>
      <Card>
        <SectionLabel>Driving licence</SectionLabel>
        <KeyValue label="Licence number" value={P.licence} strong />
        <KeyValue
          label="KYC"
          value={P.licenceValid}
          strong
          valueColor={P.kycVerified ? palette.greenDeep : undefined}
        />
      </Card>
      <NoteBox>Vendors see your registration number at handover. Contact support to change your vehicle.</NoteBox>
    </Screen>
  );
}

export function KycScreen() {
  const nav = useDeliveryNav();
  const { profile: P } = useDelivery();
  const docs = [
    P.aadhaar && { title: 'Aadhaar', detail: P.aadhaar },
    P.pan && { title: 'PAN', detail: P.pan },
    P.licence && P.licence !== '—' && { title: 'Driving licence', detail: P.licence },
  ].filter(Boolean) as { title: string; detail: string }[];
  return (
    <Screen>
      <BackHeader
        title="Documents & KYC"
        subtitle={P.kycVerified ? 'Verified by your store admin' : 'Verification in review'}
        onBack={nav.goBack}
        pill={P.kycVerified ? 'Verified' : 'In review'}
        pillTone={P.kycVerified ? 'leaf' : 'sky'}
      />
      <ListGroup>
        {docs.map(d => (
          <ListRow
            key={d.title}
            title={d.title}
            subtitle={d.detail}
            right={<Pill label={P.kycVerified ? 'Verified' : 'In review'} tone={P.kycVerified ? 'leaf' : 'sky'} />}
          />
        ))}
      </ListGroup>
      <NoteBox>You'll be reminded 30 days before any document expires. Payouts continue while renewals are reviewed.</NoteBox>
    </Screen>
  );
}

/** Shift keys are stored as they come from the server; these are their labels. */
const SHIFT_LABEL: Record<string, string> = {
  mornings: 'Morning',
  afternoons: 'Noon',
  evenings: 'Evening',
  nights: 'Night',
};

export function ZoneShiftScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const { state, today, actions } = useDelivery();
  return (
    <Screen>
      <BackHeader title="Zone & shift" subtitle="Requests are matched to these" onBack={nav.goBack} />
      <SectionLabel style={styles.label}>Zone</SectionLabel>
      <ListGroup>
        {state.zones.map(z => (
          <ListRow
            key={z.key}
            title={z.key}
            subtitle={z.detail}
            onPress={() => {
              actions.setPref('zone', z.key);
              toast(`${z.key} selected`);
            }}
            right={<Radio selected={state.prefs.zone === z.key} />}
          />
        ))}
      </ListGroup>
      <SectionLabel style={styles.label}>Preferred shift</SectionLabel>
      <ChoiceRow
        options={state.options.shifts.map(s => ({ key: s, label: SHIFT_LABEL[s] ?? s }))}
        value={state.prefs.shift}
        onChange={s => {
          actions.setPref('shift', s);
          toast(`Shift preference · ${s}`);
        }}
      />
      <Banner
        tone="leaf"
        title="Evening peak bonus"
        body={`Dinner hours pay +${formatAmount(today.peakReward)} for ${today.peakTarget} trips in most zones.`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { paddingVertical: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', gap: 8, marginTop: space.sm },
  vehicleIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: palette.leaf, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: space.sm, marginBottom: 0 },
});
