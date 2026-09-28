import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { ApiError, apiClient, endpoints } from '@/api';
import { useToast } from '@/components';
import { POLL_INTERVAL_MS, USE_MOCK_DATA } from '@config/constants';
import type { Branding } from '@/theme';
import type {
  AppNotification,
  Category,
  Coupon,
  DailyBar,
  DayHours,
  Order,
  Product,
  ReportRows,
  Settlement,
  Store,
  StoreDetails,
  TodaySales,
  VendorEarnings,
} from '@/domain/types';

import { ASSIGNABLE_PARTNERS, makeIncomingOrder, seedOrders } from './demo/orders';
import { PRODUCTS } from './demo/products';
import { DAYPARTS, STORES, WEEKLY_HOURS } from './demo/stores';
import {
  COUPONS,
  DAILY_SALES,
  REPORT_ROWS,
  SETTLEMENTS,
  TODAY_SALES,
  VENDOR_EARNINGS,
  vendorNotifications,
} from './demo/vendorMisc';
import { useSession } from './session';

const LIVE = !USE_MOCK_DATA;

/** The slices that come from GET /getvendorstate. */
type ServerState = {
  store: Store;
  details?: StoreDetails;
  open: boolean;
  busyMode: boolean;
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
  settlements: Settlement[];
  earnings: VendorEarnings;
  today: TodaySales;
  dailySales: DailyBar[];
  reportRows: ReportRows;
  hours: DayHours[];
  notifications: AppNotification[];
  /** Saved on the account, not the device. */
  prefs: { orderNotifications: boolean };
  /** True only while today's produce rate sheet is the published one. */
  ratesPublished: boolean;
  allowSubstitution: boolean;
  /** The store's named service windows; exactly one is active. */
  dayparts: typeof DAYPARTS;
  /** The choices the Profile screens offer. */
};

type State = ServerState & {
  /** Demo mode switches the store category from Profile; live, it follows the store. */
  category: Category;
  loaded: boolean;
};

type Action =
  | { type: 'hydrate'; data: ServerState }
  | { type: 'toggleOpen' }
  | { type: 'setBusy'; on: boolean }
  | { type: 'accept'; id: string; prepMinutes: number }
  | { type: 'reject'; id: string; reason: string }
  | { type: 'addMinutes'; id: string; minutes: number }
  | { type: 'markReady'; id: string }
  | { type: 'handover'; id: string }
  | { type: 'simulateOrder' }
  | { type: 'setAvailable'; id: string; available: boolean }
  | { type: 'saveProduct'; product: Product }
  | { type: 'publishRates' }
  | { type: 'setSubstitution'; on: boolean }
  | { type: 'setCategory'; category: Category }
  | { type: 'toggleCoupon'; code: string }
  | { type: 'saveCoupon'; coupon: Coupon }
  | { type: 'setDaypart'; id: string }
  | { type: 'toggleDay'; day: string }
  | { type: 'setHours'; opening: string; closing: string }
  | { type: 'setPref'; key: keyof State['prefs']; value: boolean }
  | { type: 'readNotifications' };

const EMPTY_PERIOD = { label: '—', net: 0, gross: 0, orders: 0, commission: 0, coupon: 0 };

/** Shown for the moment between sign-in and the first response. */
const PLACEHOLDER_STORE: Store = {
  category: 'food',
  name: '—',
  initials: '',
  area: '',
  address: '',
  code: '',
  rating: 0,
  ratings: 0,
  hours: '',
  closesAt: '',
  service: '',
  bank: '',
  groups: [],
  itemNoun: 'item',
};

const DEMO_PREFS = { orderNotifications: true };
const shared = {
  ratesPublished: false,
  allowSubstitution: true,
  dayparts: DAYPARTS,
  prefs: DEMO_PREFS,
};

const demoInitial = (): State => ({
  ...shared,
  category: 'food',
  store: STORES.food,
  open: true,
  busyMode: false,
  orders: seedOrders('food'),
  products: PRODUCTS,
  coupons: COUPONS,
  settlements: SETTLEMENTS,
  earnings: VENDOR_EARNINGS,
  today: TODAY_SALES,
  dailySales: DAILY_SALES,
  reportRows: REPORT_ROWS,
  hours: WEEKLY_HOURS,
  notifications: vendorNotifications(),
  loaded: true,
});

