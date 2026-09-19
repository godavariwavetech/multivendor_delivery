/**
 * Smoke test: every screen mounts inside the real providers without throwing, and
 * shows its key content. Stage- and category-dependent screens are reached by
 * running store actions first, the same way the UI does.
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ToastProvider } from '../src/components';
import { DeliveryStoreProvider, useDelivery } from '../src/data/deliveryStore';
import { SessionProvider, useSession } from '../src/data/session';
import { SupportProvider } from '../src/data/support';
import { VendorStoreProvider, useVendor } from '../src/data/vendorStore';
import { ForgotPasswordScreen } from '../src/features/auth/ForgotPasswordScreen';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { OtpScreen } from '../src/features/auth/OtpScreen';
import { ResetPasswordScreen } from '../src/features/auth/ResetPasswordScreen';
import { ActiveScreen } from '../src/features/delivery/active/ActiveScreen';
import {
  DeliveryFailedScreen,
  DeliveryOtpScreen,
  PickupCodeScreen,
  ProofPhotoScreen,
} from '../src/features/delivery/active/TripScreens';
import {
  HistoryScreen,
  PartnerEarningsScreen,
  StatementScreen,
  TripDetailScreen,
} from '../src/features/delivery/earnings/EarningsScreens';
import { PartnerHomeScreen } from '../src/features/delivery/home/PartnerHomeScreen';
import { KycScreen, PartnerProfileScreen, VehicleScreen, ZoneShiftScreen } from '../src/features/delivery/profile/ProfileScreens';
import { IncomingRequestScreen } from '../src/features/delivery/requests/IncomingRequestScreen';
import { RequestsScreen } from '../src/features/delivery/requests/RequestsScreen';
import { BankAccountScreen } from '../src/features/shared/BankAccountScreen';
import { HelpScreen, NotificationsScreen, PrivacyScreen, ReportProblemScreen } from '../src/features/shared/SharedScreens';
import { CouponEditScreen } from '../src/features/vendor/coupons/CouponEditScreen';
import { CouponsScreen } from '../src/features/vendor/coupons/CouponsScreen';
import { EarningsScreen } from '../src/features/vendor/earnings/EarningsScreen';
import { ReportsScreen } from '../src/features/vendor/earnings/ReportsScreen';
import { SettlementDetailScreen } from '../src/features/vendor/earnings/SettlementDetailScreen';
import { VendorHomeScreen } from '../src/features/vendor/home/VendorHomeScreen';
import { MenuScreen } from '../src/features/vendor/menu/MenuScreen';
import { OutOfStockScreen } from '../src/features/vendor/menu/OutOfStockScreen';
import { ProductEditScreen } from '../src/features/vendor/menu/ProductEditScreen';
import { RateSheetScreen } from '../src/features/vendor/menu/RateSheetScreen';
import { TimingsScreen } from '../src/features/vendor/menu/TimingsScreen';
import { AcceptOrderScreen } from '../src/features/vendor/orders/AcceptOrderScreen';
import { HandoverScreen } from '../src/features/vendor/orders/HandoverScreen';
import { OrderDetailScreen } from '../src/features/vendor/orders/OrderDetailScreen';
import { OrdersScreen } from '../src/features/vendor/orders/OrdersScreen';
import { RejectOrderScreen } from '../src/features/vendor/orders/RejectOrderScreen';
import { DocumentsScreen, StoreDetailsScreen } from '../src/features/vendor/profile/StoreScreens';
import { VendorProfileScreen } from '../src/features/vendor/profile/VendorProfileScreen';
import type { Role } from '../src/domain/types';
import { ThemeProvider } from '../src/theme';

type Stores = {
  vendor: ReturnType<typeof useVendor>;
  delivery: ReturnType<typeof useDelivery>;
  session: ReturnType<typeof useSession>;
};

/** Runs store actions once, then renders the screen. */
function Script({ run, children }: { run?: (s: Stores) => void | Promise<void>; children: React.ReactNode }) {
  const vendor = useVendor();
  const delivery = useDelivery();
  const session = useSession();
  const [ready, setReady] = useState(!run);
  useEffect(() => {
    if (run) {
      run({ vendor, delivery, session });
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ready ? <>{children}</> : null;
}

const Stack = createNativeStackNavigator();

async function renderScreen(
  Component: React.ComponentType<any>,
  { role = 'vendor', params, run }: { role?: Role; params?: object; run?: (s: Stores) => void | Promise<void> } = {},
) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <SessionProvider>
        <SupportProvider signedIn={false}>
          <VendorStoreProvider>
            <DeliveryStoreProvider>
              <ThemeProvider role={role}>
                <ToastProvider>
                  <Script run={run}>
                    <NavigationContainer>
                      <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Test" component={Component} initialParams={params} />
                      </Stack.Navigator>
                    </NavigationContainer>
                  </Script>
                </ToastProvider>
              </ThemeProvider>
            </DeliveryStoreProvider>
          </VendorStoreProvider>
        </SupportProvider>
      </SessionProvider>,
    );
  });
  const text = JSON.stringify(tree.toJSON());
  await ReactTestRenderer.act(async () => tree.unmount());
  return text;
}

