import { Bike, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, LinkButton, Screen, SegmentOption, SegmentedTabs, Text } from '@/components';
import { USE_MOCK_DATA } from '@config/constants';
import { useSession } from '@/data/session';
import type { Role } from '@/domain/types';
import { useAuthNav } from '@/navigation/types';
import { ThemeProvider, fonts, palette, radius, roleColorsFrom, space } from '@/theme';

const WORKSPACE_HINT: Record<Role, string> = {
  vendor: 'Store, menu, orders, coupons and settlements.',
  delivery: 'Requests, pickups, navigation and earnings.',
};

/**
 * Board 1a·1 — mobile number + password, OTP alternative, forgot password. The
 * workspace is chosen here with tabs instead of a separate picker screen.
 */
export function LoginScreen() {
  const nav = useAuthNav();
  const { signInWithPassword, requestOtp, branding } = useSession();
  const [role, setRole] = useState<Role>('vendor');
  // Prefilled only in demo mode; a real sign-in starts empty.
  const [mobile, setMobile] = useState(USE_MOCK_DATA ? '98407 21536' : '');
  const [password, setPassword] = useState(USE_MOCK_DATA ? '123456' : '');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const digits = mobile.replace(/\D/g, '');

  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    const result = await signInWithPassword(digits, password, role);
    setBusy(false);
    setError(result.ok ? null : result.error);
  };

  const useOtp = async () => {
    if (digits.length !== 10) {
      setError('Enter your 10-digit mobile number.');
      return;
    }
    setBusy(true);
    const sent = await requestOtp(digits, role, 'login');
    setBusy(false);
    if (!sent.ok) {
      setError(sent.error);
      return;
    }
    setError(null);
    nav.navigate('Otp', { mobile: digits, purpose: 'login', role });
  };

  const formatMobile = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 10);
    return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
  };

  // Everything accent-coloured on this screen follows the selected workspace
  // tab, in the colour the tenant picked for that side.
  const accent = roleColorsFrom(role, branding).accent;
  const workspaces: SegmentOption<Role>[] = [
    { key: 'vendor', label: 'Vendor', icon: Store, activeColor: roleColorsFrom('vendor', branding).accent },
    { key: 'delivery', label: 'Delivery partner', icon: Bike, activeColor: roleColorsFrom('delivery', branding).accent },
  ];

  return (
    <ThemeProvider role={role} brand={branding}>
      <Screen gap={0} contentStyle={styles.content}>
        <View style={[styles.logo, { backgroundColor: accent }]}>
          <Text v="display" color={palette.cream} style={styles.logoLetter}>
            e
          </Text>
        </View>
        <Text v="hero" style={styles.brand}>
          {'eKart360\nPartner'}
        </Text>
        <Text v="body" muted style={styles.lead}>
          {'Choose your workspace and sign in with\nyour registered mobile number.'}
        </Text>

        <SegmentedTabs
          options={workspaces}
          value={role}
          onChange={next => {
            setRole(next);
            setError(null);
          }}
        />
        <Text v="caption" muted style={styles.hint}>
          {WORKSPACE_HINT[role]}
        </Text>

        <Text v="bodyStrong" style={styles.fieldLabel}>
          Mobile number
        </Text>
        <View style={styles.field}>
          <Text v="body" muted style={styles.prefix}>
            +91
          </Text>
          <View style={styles.prefixDivider} />
          <TextInput
            value={mobile}
            onChangeText={v => setMobile(formatMobile(v))}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="98407 21536"
            placeholderTextColor={palette.inkSubtle}
            maxLength={11}
          />
        </View>

        <Text v="bodyStrong" style={styles.fieldLabel}>
          Password
        </Text>
        <View style={styles.field}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={palette.inkSubtle}
            onSubmitEditing={submit}
          />
          <Pressable onPress={() => setShow(s => !s)} hitSlop={10}>
            <Text v="bodyStrong" color={accent}>
              {show ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text v="caption" color={palette.clayMid} style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.links}>
          <LinkButton label="Use OTP instead" onPress={useOtp} />
          <Pressable onPress={() => nav.navigate('ForgotPassword')} hitSlop={10}>
            <Text v="body" muted>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <Button
          label={busy ? 'Please wait…' : role === 'vendor' ? 'Sign in as Vendor' : 'Sign in as Partner'}
          variant={role === 'vendor' ? 'clay' : 'sage'}
          size="lg"
          disabled={busy}
          onPress={submit}
        />

        <View style={styles.spacer} />
        <Text v="caption" subtle center style={styles.footer}>
          {'Vendors and delivery partners use this same app.\nNeed access? Contact your store admin.'}
        </Text>
        {USE_MOCK_DATA ? (
          <Text v="caption" subtle center style={styles.demo}>
            Demo · 98407 21536 (both roles) · 98407 00001 (vendor) · 98407 00002 (partner)
          </Text>
        ) : (
          <Pressable onPress={() => nav.navigate('ServerAddress')} hitSlop={10} style={styles.server}>
            <Text v="caption" subtle center>
              Server settings
            </Text>
          </Pressable>
        )}
      </Screen>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: space.xxl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  logoLetter: { fontSize: 32, lineHeight: 40 },
  brand: { marginBottom: space.sm },
  lead: { marginBottom: space.xxl, fontSize: 15, lineHeight: 22 },
  fieldLabel: { marginBottom: space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    marginBottom: space.lg,
    gap: space.sm,
  },
  prefix: { fontSize: 15 },
  prefixDivider: { width: 1, height: 22, backgroundColor: palette.line, marginHorizontal: 4 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
  hint: { marginTop: space.sm, marginBottom: space.xl, paddingHorizontal: 6 },
  error: { marginTop: -6, marginBottom: space.md },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
    paddingHorizontal: 4,
  },
  spacer: { flex: 1, minHeight: space.xxl },
  footer: { lineHeight: 20 },
  demo: { marginTop: space.md, fontSize: 11 },
  server: { marginTop: space.md, alignSelf: 'center' },
});
