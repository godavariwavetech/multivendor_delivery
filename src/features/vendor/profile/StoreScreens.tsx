import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  KeyValue,
  ListGroup,
  ListRow,
  OsmMap,
  NoteBox,
  PhotoBox,
  Pill,
  Screen,
  SectionLabel,
  Text,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { CATEGORY_LONG_LABEL } from '@/domain/labels';
import { useVendorNav } from '@/navigation/types';
import { radius, space } from '@/theme';

/** Vendor SRS 3 — store profile, contact details, address and branding. */
export function StoreDetailsScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { store, state } = useVendor();
  const details = state.details;

  return (
    <Screen footer={<Button label="Request a change" variant="outline" flex={1} onPress={() => toast('Change request sent to your store admin')} />}>
      <BackHeader title="Store details" subtitle={`ID ${store.code}`} onBack={nav.goBack} />

      <Card padded={false} style={styles.bannerCard}>
        <View style={styles.banner}>
          <PhotoBox size={120} label="STORE PHOTO" />
          <View style={styles.flex}>
            <Text v="headline">{store.name}</Text>
            <Text v="body" muted>
              {CATEGORY_LONG_LABEL[store.category]}
            </Text>
            <Text v="caption" subtle style={styles.gap}>
              Shown to customers on the store page and search results.
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionLabel>Contact</SectionLabel>
        <KeyValue label="Phone" value={details?.phone || '+91 98407 21536'} strong />
        <KeyValue label="Alternate" value={details?.alternatePhone || '—'} />
        <KeyValue label="Email" value={details?.email || '—'} />
      </Card>

      <Card padded={false}>
        <OsmMap
          latitude={store.latitude}
          longitude={store.longitude}
          label={store.name}
          height={170}
          style={styles.map}
        />
        <View style={styles.address}>
          <SectionLabel>Address</SectionLabel>
          <Text v="body">{store.address}</Text>
        </View>
      </Card>

      <NoteBox>Name, category and address changes are verified by your store admin before they go live.</NoteBox>
    </Screen>
  );
}

/** Board 4a·5 "FSSAI & GST documents · Verified". */
export function DocumentsScreen() {
  const nav = useVendorNav();
  const { state } = useVendor();
  const details = state.details;
  const docs = details
    ? [...details.documents, { title: 'Signed agreement', detail: `Commission ${details.commission}%` }]
    : [
        { title: 'FSSAI licence', detail: '12419025000123 · valid till Mar 2028' },
        { title: 'GST certificate', detail: '33AABCU9603R1ZX' },
        { title: 'Trade licence', detail: 'GCC/TL/2024/88412' },
        { title: 'PAN', detail: 'AABCU••03R' },
        { title: 'Signed agreement', detail: 'Commission 18% · signed 2 Jan 2025' },
      ];
  const verified = details ? details.kycVerified : true;
  return (
    <Screen>
      <BackHeader
        title="Documents"
        subtitle="KYC for payouts and compliance"
        onBack={nav.goBack}
        pill={verified ? 'Verified' : 'In review'}
        pillTone={verified ? 'mint' : 'peach'}
      />
      <ListGroup>
        {docs.map(d => (
          <ListRow
            key={d.title}
            title={d.title}
            subtitle={d.detail}
            right={<Pill label={verified ? 'Verified' : 'In review'} tone={verified ? 'mint' : 'peach'} />}
          />
        ))}
      </ListGroup>
      <NoteBox>To replace an expiring document, raise a request from Help & support. Payouts continue while it's reviewed.</NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerCard: { overflow: 'hidden' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.lg },
  flex: { flex: 1 },
  gap: { marginTop: space.sm },
  map: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  address: { padding: space.lg },
});