beforeAll(() => {
  jest.useFakeTimers();
});
afterAll(() => {
  jest.useRealTimers();
});

describe('auth', () => {
  test.each([
    ['Login', LoginScreen, undefined, 'ekart360-logo'], // the wordmark image renders
    ['OTP', OtpScreen, { mobile: '9840721536', purpose: 'login' }, 'Verify your number'],
    ['Forgot password', ForgotPasswordScreen, undefined, 'Reset password'],
    ['Reset password', ResetPasswordScreen, { mobile: '9840721536' }, 'New password'],
  ] as const)('%s', async (_, C, params, expected) => {
    expect(await renderScreen(C, { params })).toContain(expected);
  });

  test('Login offers workspace tabs', async () => {
    const out = await renderScreen(LoginScreen);
    expect(out).toContain('"tablist"');
    expect(out).toContain('Delivery partner');
    expect(out).toContain('Sign in as Vendor');
  });

  test('accents follow the selected workspace tab', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <SessionProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SessionProvider>,
      );
    });
    /**
     * The logo is the brand wordmark and never recolours, so the accent is read
     * off the sign-in button — the one button on this screen.
     */
    const signInColor = () => {
      const button = tree.root.findAll(n => n.props.accessibilityRole === 'button').pop();
      const styles = [button?.props.style].flat(Infinity) as ({ backgroundColor?: string } | null)[];
      return styles.map(s => s?.backgroundColor).filter(Boolean).pop();
    };
    expect(signInColor()).toBe('#1D44B5'); // vendor blue, from the logo

    const tabs = tree.root.findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function');
    await ReactTestRenderer.act(async () => tabs[tabs.length - 1].props.onPress());
    expect(signInColor()).toBe('#098D11'); // delivery green, from the logo
    expect(JSON.stringify(tree.toJSON())).toContain('Sign in as Partner');

    await ReactTestRenderer.act(async () => tree.unmount());
  });

  test('workspace must be one the account holds', async () => {
    const results: { ok: boolean }[] = [];
    await renderScreen(LoginScreen, {
      run: async s => {
        results.push(await s.session.signInWithPassword('9840700001', 'amma2024', 'delivery')); // vendor-only number
        results.push(await s.session.signInWithPassword('9840700002', 'amma2024', 'vendor')); // partner-only number
        results.push(await s.session.signInWithPassword('9840721536', 'amma2024', 'delivery')); // dual-role number
        results.push(await s.session.requestOtp('9840721536', 'vendor', 'login'));
      },
    });
    expect(results.map(r => r.ok)).toEqual([false, false, true, true]);
  });
});