const liveInitial = (): State => ({
  ...shared,
  category: 'food',
  store: PLACEHOLDER_STORE,
  open: false,
  busyMode: false,
  orders: [],
  products: [],
  coupons: [],
  settlements: [],
  earnings: { month: EMPTY_PERIOD, lastMonth: EMPTY_PERIOD, custom: EMPTY_PERIOD },
  today: { amount: 0, orders: 0, avg: 0, avgPrep: 0, bars: [] },
  dailySales: [],
  reportRows: { orders: [], sales: [], settlements: [] },
  hours: [],
  notifications: [],
  loaded: false,
});

const initial = (): State => (LIVE ? liveInitial() : demoInitial());

const updateOrder = (orders: Order[], id: string, patch: (o: Order) => Partial<Order>) =>
  orders.map(o => (o.id === id ? { ...o, ...patch(o) } : o));

const randomCode = () => String(1000 + Math.floor(Math.random() * 9000));

function reducer(state: State, action: Action): State {
  const now = Date.now();
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.data, category: action.data.store.category, loaded: true };
    case 'toggleOpen':
      return { ...state, open: !state.open };
    case 'setBusy':
      return { ...state, busyMode: action.on };
    case 'accept':
      return {
        ...state,
        orders: updateOrder(state.orders, action.id, o => ({
          status: 'cooking',
          acceptedAt: now,
          prepMinutes: action.prepMinutes + (state.busyMode ? 10 : 0),
          handoverCode: o.handoverCode ?? randomCode(),
          partner: LIVE
            ? o.partner
            : { ...ASSIGNABLE_PARTNERS[Math.floor(Math.random() * ASSIGNABLE_PARTNERS.length)], atCounter: false },
        })),
      };
    case 'reject':
      return {
        ...state,
        orders: updateOrder(state.orders, action.id, () => ({
          status: 'rejected',
          closedAt: now,
          closeNote: `Rejected · ${action.reason.toLowerCase()}`,
        })),
      };
    case 'addMinutes':
      return {
        ...state,
        orders: updateOrder(state.orders, action.id, o => ({ prepMinutes: (o.prepMinutes ?? 0) + action.minutes })),
      };
    case 'markReady':
      return {
        ...state,
        orders: updateOrder(state.orders, action.id, o => ({
          status: 'ready',
          readyAt: now,
          handoverCode: o.handoverCode ?? randomCode(),
          partner: LIVE ? o.partner : o.partner ? { ...o.partner, atCounter: true } : { ...ASSIGNABLE_PARTNERS[0], atCounter: true },
        })),
      };
    case 'handover':
      return {
        ...state,
        orders: updateOrder(state.orders, action.id, o => ({
          status: 'picked_up',
          closedAt: now,
          closeNote: `Picked up · ${o.partner?.name ?? 'partner'}`,
        })),
      };
    case 'simulateOrder':
      return { ...state, orders: [makeIncomingOrder(state.category), ...state.orders] };
    case 'setAvailable':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.id
            ? { ...p, available: action.available, stockLine: action.available ? 'Available' : 'Out of stock' }
            : p,
        ),
      };
    case 'saveProduct': {
      const exists = state.products.some(p => p.id === action.product.id);
      return {
        ...state,
        products: exists
          ? state.products.map(p => (p.id === action.product.id ? action.product : p))
          : [action.product, ...state.products],
      };
    }
    case 'publishRates':
      return { ...state, ratesPublished: true };
    case 'setSubstitution':
      return { ...state, allowSubstitution: action.on };
    case 'setCategory':
      return {
        ...state,
        category: action.category,
        store: STORES[action.category],
        orders: seedOrders(action.category),
        open: true,
        ratesPublished: false,
      };
    case 'toggleCoupon':
      return { ...state, coupons: state.coupons.map(c => (c.code === action.code ? { ...c, active: !c.active } : c)) };
    case 'saveCoupon': {
      const exists = state.coupons.some(c => c.code === action.coupon.code);
      return {
        ...state,
        coupons: exists
          ? state.coupons.map(c => (c.code === action.coupon.code ? action.coupon : c))
          : [action.coupon, ...state.coupons],
      };
    }
    case 'setDaypart':
      return { ...state, dayparts: state.dayparts.map(d => ({ ...d, active: d.id === action.id })) };
    case 'toggleDay':
      return { ...state, hours: state.hours.map(h => (h.day === action.day ? { ...h, open: !h.open } : h)) };
    case 'setHours':
      return { ...state, store: { ...state.store, openingTime: action.opening, closingTime: action.closing } };
    case 'setPref':
      return { ...state, prefs: { ...state.prefs, [action.key]: action.value } };
    case 'readNotifications':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    default:
      return state;
  }
}

