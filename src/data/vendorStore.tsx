import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { ApiError, apiClient, endpoints } from '@/api';
import { storage } from '@/api/storage';
import { productPriceLine } from '@/utils/productPrice';
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
import type { PickedPhoto } from '@/utils/photo';

const LIVE = !USE_MOCK_DATA;
const DEMO_PRODUCTS_STORAGE_KEY = 'partner.demo.products.v1';

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
  | { type: 'restoreDemoProducts'; products: Product[] }
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

const isDemoProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const product = value as Partial<Product>;
  const expectedSheetKind: Record<Category, Product['sheet']['kind']> = {
    food: 'food',
    grocery: 'grocery',
    produce: 'produce',
    bakery: 'bakery',
    meat: 'meat',
  };
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.group === 'string' &&
    typeof product.category === 'string' &&
    product.category in expectedSheetKind &&
    Boolean(product.sheet && product.sheet.kind === expectedSheetKind[product.category as Category])
  );
};

const normalizeDemoProduct = (product: Product): Product => {
  if (product.category !== 'food') {
    return product;
  }
  const withPrice = { ...product, priceLine: productPriceLine(product) };
  const name = product.name.toLowerCase();
  if (/kalakand|rasmalai|halwa|barfi/.test(name)) {
    return { ...withPrice, group: 'Sweets', categoryId: -5, subCategoryId: null, subCategory: null };
  }
  if (product.group !== 'Biryani') {
    return withPrice;
  }
  const subCategory =
    /fried rice/.test(name) ? 'Fried Rice' :
    /sambar rice/.test(name) ? 'Sambar Rice' :
    /paneer biryani/.test(name) ? 'Paneer Biryani' :
    /chicken biryani/.test(name) ? 'Chicken Biryani' :
    /veg biryani/.test(name) ? 'Veg Biryani' :
    /curd rice/.test(name) ? 'Curd Rice' :
    /lemon rice/.test(name) ? 'Lemon Rice' :
    /tomato rice/.test(name) ? 'Tomato Rice' :
    /pulao/.test(name) ? 'Pulao' : 'Biryani';
  const subCategoryId = {
    Biryani: -101,
    'Fried Rice': -102,
    'Sambar Rice': -103,
    'Paneer Biryani': -104,
    'Chicken Biryani': -105,
    'Veg Biryani': -106,
    'Curd Rice': -107,
    'Lemon Rice': -108,
    'Tomato Rice': -109,
    Pulao: -110,
  }[subCategory];
  return { ...withPrice, group: 'Rice items', categoryId: -1, subCategoryId, subCategory };
};

const mergeDemoProducts = (saved: Product[]) => {
  const products = new Map(PRODUCTS.map(product => [product.id, product]));
  saved.map(normalizeDemoProduct).forEach(product => products.set(product.id, product));
  return [...products.values()];
};

const persistDemoProducts = (products: Product[]) =>
  storage.set(DEMO_PRODUCTS_STORAGE_KEY, JSON.stringify(mergeDemoProducts(products)));

const updateOrder = (orders: Order[], id: string, patch: (o: Order) => Partial<Order>) =>
  orders.map(o => (o.id === id ? { ...o, ...patch(o) } : o));

const randomCode = () => String(1000 + Math.floor(Math.random() * 9000));

