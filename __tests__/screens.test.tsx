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
import { storage } from '../src/api/storage';
import type { Order, Role } from '../src/domain/types';
import { ThemeProvider } from '../src/theme';
import { seedOrders } from '../src/data/demo/orders';
import { ProductPhoto } from '../src/features/vendor/menu/ProductPhoto';
import { OrderRow } from '../src/features/vendor/orders/OrderCards';
import { formatAmount } from '../src/utils/currency';

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
  {
    role = 'vendor',
    params,
    run,
    interact,
  }: {
    role?: Role;
    params?: object;
    run?: (s: Stores) => void | Promise<void>;
    /** Taps things on the mounted tree before it is read back. */
    interact?: (root: ReactTestRenderer.ReactTestInstance) => void | Promise<void>;
  } = {},
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
  if (interact) {
    // Not wrapped in one act: each press in `interact` is its own act, so the tree
    // re-renders between presses and the next lookup sees the new handlers.
    await interact(tree.root);
  }
  // Props can carry context objects (some with throwing getters); only text, styles and plain props are read.
  const plain = (node: ReactTestRenderer.ReactTestRendererNode | null): unknown => {
    if (node === null || typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(plain);
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.props ?? {})) {
      if (k === 'style' || k === 'source' || ['string', 'number', 'boolean'].includes(typeof v)) props[k] = v;
    }
    return { type: node.type, props, children: (node.children ?? []).map(c => plain(c as ReactTestRenderer.ReactTestRendererNode)) };
  };
  const text = JSON.stringify(plain(tree.toJSON() as ReactTestRenderer.ReactTestRendererNode | null));
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
        results.push(await s.session.signInWithPassword('9840700005', 'amma2024', 'vendor')); // partner-only number
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
    ['Handover', HandoverScreen, { id: 'VK-2836' }, 'Ask the partner for the code'],
    ['Menu', MenuScreen, undefined, 'Paneer Butter Masala'], // the menu opens on the veg view
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

  test('the store types the partner’s code to hand over, it does not show its own', async () => {
    const out = await renderScreen(HandoverScreen, { params: { id: 'VK-2836' } });
    expect(out).toContain('Ask the partner for the code');
    expect(out).not.toContain('5192');
  });

  test('a new item opens straight into the details form', async () => {
    const out = await renderScreen(ProductEditScreen, { params: {} });
    expect(out).toContain('New item'); // the form, not the read-only header
    expect(out).toContain('Category');
    expect(out).toContain('Sub category');
    expect(out).toContain('Veg / Non-veg'); // a dish is veg or non-veg
    expect(out).toContain('+ Add variant');
  });

  test('grocery items pick a category and sub category, and are not asked veg / non-veg', async () => {
    const out = await renderScreen(ProductEditScreen, { params: {}, run: s => s.vendor.actions.setCategory('grocery') });
    expect(out).toContain('Sub category');
    expect(out).toContain('Masala & spices'); // the first category is preselected
    expect(out).not.toContain('Veg / Non-veg');
    expect(out).not.toContain('Food type');
  });

  test('clearing the category with the × also empties the sub category', async () => {
    const out = await renderScreen(ProductEditScreen, {
      params: {},
      run: s => s.vendor.actions.setCategory('grocery'),
      interact: async root => {
        const clear = root.findAll(n => n.props.accessibilityLabel === 'Clear Category' && typeof n.props.onPress === 'function');
        await ReactTestRenderer.act(async () => clear[0].props.onPress());
      },
    });
    expect(out).toContain('Select category');
    expect(out).toContain('None available'); // with no category there is nothing to pick a sub category from
    expect(out).not.toContain('Masala & spices');
  });

  test('saving with the category cleared asks for one instead of saving', async () => {
    const hasText = (n: ReactTestRenderer.ReactTestInstance, text: string) =>
      n.findAll(c => (c.children as unknown[]).includes(text)).length > 0;
    const out = await renderScreen(ProductEditScreen, {
      params: {},
      run: s => s.vendor.actions.setCategory('grocery'),
      interact: async root => {
        const clear = root.findAll(n => n.props.accessibilityLabel === 'Clear Category' && typeof n.props.onPress === 'function');
        await ReactTestRenderer.act(async () => clear[0].props.onPress());
        const save = root.findAll(
          n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && hasText(n, 'Save product'),
        );
        await ReactTestRenderer.act(async () => save[0].props.onPress());
      },
    });
    expect(out).toContain('Pick a category first');
    expect(out).toContain('New item'); // still on the form, not navigated away
  });

  test('an existing item shows its details, with the form behind the edit button', async () => {
    const out = await renderScreen(ProductEditScreen, { params: { id: 'f-biryani' } });
    expect(out).toContain('Chicken Biryani');
    expect(out).not.toContain('Sub category'); // collapsed until the pencil is tapped
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

  describe('order photos and amounts (VA-001, VA-002)', () => {
    const photos = (root: ReactTestRenderer.ReactTestInstance) => ({
      photos: root.findAllByType(ProductPhoto).length,
      placeholders: root.findAll(n => String(n.type) === 'View' && n.props.testID === 'order-thumb-placeholder').length,
    });
    const rows = (status: string) => seedOrders('food').filter(o => o.status === status);

    // Demo mode keeps edited dishes in storage; a rename here must not reach the next test.
    afterEach(() => storage.remove('partner.demo.products.v1'));

    test('delivered rows show the menu photo when the item is on the menu', async () => {
      let seen = { photos: 0, placeholders: 0 };
      await renderScreen(OrdersScreen, { params: { tab: 'delivered' }, interact: root => void (seen = photos(root)) });
      expect(seen.photos).toBe(rows('delivered').length);
      expect(seen.placeholders).toBe(0);
    });

    test('a dish renamed after the order is still found by its product id', async () => {
      let seen = { photos: 0, placeholders: 0 };
      await renderScreen(OrdersScreen, {
        params: { tab: 'delivered' },
        run: s => {
          const line = rows('delivered')[0].lines[0];
          const dish = s.vendor.state.products.find(p => p.id === line.productId)!;
          s.vendor.actions.saveProduct({ ...dish, name: 'Renamed dish' });
        },
        interact: root => void (seen = photos(root)),
      });
      expect(seen.photos).toBe(1);
      expect(seen.placeholders).toBe(0);
    });

    describe('a row built from its own line data', () => {
      const base = rows('delivered')[0];
      const withLine = (line: Partial<Order['lines'][number]>): Order => ({ ...base, lines: [{ ...base.lines[0], productId: undefined, ...line }] });
      const show = async (order: Order) => {
        let seen = { photos: 0, placeholders: 0, images: [] as string[] };
        await renderScreen(() => <OrderRow order={order} workLabel="Cooking" onPress={() => {}} />, {
          interact: root => {
            seen = {
              ...photos(root),
              images: root.findAll(n => n.props.testID === 'order-thumb-image' && String(n.type) !== 'Image').map(n => n.props.source.uri),
            };
          },
        });
        return seen;
      };

      test('a dish no longer on the menu shows the photo sent with the line', async () => {
        const seen = await show(withLine({ productId: '999999', name: 'Gone dish', image: '/uploads/partner_app/gone.jpg' }));
        expect(seen.photos).toBe(0);
        expect(seen.placeholders).toBe(0);
        expect(seen.images).toHaveLength(1);
        expect(seen.images[0]).toMatch(/\/uploads\/partner_app\/gone\.jpg$/);
      });

      test('a dish no longer on the menu with no photo shows the placeholder', async () => {
        const seen = await show(withLine({ productId: '999999', name: 'Gone dish', image: null }));
        expect(seen.placeholders).toBe(1);
        expect(seen.photos).toBe(0);
      });

      test('a line whose name matches a menu dish but whose id does not is not given that dish’s photo', async () => {
        const dishName = base.lines[0].name;
        const seen = await show(withLine({ productId: '999999', name: dishName, image: null }));
        expect(seen.photos).toBe(0);
        expect(seen.placeholders).toBe(1);
      });

      test('a line with no id (older backend) still falls back to the dish name', async () => {
        const seen = await show(withLine({ name: base.lines[0].name }));
        expect(seen.photos).toBe(1);
        expect(seen.placeholders).toBe(0);
      });

      test('an order with no lines shows the placeholder', async () => {
        const seen = await show({ ...base, lines: [] });
        expect(seen.placeholders).toBe(1);
      });
    });

    test('Home new-order cards carry no per-order amount, but keep the payment type', async () => {
      const first = rows('new')[0];
      const out = await renderScreen(VendorHomeScreen);
      expect(out).toContain(first.id);
      expect(out).not.toContain(formatAmount(first.total));
      expect(out).toContain('Prepaid');
    });

    test('the Orders tab still shows amounts for new, ready and delivered orders', async () => {
      for (const [tab, status] of [['new', 'new'], ['ready', 'ready'], ['delivered', 'delivered']] as const) {
        const out = await renderScreen(OrdersScreen, { params: { tab } });
        expect(out).toContain(formatAmount(rows(status)[0].total));
      }
    });

    test('Home keeps the Today earnings card', async () => {
      const out = await renderScreen(VendorHomeScreen);
      expect(out).toContain('Today');
      expect(out).toMatch(/orders · avg/);
    });

    test('cancelled and rejected rows keep their amount in Old and are not on Home', async () => {
      const out = await renderScreen(OrdersScreen, { params: { tab: 'past' } });
      for (const o of [...rows('cancelled'), ...rows('rejected')]) expect(out).toContain(formatAmount(o.total));
      const home = await renderScreen(VendorHomeScreen);
      for (const o of [...rows('cancelled'), ...rows('rejected')]) expect(home).not.toContain(o.id);
    });
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
    ['Pickup code', PickupCodeScreen, undefined, 'Show this code to the vendor'],
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

  describe('reporting a delivery as failed (DA-001, DA-003)', () => {
    const labelOf = (node: ReactTestRenderer.ReactTestInstance): string =>
      node.children.map(c => (typeof c === 'string' ? c : labelOf(c))).join('');

    test('the Active tab shows "No active delivery" after a failed delivery is reported', async () => {
      const out = await renderScreen(ActiveScreen, opts({ run: (s: Stores) => s.delivery.actions.fail('Customer unavailable') }));
      expect(out).toContain('No active delivery');
    });

    test('Report & return order submits without crashing and closes the trip', async () => {
      let latest!: ReturnType<typeof useDelivery>;
      const Probe = () => {
        latest = useDelivery();
        return <DeliveryFailedScreen />;
      };
      const press = async (root: ReactTestRenderer.ReactTestInstance, label: string) => {
        const target = root.findAll(n => typeof n.props.onPress === 'function' && labelOf(n).includes(label))[0];
        expect(target).toBeDefined();
        await ReactTestRenderer.act(async () => target.props.onPress());
      };
      await renderScreen(Probe, opts({
        interact: async (root: ReactTestRenderer.ReactTestInstance) => {
          expect(latest.activeRequest).toBeDefined();
          await press(root, 'Skip wait (demo)');
          await press(root, 'Customer unavailable');
          await press(root, 'Report & return order');
          expect(latest.activeRequest).toBeUndefined();
          expect(latest.state.trips[0].status).toBe('cancelled');
          expect(latest.state.trips[0].note).toBe('customer unavailable');
        },
      }));
    });

    test('a failed trip is not left as the active one, so the partner can take the next request', async () => {
      let latest!: ReturnType<typeof useDelivery>;
      const Probe = () => {
        latest = useDelivery();
        return null;
      };
      await renderScreen(Probe, opts({
        run: (s: Stores) => s.delivery.actions.fail('Customer unavailable'),
        interact: () => {
          expect(latest.state.active).toBeUndefined();
          expect(latest.openRequests.length).toBeGreaterThan(0);
        },
      }));
    });
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