/** Product edits are sent as name + price rows; the sheet holds them per category. */
const productPayload = (p: Product) => {
  const sheet = p.sheet;
  const variants =
    sheet.kind === 'food'
      ? sheet.variants
      : sheet.kind === 'grocery'
        ? sheet.packs
        : sheet.kind === 'bakery'
          ? sheet.soldAs
          : sheet.kind === 'meat'
            ? sheet.slabs.map(s => ({ name: s.weight, price: s.price, on: true }))
            : [{ name: sheet.unit, price: sheet.rate, on: true }];
  return {
    id: /^\d+$/.test(p.id) ? Number(p.id) : undefined,
    name: p.name,
    // Only real categories.id values; the form's stand-ins for a store with no
    // category list are negative and stay local.
    categoryId: p.categoryId && p.categoryId > 0 ? p.categoryId : undefined,
    subCategoryId: p.subCategoryId && p.subCategoryId > 0 ? p.subCategoryId : undefined,
    veg: p.veg,
    available: p.available,
    prepMin: sheet.kind === 'food' ? sheet.prepMin : undefined,
    variants,
    addons: sheet.kind === 'food' ? sheet.addons : [],
  };
};

type VendorApi = ReturnType<typeof useVendorValue>;

const VendorContext = createContext<VendorApi | null>(null);

