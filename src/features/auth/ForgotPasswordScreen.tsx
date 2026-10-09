import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Screen, Text } from '@/components';
import { useSession } from '@/data/session';
import { useAuthNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';
import { mobileDigits, mobileHasExtraDigits, mobileIssue } from '@/utils/mobile';

/** Vendor SRS 1 / Delivery SRS 1 — verify the number before a new password is set. */
export function ForgotPasswordScreen() {
  const nav = useAuthNav();
  const { requestOtp } = useSession();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [extraDigits, setExtraDigits] = useState(false);
  const digits = mobileDigits(mobile);
  const mobileMessage = mobileIssue(digits, extraDigits);

  const send = async () => {
    if (mobileMessage || digits.length !== 10) {
      setError(mobileMessage ?? 'Enter your 10-digit mobile number.');
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
          onChangeText={v => {
            setMobile(mobileDigits(v));
            setExtraDigits(mobileHasExtraDigits(v));
            setError(null);
          }}
          keyboardType="number-pad"
          // Full: the field refuses more instead of showing a digit and taking it out again.
          maxLength={digits.length >= 10 ? 10 : undefined}
          onKeyPress={e => {
            if (digits.length >= 10 && /^\d$/.test(e.nativeEvent.key)) {
              setExtraDigits(true);
            }
          }}
          style={styles.input}
          placeholder="10-digit number"
          placeholderTextColor={palette.inkSubtle}
          onSubmitEditing={send}
        />
      </View>
      {mobileMessage || error ? (
        <Text v="caption" color={palette.alert}>
          {mobileMessage ?? error}
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
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    gap: space.sm,
    marginBottom: space.md,
  },
  divider: { width: 1, height: 22, backgroundColor: palette.line, marginHorizontal: 4 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
});
