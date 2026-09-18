import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton, CodeBoxes, LinkButton, NumericKeypad, Screen, Text, applyKey } from '@/components';
import { USE_MOCK_DATA } from '@config/constants';
import { useSession } from '@/data/session';
import { useNow } from '@/hooks/useNow';
import { useAuthNav, useAuthRoute } from '@/navigation/types';
import { ThemeProvider, palette, space } from '@/theme';
import { formatCountdown } from '@/utils/datetime';

const LENGTH = 6;
const RESEND_SECONDS = 30;

/** Board 1a·2 — shared by both roles; the backend returns the role with the session. */
export function OtpScreen() {
  const nav = useAuthNav();
  const { params } = useAuthRoute<'Otp'>();
  const { verifyOtp, requestOtp } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(() => Date.now());
  const now = useNow();

  const remaining = Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000));
  const pretty = `+91 ${params.mobile.slice(0, 5)} ${params.mobile.slice(5)}`;

  useEffect(() => {
    if (code.length !== LENGTH) {
      return;
    }
    const t = setTimeout(async () => {
      // A reset code is checked when the new password is set, in one call.
      if (params.purpose === 'reset') {
        nav.replace('ResetPassword', { mobile: params.mobile, otp: code });
        return;
      }
      const result = await verifyOtp(params.mobile, code, params.role ?? 'vendor');
      if (!result.ok) {
        setError(result.error);
        setCode('');
      }
    }, 250);
    return () => clearTimeout(t);
  }, [code, nav, params.mobile, params.purpose, params.role, verifyOtp]);

  return (
    <ThemeProvider role={params.role ?? 'vendor'}>
      <Screen scroll={false} gap={0}>
        <View style={styles.top}>
          <BackButton onPress={nav.goBack} />
        </View>
        <Text v="display" style={styles.title}>
          Verify your number
        </Text>
        <Text v="body" muted style={styles.sub}>
          {params.purpose === 'login'
            ? `${LENGTH}-digit code sent to ${pretty} · ${params.role === 'delivery' ? 'Delivery partner' : 'Vendor'}`
            : `${LENGTH}-digit code sent to ${pretty}`}
        </Text>

        <CodeBoxes value={code} length={LENGTH} error={Boolean(error)} />

        <View style={styles.row}>
          {remaining > 0 ? (
            <Text v="body" muted>
              {`Resend in ${formatCountdown(remaining)}`}
            </Text>
          ) : (
            <LinkButton
              label="Resend code"
              onPress={async () => {
                setSentAt(Date.now());
                setError(null);
                const sent = await requestOtp(params.mobile, params.role, params.purpose === 'reset' ? 'reset' : 'login');
                if (!sent.ok) {
                  setError(sent.error);
                }
              }}
            />
          )}
          <LinkButton label="Change number" onPress={nav.goBack} />
        </View>
        {error ? (
          <Text v="caption" color={palette.clayMid}>
            {error}
          </Text>
        ) : (
          <Text v="caption" subtle>
            {USE_MOCK_DATA ? 'Demo: any 6 digits work.' : 'The code is valid for 5 minutes.'}
          </Text>
        )}

        <View style={styles.flex} />
        <NumericKeypad
          onKey={k => {
            setError(null);
            setCode(c => applyKey(c, k, LENGTH));
          }}
        />
        <View style={styles.bottom} />
      </Screen>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: space.lg, paddingBottom: space.xl },
  title: { marginBottom: space.xs },
  sub: { marginBottom: space.xl, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg, marginBottom: space.sm },
  flex: { flex: 1 },
  bottom: { height: space.lg },
});
