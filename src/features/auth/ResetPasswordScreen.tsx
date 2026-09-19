import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Screen, Text, useToast } from '@/components';
import { useSession } from '@/data/session';
import { useAuthNav, useAuthRoute } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';

export function ResetPasswordScreen() {
  const nav = useAuthNav();
  const toast = useToast();
  const { params } = useAuthRoute<'ResetPassword'>();
  const { resetPassword } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setBusy(true);
    const result = await resetPassword(params.mobile, params.otp, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast('Password updated. Sign in with your new password.');
    nav.popToTop();
  };

  return (
    <Screen gap={0} footer={<Button label={busy ? 'Saving…' : 'Set new password'} size="lg" flex={1} disabled={busy} onPress={save} />}>
      <View style={styles.top}>
        <BackButton onPress={nav.goBack} />
      </View>
      <Text v="display">New password</Text>
      <Text v="body" muted style={styles.sub}>
        Number verified. Choose a password you haven't used before.
      </Text>
      {[
        { label: 'New password', value: password, set: setPassword },
        { label: 'Confirm password', value: confirm, set: setConfirm },
      ].map(f => (
        <View key={f.label}>
          <Text v="bodyStrong" style={styles.label}>
            {f.label}
          </Text>
          <View style={styles.field}>
            <TextInput
              value={f.value}
              onChangeText={v => {
                setError(null);
                f.set(v);
              }}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={palette.inkSubtle}
              placeholder="At least 6 characters"
            />
          </View>
        </View>
      ))}
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
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  input: { fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
});
