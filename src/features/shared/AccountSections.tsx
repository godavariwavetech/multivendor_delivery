import { ArrowLeftRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ChipRow, SectionLabel, Text, appAlert } from '@/components';
import { useSession } from '@/data/session';
import { APP_CONFIG, APP_VERSION } from '@config/constants';
import { useVendor } from '@/data/vendorStore';
import { CATEGORIES, CATEGORY_LONG_LABEL } from '@/domain/labels';
import type { Role } from '@/domain/types';
import { palette, space, useTheme } from '@/theme';

const SWITCH_TARGETS = {
  vendor: { title: 'Vendor', icon: palette.blueDeep, bubble: palette.sky },
  delivery: { title: 'Delivery partner', icon: palette.greenDeep, bubble: palette.leaf },
  franchise: { title: 'Franchise', icon: palette.violetDeep, bubble: palette.lilac },
} as const;

/** Accounts holding more than one role can jump to another workspace without signing out. */
export function WorkspaceSwitch() {
  const { session, switchRole } = useSession();
  const { role } = useTheme();
  if (!session || session.account.roles.length < 2) {
    return null;
  }
  const { vendor, partner, franchise } = session.account;
  const detail: Record<Role, string | undefined> = {
    vendor: vendor && `${vendor.storeName} · ${vendor.area}`,
    delivery: partner && `${partner.name} · ${partner.zone}`,
    franchise: franchise && `${franchise.name} · ${franchise.area}`,
  };

  return (
    <>
      {session.account.roles
        .filter(other => other !== role)
        .map(other => (
          <Card key={other} onPress={() => switchRole(other)}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: SWITCH_TARGETS[other].bubble }]}>
                <ArrowLeftRight size={20} color={SWITCH_TARGETS[other].icon} strokeWidth={2.2} />
              </View>
              <View style={styles.flex}>
                <Text v="cardTitle">{`Switch to ${SWITCH_TARGETS[other].title}`}</Text>
                <Text v="body" muted>
                  {detail[other]}
                </Text>
              </View>
            </View>
          </Card>
        ))}
    </>
  );
}

/**
 * Demo only. Board 2c: category is set at onboarding and never changes the shell —
 * this lets every category's product sheet and order flow be seen in one build.
 */
export function DemoCategoryPicker() {
  const { store, actions } = useVendor();
  return (
    <Card tone="sunken">
      <SectionLabel>Demo · store category</SectionLabel>
      <Text v="body" muted style={styles.gap}>
        Switch the demo store to see each category's menu, product sheet and orders.
      </Text>
      <ChipRow>
        {CATEGORIES.map(c => (
          <Chip key={c} label={CATEGORY_LONG_LABEL[c]} selected={store.category === c} onPress={() => actions.setCategory(c)} />
        ))}
      </ChipRow>
    </Card>
  );
}

export function LogoutBlock({ onDeleteAccount }: { onDeleteAccount: () => void }) {
  const { signOut } = useSession();
  return (
    <View style={styles.logout}>
      <Button
        label="Log out"
        variant="outline"
        size="lg"
        onPress={() =>
          appAlert('Are you sure you want to log out?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: signOut },
          ])
        }
      />
      <Pressable onPress={onDeleteAccount} hitSlop={8}>
        <Text v="caption" subtle center>
          {`${APP_CONFIG.businessName} v${APP_VERSION} · delete account`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  gap: { marginBottom: space.md },
  logout: { gap: space.md, marginTop: space.lg },
});