function reducer(state: State, action: Action): State {
  const now = Date.now();
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.data, category: action.data.store.category, loaded: true };
    case 'restoreDemoProducts':
      return { ...state, products: action.products };
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
  const demoProductsReady = useRef(!USE_MOCK_DATA);
  const demoProductsRestoreStarted = useRef(false);
  const legacyProductsMigrationStarted = useRef(false);

  useEffect(() => {
    if (!USE_MOCK_DATA || demoProductsRestoreStarted.current) {
      return;
    }
    demoProductsRestoreStarted.current = true;
    (async () => {
      let products = state.products;
      const saved = await storage.get(DEMO_PRODUCTS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.every(isDemoProduct)) {
            products = mergeDemoProducts(parsed);
            dispatch({ type: 'restoreDemoProducts', products });
          } else {
            await storage.remove(DEMO_PRODUCTS_STORAGE_KEY);
          }
        } catch {
          await storage.remove(DEMO_PRODUCTS_STORAGE_KEY);
        }
      }
      await storage.set(DEMO_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      demoProductsReady.current = true;
    })();
  }, [state.products]);

  useEffect(() => {
    if (USE_MOCK_DATA && demoProductsReady.current) {
      storage.set(DEMO_PRODUCTS_STORAGE_KEY, JSON.stringify(state.products));
    }
  }, [state.products]);

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

  // Items created in the old offline demo are kept on the device. Upload them
  // once after the vendor's database state and its category list are available.
  useEffect(() => {
    if (USE_MOCK_DATA || !active || !state.loaded || legacyProductsMigrationStarted.current) {
      return;
    }
    legacyProductsMigrationStarted.current = true;
    (async () => {
      const stored = await storage.get(DEMO_PRODUCTS_STORAGE_KEY);
      if (!stored) {
        return;
      }
      try {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every(isDemoProduct)) {
          return;
        }
        let products = parsed as Product[];
        let migratedCount = 0;
        for (const product of products.filter(item => item.id.startsWith('new-'))) {
          const category = state.store.categories?.find(item => item.name === product.group) ?? state.store.categories?.[0];
          const subCategory = category?.subCategories.find(item => item.name === product.subCategory);
          const payload = productPayload({
            ...product,
            categoryId: category?.id ?? null,
            subCategoryId: subCategory?.id ?? null,
          });
          const result = await apiClient.post<{ product_id: number }>(endpoints.vendor.saveProduct, { product: payload });
          products = products.map(item => item.id === product.id ? { ...item, id: String(result.product_id) } : item);
          await storage.set(DEMO_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
          migratedCount += 1;
        }
        await refresh();
        if (migratedCount > 0) {
          toast('Saved dishes from this device to your store');
        }
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Some device-saved dishes could not be uploaded');
      }
    })();
  }, [active, refresh, state.loaded, state.store.categories, toast]);

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
    const inCategory = LIVE ? state.products : state.products.filter(p => p.category === state.category);
    // Newest dish first: a saved item has a numeric id, an unsynced demo one is `new-<timestamp>`.
    // Seeded demo items have neither and keep their order (the sort is stable).
    const recency = (id: string) => Number(id.replace(/^new-/, '')) || 0;
    const products = [...inCategory].sort((a, b) => recency(b.id) - recency(a.id));
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
        saveProduct: async (product: Product, photo?: PickedPhoto | null): Promise<boolean> => {
          if (!USE_MOCK_DATA) {
            if (!active) {
              toast('Sign in to save this item');
              return false;
            }
            try {
              const result = await apiClient.post<{ product_id?: number }>(endpoints.vendor.saveProduct, {
                product: productPayload(product),
              });
              if (photo) {
                // The photo hangs off a product row, so a new item is saved before it is uploaded.
                const productId = result?.product_id ?? Number(product.id);
                try {
                  await apiClient.upload(endpoints.vendor.uploadProductImage, photo, { product_id: String(productId) });
                } catch (error) {
                  toast(error instanceof Error ? `Item saved, but the photo failed: ${error.message}` : 'Item saved, but the photo failed');
                }
              }
              await refresh();
              return true;
            } catch (error) {
              toast(error instanceof Error ? error.message : 'The item could not be saved');
              return false;
            }
          }
          // Demo mode has no server to upload to, so the chosen photo is kept by its local address.
          const saved = photo ? { ...product, image: photo.uri } : product;
          const exists = state.products.some(p => p.id === saved.id);
          const next = exists
            ? state.products.map(p => (p.id === saved.id ? saved : p))
            : [saved, ...state.products];
          dispatch({ type: 'saveProduct', product: saved });
          if (USE_MOCK_DATA) {
            persistDemoProducts(next);
          }
          return true;
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
  }, [active, state, refresh, send, toast]);
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
