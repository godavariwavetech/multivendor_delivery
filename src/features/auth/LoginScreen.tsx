import { Bike, CircleAlert, Store } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, LinkButton, Screen, SegmentOption, SegmentedTabs, Text } from '@/components';
import { USE_MOCK_DATA } from '@config/constants';
import { useSession } from '@/data/session';
import type { Role } from '@/domain/types';
import { useAuthNav } from '@/navigation/types';
import { ThemeProvider, fonts, palette, radius, roleColorsFrom, space } from '@/theme';
import { formatMobile, mobileDigits, mobileHasExtraDigits, mobileIssue } from '@/utils/mobile';

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
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  // Set while the last keystroke or paste had more than 10 digits.
  const [extraDigits, setExtraDigits] = useState(false);

  const digits = mobileDigits(mobile);
  const mobileMessage = mobileIssue(digits, extraDigits);

  /** Why this number cannot be used yet, for the sign-in and OTP buttons. */
  const mobileBlocker = () => mobileMessage ?? (digits.length !== 10 ? 'Enter your 10-digit mobile number.' : null);

  const submit = async () => {
    if (busy) {
      return;
    }
    const blocker = mobileBlocker();
    if (blocker) {
      setError(blocker);
      return;
    }
    setBusy(true);
    const result = await signInWithPassword(digits, password, role);
    setBusy(false);
    setError(result.ok ? null : result.error);
  };

  const useOtp = async () => {
    const blocker = mobileBlocker();
    if (blocker) {
      setError(blocker);
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
        {/* The full wordmark carries the brand here, so the heading only names the app. */}
        <Image source={require('@/assets/images/ekart360-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text v="hero" style={styles.brand} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          Partner
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
        <View style={[styles.field, mobileMessage ? styles.fieldInvalid : null]}>
          <TextInput
            value={mobile}
            onChangeText={v => {
              setMobile(formatMobile(v));
              setExtraDigits(mobileHasExtraDigits(v));
              setError(null);
              // The 10th digit completes a usable number, so carry on to the password.
              const next = mobileDigits(v);
              if (digits.length < 10 && next.length === 10 && !mobileIssue(next, mobileHasExtraDigits(v))) {
                passwordRef.current?.focus();
              }
            }}
            keyboardType="number-pad"
            // Once the 10 digits are in, the field itself refuses more (11 = "98407 21536"),
            // so no extra digit flashes up before being taken out. Until then a pasted
            // "+91 …" is not cut short.
            maxLength={digits.length >= 10 ? 11 : undefined}
            onKeyPress={e => {
              // A refused digit raises no text change, so the key press is how the message is shown.
              if (digits.length >= 10 && /^\d$/.test(e.nativeEvent.key)) {
                setExtraDigits(true);
              }
            }}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={styles.input}
            placeholder="98407 21536"
            placeholderTextColor={palette.inkSubtle}
          />
          {mobileMessage ? <CircleAlert size={20} color={palette.alert} /> : null}
        </View>

        {mobileMessage ? (
          <Text v="caption" color={palette.alert} style={styles.fieldError}>
            {mobileMessage}
          </Text>
        ) : null}

        <Text v="bodyStrong" style={styles.fieldLabel}>
          Password
        </Text>
        <View style={styles.field}>
          <TextInput
            ref={passwordRef}
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
          <Text v="caption" color={palette.alert} style={styles.error}>
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
          variant={role === 'vendor' ? 'blue' : 'green'}
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
  // 00.png is 513×132. Held to that ratio and capped, so a narrow screen
  // shrinks it instead of letting it run past the gutter.
  logo: { width: '100%', maxWidth: 233, aspectRatio: 513 / 132, marginBottom: space.xl },
  brand: { marginBottom: space.sm },
  lead: { marginBottom: space.xxl, fontSize: 15, lineHeight: 22 },
  fieldLabel: { marginBottom: space.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.xl,
    marginBottom: space.lg,
    gap: space.sm,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: palette.ink, paddingVertical: 0 },
  hint: { marginTop: space.sm, marginBottom: space.xl, paddingHorizontal: 6 },
  error: { marginTop: -6, marginBottom: space.md },
  fieldInvalid: { borderColor: palette.alert, borderRadius: radius.sm },
  fieldError: { marginTop: -8, marginBottom: space.md, paddingHorizontal: 6 },
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