function useVendorValue() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const { session, signOut, setBranding } = useSession();
  const toast = useToast();
  const active = LIVE && session?.activeRole === 'vendor';
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!active || busy.current) {
      return;
    }
    busy.current = true;
    try {
      const res = await apiClient.get<{ data: ServerState & { branding?: Branding | null } }>(endpoints.vendor.state);
      dispatch({ type: 'hydrate', data: res.data });
      // A colour changed in the admin dashboard reaches the app on this poll.
      setBranding(res.data.branding ?? null);
    } catch (error) {
      // An expired or rejected token means the session is over.
      if (error instanceof ApiError && error.status === 401) {
        signOut();
      } else if (error instanceof Error) {
        toast(error.message);
      }
    } finally {
      busy.current = false;
    }
  }, [active, toast, signOut, setBranding]);

  useEffect(() => {
    if (!active) {
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  // Each mock credential opens its matching V1 business category.
  useEffect(() => {
    if (!LIVE && session?.activeRole === 'vendor' && session.account.vendor?.category) {
      dispatch({ type: 'setCategory', category: session.account.vendor.category });
    }
  }, [session]);

  /** Sends an action, then refetches so the screens show what the server stored. */
  const send = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!active) {
        return;
      }
      try {
        await apiClient.post(path, body);
      } catch (error) {
        if (error instanceof Error) {
          toast(error.message);
        }
      }
      refresh();
    },
    [active, refresh, toast],
  );

  return useMemo(() => {
    const store = state.store;
    const products = LIVE ? state.products : state.products.filter(p => p.category === state.category);
    const byStatus = (s: Order['status'][]) => state.orders.filter(o => s.includes(o.status));
    const orderIdOf = (id: string) => state.orders.find(o => o.id === id)?.orderId;
    const couponIdOf = (code: string) => state.coupons.find(c => c.code === code)?.couponId;

    return {
      state,
      store,
      products,
      newOrders: byStatus(['new']),
      cookingOrders: byStatus(['cooking']),
      readyOrders: byStatus(['ready']),
      pastOrders: byStatus(['picked_up', 'delivered', 'cancelled', 'rejected']),
      unread: state.notifications.filter(n => !n.read).length,
      order: (id: string) => state.orders.find(o => o.id === id),
      product: (id: string) => state.products.find(p => p.id === id),
      refresh,
      actions: {
        toggleOpen: () => {
          dispatch({ type: 'toggleOpen' });
          send(endpoints.vendor.storeOnline, { is_online: !state.open });
        },
        setBusy: (on: boolean) => {
          dispatch({ type: 'setBusy', on });
          send(endpoints.vendor.storeBusy, { is_busy: on });
        },
        accept: (id: string, prepMinutes: number) => {
          dispatch({ type: 'accept', id, prepMinutes });
          send(endpoints.vendor.acceptOrder, { order_id: orderIdOf(id), prep_minutes: prepMinutes });
        },
        reject: (id: string, reason: string) => {
          dispatch({ type: 'reject', id, reason });
          send(endpoints.vendor.rejectOrder, { order_id: orderIdOf(id), reason });
        },
        addMinutes: (id: string, minutes = 5) => {
          dispatch({ type: 'addMinutes', id, minutes });
          send(endpoints.vendor.extendPrepTime, { order_id: orderIdOf(id), minutes });
        },
        markReady: (id: string) => {
          dispatch({ type: 'markReady', id });
          send(endpoints.vendor.markReady, { order_id: orderIdOf(id) });
        },
        handover: (id: string) => {
          dispatch({ type: 'handover', id });
          send(endpoints.vendor.handover, { order_id: orderIdOf(id) });
        },
        simulateOrder: () => dispatch({ type: 'simulateOrder' }),
        setAvailable: (id: string, available: boolean) => {
          dispatch({ type: 'setAvailable', id, available });
          send(endpoints.vendor.productAvailability, { product_id: Number(id), is_available: available });
        },
        saveProduct: (product: Product) => {
          dispatch({ type: 'saveProduct', product });
          send(endpoints.vendor.saveProduct, { product: productPayload(product) });
        },
        publishRates: () => {
          dispatch({ type: 'publishRates' });
          send(endpoints.vendor.publishRates, {});
        },
        setSubstitution: (on: boolean) => {
          dispatch({ type: 'setSubstitution', on });
          send(endpoints.vendor.substitution, { allow: on });
        },
        setCategory: (category: Category) => dispatch({ type: 'setCategory', category }),
        toggleCoupon: (code: string) => {
          dispatch({ type: 'toggleCoupon', code });
          send(endpoints.vendor.toggleCoupon, { coupon_id: couponIdOf(code) });
        },
        saveCoupon: (coupon: Coupon) => {
          dispatch({ type: 'saveCoupon', coupon });
          send(endpoints.vendor.saveCoupon, {
            coupon: {
              couponId: coupon.couponId ?? couponIdOf(coupon.code),
              code: coupon.code,
              kind: coupon.kind,
              value: coupon.value,
              maxDiscount: coupon.maxDiscount,
              minOrder: coupon.minOrder,
              validDays: coupon.validDays,
              active: coupon.active,
            },
          });
        },
        setDaypart: (id: string) => {
          dispatch({ type: 'setDaypart', id });
          send(endpoints.vendor.daypart, { daypart: id });
        },
        setHours: (opening: string, closing: string) => {
          dispatch({ type: 'setHours', opening, closing });
          send(endpoints.vendor.storeHours, { opening_time: opening, closing_time: closing });
        },
        toggleDay: (day: string) => {
          const current = state.hours.find(h => h.day === day);
          dispatch({ type: 'toggleDay', day });
          send(endpoints.vendor.weeklyHoliday, { day, open: !(current?.open ?? true) });
        },
        setPref: (key: keyof State['prefs'], value: boolean) => {
          dispatch({ type: 'setPref', key, value });
          send(endpoints.vendor.preferences, { [key]: value });
        },
        readNotifications: () => {
          dispatch({ type: 'readNotifications' });
          send(endpoints.vendor.readNotifications, {});
        },
      },
    };
  }, [state, refresh, send]);
}

export function VendorStoreProvider({ children }: { children: React.ReactNode }) {
  const value = useVendorValue();
  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export const useVendor = () => {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error('useVendor must be used inside VendorStoreProvider');
  }
  return ctx;
};
