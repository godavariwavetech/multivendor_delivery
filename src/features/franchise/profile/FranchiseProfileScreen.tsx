import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, ListGroup, ListRow, Pill, Screen, StatTile, Text, TileRow, TitleHeader } from '@/components';
import { useFranchise } from '@/data/franchiseStore';
import { useFranchiseNav } from '@/navigation/types';
import { space } from '@/theme';

import { LogoutBlock, WorkspaceSwitch } from '../../shared/AccountSections';

/** Franchise profile: who runs it, the territory and rate, and the shared help screens. */
export function FranchiseProfileScreen() {
  const nav = useFranchiseNav();
  const { state } = useFranchise();
  const { profile: P, vendors, partners } = state;

  return (
    <Screen tab>
      <TitleHeader title="Profile" />

      <Card style={styles.profileCard}>
        <View style={styles.row}>
          <Avatar initials={P.initials || '··'} size={76} />
          <View style={styles.flex}>
            <Text v="headline">{P.name}</Text>
            <Text v="body" muted>{`${P.code} · ${P.mobile}`}</Text>
            <View style={styles.pills}>
              <Pill label={P.territory || 'No territory'} tone="soft" />
              <Pill label={`${P.commissionPct}% commission`} tone="neutral" />
            </View>
          </View>
        </View>
      </Card>

      <TileRow>
        <StatTile small label="Vendors" value={String(vendors.length)} />
        <StatTile small label="Partners" value={String(partners.length)} />
        <StatTile small label="Area" value={P.area.split(',')[0] || '—'} />
      </TileRow>

      <ListGroup>
        <ListRow title="Owner" value={P.owner} chevron={false} />
        <ListRow title="Email" value={P.email || 'Not added'} chevron={false} />
        <ListRow title="Payout account" value={P.bank || 'Not added'} chevron={false} />
      </ListGroup>

      <ListGroup>
        <ListRow title="Help & support" onPress={() => nav.navigate('Help')} />
        <ListRow title="Terms & privacy" onPress={() => nav.navigate('Privacy')} />
      </ListGroup>

      <WorkspaceSwitch />
      <LogoutBlock onDeleteAccount={() => nav.navigate('Privacy')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
});