describe('vendor', () => {
  test.each([
    ['Home', VendorHomeScreen, undefined, 'Accepting orders'],
    ['Orders · new', OrdersScreen, { tab: 'new' }, 'VK-2841'],
    ['Orders · cooking', OrdersScreen, { tab: 'cooking' }, 'Mark ready'],
    ['Orders · ready', OrdersScreen, { tab: 'ready' }, 'at counter'],
    ['Orders · past', OrdersScreen, { tab: 'past' }, 'Delivered'],
    ['Order detail · new', OrderDetailScreen, { id: 'VK-2841' }, 'Accept & start preparing'],
    ['Order detail · cooking', OrderDetailScreen, { id: 'VK-2839' }, 'Mark ready'],
    ['Order detail · cancelled', OrderDetailScreen, { id: 'VK-2826' }, 'refunded'],
    ['Accept order', AcceptOrderScreen, { id: 'VK-2841' }, 'Prep time you promise'],
    ['Reject order', RejectOrderScreen, { id: 'VK-2841' }, 'Kitchen overloaded'],
    ['Handover', HandoverScreen, { id: 'VK-2836' }, '5192'],
    ['Menu', MenuScreen, undefined, 'Chicken Biryani'],
    ['Edit food item', ProductEditScreen, { id: 'f-biryani' }, 'Spice level choice'],
    ['New dish', ProductEditScreen, {}, 'New dish'],
    ['Out of stock', OutOfStockScreen, undefined, 'Mutton Chukka'],
    ['Timings', TimingsScreen, undefined, 'Store hours'],
    ['Coupons', CouponsScreen, undefined, 'EKART50'],
    ['Edit coupon', CouponEditScreen, { code: 'DINNER20' }, 'Max discount'],
    ['New coupon', CouponEditScreen, {}, 'New coupon'],
    ['Earnings', EarningsScreen, undefined, 'Net payable'],
    ['Reports', ReportsScreen, undefined, 'Download CSV'],
    ['Settlement', SettlementDetailScreen, { id: 'st-0907' }, '429188341'],
    ['Refund', SettlementDetailScreen, { id: 'rf-2831' }, 'Linked to original payment'],
    ['Store details', StoreDetailsScreen, undefined, 'Address'],
    ['Documents', DocumentsScreen, undefined, 'FSSAI licence'],
    ['Profile', VendorProfileScreen, undefined, 'FSSAI & GST documents'],
    ['Bank account', BankAccountScreen, { role: 'vendor' }, 'HDFC Bank'],
  ] as const)('%s', async (_, C, params, expected) => {
    expect(await renderScreen(C, { params })).toContain(expected);
  });

  test('a new item opens straight into the details form', async () => {
    const out = await renderScreen(ProductEditScreen, { params: {} });
    expect(out).toContain('New item'); // the form, not the read-only header
    expect(out).toContain('Food type');
    expect(out).toContain('+ Add variant');
  });

  test('an existing item shows its details, with the form behind the edit button', async () => {
    const out = await renderScreen(ProductEditScreen, { params: { id: 'f-biryani' } });
    expect(out).toContain('Chicken Biryani');
    expect(out).not.toContain('Food type'); // collapsed until the pencil is tapped
  });

  test.each([
    ['grocery', 'g-sambar', 'Pack sizes'],
    ['bakery', 'b-butterscotch', 'Fresh batch'],
    ['meat', 'm-chicken', 'Packing rule sent to partner'],
  ] as const)('product sheet · %s', async (category, id, expected) => {
    const out = await renderScreen(ProductEditScreen, { params: { id }, run: s => s.vendor.actions.setCategory(category) });
    expect(out).toContain(expected);
  });

  test('produce rate sheet', async () => {
    const out = await renderScreen(RateSheetScreen, { run: s => s.vendor.actions.setCategory('produce') });
    expect(out).toContain('Rates not published for today');
  });

  test('grocery menu says Packing', async () => {
    const out = await renderScreen(OrdersScreen, { params: { tab: 'cooking' }, run: s => s.vendor.actions.setCategory('grocery') });
    expect(out).toContain('Packing');
  });
});

