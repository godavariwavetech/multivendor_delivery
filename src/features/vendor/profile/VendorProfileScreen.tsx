import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, ListGroup, ListRow, Pill, Screen, Text, Toggle, WorkspaceHero } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import { useVendorNav } from '@/navigation/types';
import { space } from '@/theme';
import { formatAmount } from '@/utils/currency';

import { USE_MOCK_DATA } from '@config/constants';

import { DemoCategoryPicker, LogoutBlock, WorkspaceSwitch } from '../../shared/AccountSections';

/** Board 4a·5 — store, documents, payouts, notification and language settings. */
export function VendorProfileScreen() {
  const nav = useVendorNav();
  const { store, state, actions } = useVendor();

  return (
    <Screen tab>
      <WorkspaceHero title="Profile" subtitle="Store settings, documents and payouts" />

      <Card style={styles.storeCard}>
        <View style={styles.row}>
          <Avatar initials={store.initials} size={76} />
          <View style={styles.flex}>
            <Text v="headline">{store.name}</Text>
            <Text v="body" muted>
              {`${CATEGORY_LABEL[store.category]} · ${store.area} · ID ${store.code}`}
            </Text>
            <Pill label={`★ ${store.rating} · ${formatAmount(store.ratings, '')} ratings`} tone="leaf" style={styles.pill} />
          </View>
        </View>
      </Card>

      <ListGroup>
        <ListRow title="Store details & address" onPress={() => nav.navigate('StoreDetails')} />
        <ListRow
          title="Opening hours & day parts"
          value={store.hours.replace(/:00/g, '')}
          onPress={() => nav.navigate('Timings')}
        />
        <ListRow title="FSSAI & GST documents" right={<Pill label="Verified" tone="leaf" />} onPress={() => nav.navigate('Documents')} />
        <ListRow title="Bank account for payouts" value={store.bank} onPress={() => nav.navigate('BankAccount', { role: 'vendor' })} />
      </ListGroup>

      <ListGroup>
        <ListRow
          title="Order notifications"
          right={<Toggle value={state.prefs.orderNotifications} onChange={v => actions.setPref('orderNotifications', v)} />}
        />
      </ListGroup>

      <ListGroup>
        <ListRow title="Coupons" value={`${state.coupons.filter(c => c.active).length} active`} onPress={() => nav.navigate('Coupons')} />
        <ListRow title="Reports" onPress={() => nav.navigate('Reports')} />
        <ListRow title="Help & support" onPress={() => nav.navigate('Help')} />
        <ListRow title="Terms & privacy" onPress={() => nav.navigate('Privacy')} />
      </ListGroup>

      <WorkspaceSwitch />
      {USE_MOCK_DATA ? <DemoCategoryPicker /> : null}
      <LogoutBlock onDeleteAccount={() => nav.navigate('Privacy')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  storeCard: { paddingVertical: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, gap: 2 },
  pill: { marginTop: space.sm },
});
