/**
 * Live check against the partner_app backend: signs in, lets the stores hydrate
 * from the API and renders the screens on that data.
 *
 * It needs the backend running (npm start in D:\projects\multivendor_backend)
 * with the demo seed applied. When the server is not reachable the whole file is
 * skipped, so `npm test` still passes on a machine with no backend.
 *
 *   PARTNER_API=http://localhost:2407 npx jest live-api
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { apiClient, setBaseUrl } from '../src/api';
import { ToastProvider } from '../src/components';
import { DeliveryStoreProvider, useDelivery } from '../src/data/deliveryStore';
import { SessionProvider, useSession } from '../src/data/session';
import { VendorStoreProvider, useVendor } from '../src/data/vendorStore';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { PartnerHomeScreen } from '../src/features/delivery/home/PartnerHomeScreen';
import { RequestsScreen } from '../src/features/delivery/requests/RequestsScreen';
import { PartnerEarningsScreen } from '../src/features/delivery/earnings/EarningsScreens';
import { EarningsScreen } from '../src/features/vendor/earnings/EarningsScreen';
import { MenuScreen } from '../src/features/vendor/menu/MenuScreen';
import { OrdersScreen } from '../src/features/vendor/orders/OrdersScreen';
import { VendorHomeScreen } from '../src/features/vendor/home/VendorHomeScreen';
import type { Role } from '../src/domain/types';
import { ThemeProvider } from '../src/theme';

// This file talks to the real API, so the demo-mode default is turned off.
jest.mock('@config/constants', () => ({
  ...jest.requireActual('@config/constants'),
  USE_MOCK_DATA: false,
  POLL_INTERVAL_MS: 600_000,
}));

// Overridable from the shell; `process` is not in the app's type environment.
const env: Record<string, string | undefined> = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const BASE = env.PARTNER_API || 'http://localhost:2407';
const MOBILE = env.PARTNER_MOBILE || '9840721536';
const PASSWORD = env.PARTNER_PASSWORD || '123456';

let reachable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/partner_app/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: MOBILE, password: PASSWORD, role: 'vendor' }),
    });
    const payload = await res.json();
    reachable = payload.status === 200;
    if (!reachable) {
      console.warn(`live-api: ${BASE} answered ${payload.status} ${payload.message ?? ''} — tests skipped`);
    }
  } catch {
    console.warn(`live-api: no backend at ${BASE} — tests skipped`);
  }
  await setBaseUrl(BASE);
});

const Stack = createNativeStackNavigator();

/** Signs in, waits for the first state response, then renders the screen inside
 *  the themed shell the app uses (so the tenant's colours apply here too). */
function SignedIn({ role, ready, children }: { role: Role; ready: { done: boolean }; children: React.ReactNode }) {
  const { session, signInWithPassword, branding } = useSession();
  const vendor = useVendor();
  const delivery = useDelivery();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!tried) {
      setTried(true);
      signInWithPassword(MOBILE, PASSWORD, role);
    }
  }, [tried, signInWithPassword, role]);

  const loaded = role === 'vendor' ? vendor.state.loaded : delivery.state.loaded;
  const shown = Boolean(session) && loaded;
  ready.done = shown;
  return shown ? (
    <ThemeProvider role={role} brand={branding}>
      {children}
    </ThemeProvider>
  ) : null;
}

/** The sign-in screen renders before anyone is signed in. */
function SignedOut({ ready, children }: { ready: { done: boolean }; children: React.ReactNode }) {
  const { restoring, branding } = useSession();
  ready.done = !restoring;
  return restoring ? null : (
    <ThemeProvider role="vendor" brand={branding}>
      {children}
    </ThemeProvider>
  );
}

async function renderLive(Component: React.ComponentType<any>, role: Role, params?: object, signedOut = false) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  const ready = { done: false };
  // Each render starts signed out: the client keeps its token for the whole
  // file, so a token left by an earlier test would restore the wrong workspace.
  await apiClient.setAuthToken(null);
  const screen = (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Test" component={Component} initialParams={params} />
      </Stack.Navigator>
    </NavigationContainer>
  );
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ToastProvider>
        <SessionProvider>
          <VendorStoreProvider>
            <DeliveryStoreProvider>
              {signedOut ? (
                <SignedOut ready={ready}>{screen}</SignedOut>
              ) : (
                <SignedIn role={role} ready={ready}>
                  {screen}
                </SignedIn>
              )}
            </DeliveryStoreProvider>
          </VendorStoreProvider>
        </SessionProvider>
      </ToastProvider>,
    );
  });
  // Sign-in and the first state response take a moment against a real server.
  for (let i = 0; i < 40 && !ready.done; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 250));
    });
  }
  const text = JSON.stringify(tree.toJSON());
  await ReactTestRenderer.act(async () => tree.unmount());
  return text;
}

/** Rendering against a real server is slower than the 5 s default. */
const live = (name: string, fn: () => Promise<void>) =>
  test(
    name,
    async () => {
      if (!reachable) {
        return;
      }
      await fn();
    },
    30000,
  );

describe('vendor screens on live data', () => {
  live('home shows the signed-in store', async () => {
    const out = await renderLive(VendorHomeScreen, 'vendor');
    expect(out).toContain('Kitchen');
    expect(out).toMatch(/Accepting orders|Not accepting/);
  });

  live('orders come from the database', async () => {
    const out = await renderLive(OrdersScreen, 'vendor', { tab: 'new' });
    expect(out).toContain('VK-');
  });

  live('menu lists the products', async () => {
    const out = await renderLive(MenuScreen, 'vendor');
    expect(out).toContain('Biryani');
  });

  live('earnings show the month', async () => {
    const out = await renderLive(EarningsScreen, 'vendor');
    expect(out).toMatch(/₹/);
  });
});

describe('delivery screens on live data', () => {
  live('home shows the signed-in partner', async () => {
    const out = await renderLive(PartnerHomeScreen, 'delivery');
    expect(out).toContain('Ravi');
  });

  live('requests come from the database', async () => {
    const out = await renderLive(RequestsScreen, 'delivery');
    expect(out).toMatch(/VK-|No requests/);
  });

  live('earnings show this week', async () => {
    const out = await renderLive(PartnerEarningsScreen, 'delivery');
    expect(out).toContain('This week');
  });
});

describe('theming from the backend', () => {
  const picked = async () => {
    const res = await fetch(`${BASE}/partner_app/getbranding`).then(r => r.json());
    return res.branding?.vendor ?? null;
  };

  live('the sign-in screen uses the tenant colour', async () => {
    const vendor = await picked();
    if (!vendor) {
      console.warn('live-api: no tenant_branding rows — theming check skipped');
      return;
    }
    const out = await renderLive(LoginScreen, 'vendor', undefined, true);
    expect(out.toLowerCase()).toContain(vendor.accent.toLowerCase());
  });

  live('the vendor shell uses the tenant colour', async () => {
    const vendor = await picked();
    if (!vendor) {
      return;
    }
    const out = await renderLive(VendorHomeScreen, 'vendor');
    expect(out.toLowerCase()).toContain(vendor.accent.toLowerCase());
  });
});