describe('delivery', () => {
  const opts = (extra: object = {}) => ({ role: 'delivery' as const, ...extra });

  test.each([
    ['Home', PartnerHomeScreen, undefined, "You're online"],
    ['Requests', RequestsScreen, undefined, 'Hotel Saravana'],
    ['Incoming request', IncomingRequestScreen, { id: 'VK-2853' }, 'Grocery pickup'],
    ['Active · on the way', ActiveScreen, undefined, 'Slide to mark arrived'],
    ['Pickup code', PickupCodeScreen, undefined, 'handover code'],
    ['Delivery OTP', DeliveryOtpScreen, undefined, '4-digit OTP'],
    ['Proof photo', ProofPhotoScreen, undefined, 'Proof of delivery'],
    ['Delivery failed', DeliveryFailedScreen, undefined, 'Customer unavailable'],
    ['Earnings', PartnerEarningsScreen, undefined, 'How it adds up'],
    ['Statement', StatementScreen, undefined, 'Weekly payouts'],
    ['Trip detail', TripDetailScreen, { id: 'VK-2829' }, 'Verified by'],
    ['History', HistoryScreen, undefined, 'Delivery history'],
    ['Profile', PartnerProfileScreen, undefined, 'Documents & KYC'],
    ['Vehicle', VehicleScreen, undefined, 'TN 09 BX 4412'],
    ['KYC', KycScreen, undefined, 'Aadhaar'],
    ['Zone & shift', ZoneShiftScreen, undefined, 'Preferred shift'],
    ['Bank account', BankAccountScreen, { role: 'delivery' }, 'State Bank of India'],
  ] as const)('%s', async (_, C, params, expected) => {
    expect(await renderScreen(C, opts({ params }))).toContain(expected);
  });

  test('to the store', async () => {
    const out = await renderScreen(ActiveScreen, opts({ run: (s: Stores) => { s.delivery.actions.finish(); s.delivery.actions.accept('VK-2841'); } }));
    expect(out).toContain('Slide when you reach the store');
  });

  test.each([
    ['VK-2841', 'Confirm before you leave'],
    ['VK-2853', 'Bag tally'],
    ['VK-2861', 'Weighed at store'],
    ['VK-2874', 'Handling checklist'],
    ['VK-2888', 'Cold chain order'],
  ])('pickup handling · %s', async (id, expected) => {
    const out = await renderScreen(
      ActiveScreen,
      opts({
        run: (s: Stores) => {
          s.delivery.actions.finish();
          s.delivery.actions.accept(id);
          s.delivery.actions.reachStore();
        },
      }),
    );
    expect(out).toContain(expected);
  });

  test('trip complete', async () => {
    const out = await renderScreen(ActiveScreen, opts({ run: async (s: Stores) => {
          s.delivery.actions.arrived();
          await s.delivery.actions.complete('7241');
        } }));
    expect(out).toContain('Earned on this trip');
    expect(out).toContain('How was the store handover?');
  });

  test('no active trip', async () => {
    const out = await renderScreen(ActiveScreen, opts({ run: (s: Stores) => s.delivery.actions.finish() }));
    expect(out).toContain('No active delivery');
  });
});

describe('shared', () => {
  test.each(['vendor', 'delivery'] as const)('shared screens · %s', async role => {
    expect(await renderScreen(NotificationsScreen, { role })).toContain('Notifications');
    expect(await renderScreen(HelpScreen, { role })).toContain('Common questions');
    expect(await renderScreen(ReportProblemScreen, { role })).toContain('Submit report');
    expect(await renderScreen(PrivacyScreen, { role })).toContain('Delete account');
  });
});
