import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Screen, Text } from '@/components';
import { useSession } from '@/data/session';
import { useAuthNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';

/** Vendor SRS 1 / Delivery SRS 1 — verify the number before a new password is set. */
export function ForgotPasswordScreen() {
  const nav = useAuthNav();
  const { requestOtp } = useSession();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const digits = mobile.replace(/\D/g, '');

  const send = async () => {
    if (digits.length !== 10) {
      setError('Enter your 10-digit mobile number.');
      return;
    }
    setBusy(true);
    const sent = await requestOtp(digits, undefined, 'reset');
    setBusy(false);
    if (!sent.ok) {
      setError(sent.error);
      return;
    }
    nav.navigate('Otp', { mobile: digits, purpose: 'reset' });
  };

  return (
    <Screen gap={0} footer={<Button label={busy ? 'Sending…' : 'Send code'} size="lg" flex={1} disabled={busy} onPress={send} />}>
      <View style={styles.top}>
        <BackButton onPress={nav.goBack} />
      </View>
      <Text v="display">Reset password</Text>
      <Text v="body" muted style={styles.sub}>
        We'll send a 6-digit code to your registered mobile number.
      </Text>
      <Text v="bodyStrong" style={styles.label}>
        Mobile number
      </Text>
      <View style={styles.field}>
        <Text v="body" muted>
          +91
        </Text>
        <View style={styles.divider} />
        <TextInput
          autoFocus
          value={mobile}
          onChangeText={v => setMobile(v.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="10-digit number"
          placeholderTextColor={palette.inkSubtle}
          onSubmitEditing={send}
        />
      </View>
      {error ? (
        <Text v="caption" color={palette.alert}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: space.lg, paddingBottom: space.xl },
  sub: { marginTop: space.xs, marginBottom: space.xxl, fontSize: 15 },
  label: { marginBottom: space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    gap: space.sm,
    marginBottom: space.md,
  },
  divider: { width: 1, height: 22, backgroundColor: palette.line, marginHorizontal: 4 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
});
