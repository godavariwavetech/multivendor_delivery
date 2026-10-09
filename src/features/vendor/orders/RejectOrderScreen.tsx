import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackHeader, Button, Card, ListGroup, ListRow, Screen, SectionLabel, Text, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { REJECT_REASONS } from '@/domain/labels';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';

/** Vendor SRS 6 — a rejection reason is always recorded. */
export function RejectOrderScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { params } = useVendorRoute<'RejectOrder'>();
  const { actions } = useVendor();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const reject = () => {
    if (!reason) {
      return;
    }
    actions.reject(params.id, reason);
    toast(`#${params.id} rejected · ${reason.toLowerCase()}`);
    nav.popToTop();
  };

  return (
    <Screen footer={<Button label="Reject order" variant="blue" flex={1} disabled={!reason} onPress={reject} />}>
      <BackHeader title={`Reject #${params.id}`} subtitle="The customer is refunded automatically" onBack={nav.goBack} />
      <SectionLabel style={styles.label}>Why can't you take it?</SectionLabel>
      <ListGroup>
        {REJECT_REASONS.map(r => (
          <ListRow
            key={r}
            title={r}
            onPress={() => setReason(r)}
            right={
              <View style={[styles.radio, reason === r && styles.radioOn]}>
                {reason === r ? <Check size={14} color={palette.white} strokeWidth={3} /> : null}
              </View>
            }
          />
        ))}
      </ListGroup>
      <SectionLabel style={styles.label}>Note for the store admin (optional)</SectionLabel>
      <Card padded={false}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Mutton ran out at 7:30 PM"
          placeholderTextColor={palette.inkSubtle}
          multiline
          style={styles.input}
        />
      </Card>
      <Text v="caption" muted center>
        Repeated rejections lower your store's ranking for customers.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: space.md, marginBottom: 0 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: palette.blue, borderColor: palette.blue },
  input: {
    minHeight: 96,
    padding: space.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.ink,
    textAlignVertical: 'top',
    borderRadius: radius.lg,
  },
});
