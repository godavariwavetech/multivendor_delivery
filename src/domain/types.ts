/**
 * App view models. These are shaped for the screens on the design board; the
 * mapping to the backend schema (multivendor_db.sql) is documented beside each
 * type and implemented once the partner_app API exists.
 */

export type Role = 'vendor' | 'delivery';

/** `categories.vertical` in the schema: food / grocery / fruit / meat (bakery is not in the schema yet). */
export type Category = 'food' | 'grocery' | 'produce' | 'bakery' | 'meat';

export type PaymentMode = 'prepaid' | 'cod';

// ─── Accounts ────────────────────────────────────────────────────────────────

export type Account = {
  mobile: string;
  roles: Role[];
  vendor?: { storeName: string; area: string };
  partner?: { name: string; zone: string };
};

// ─── Vendor ──────────────────────────────────────────────────────────────────

/**
 * `orders.order_status`: 0 placed, 1 accepted, 2 preparing, 3 out_for_delivery,
 * 4 delivered, 5 cancelled, 6 rejected. `ready` has no schema value yet.
 */
export type OrderStatus = 'new' | 'cooking' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'rejected';

export type OrderLine = {
  name: string;
  qty: number;
  variant?: string;
  options?: string;
  veg: boolean;
  price: number;
};

export type AssignedPartner = {
  name: string;
  initials: string;
  vehicle: string;
  rating: number;
  atCounter: boolean;
};

export type Order = {
  /** `orders.id` — what the API actions take. Absent in demo mode. */
  orderId?: number;
  id: string;
  status: OrderStatus;
  placedAt: number;
  lines: OrderLine[];
  itemTotal: number;
  packing: number;
  gst: number;
  coupon?: { code: string; amount: number };
  total: number;
  payout: number;
  payment: PaymentMode;
  refunded?: boolean;
  customer: { name: string; area: string; distanceKm: number };
  note?: string;
  prepMinutes?: number;
  acceptedAt?: number;
  readyAt?: number;
  partner?: AssignedPartner;
  handoverCode?: string;
  parcels: number;
  closedAt?: number;
  closeNote?: string;
};

/**
 * A product category and its sub categories — `categories` rows, where a sub
 * category is a row whose `parent_id` is the category. Ids are `categories.id`.
 */
export type CategoryOption = {
  id: number;
  name: string;
  subCategories: { id: number; name: string }[];
};

export type Store = {
  category: Category;
  name: string;
  initials: string;
  area: string;
  address: string;
  /** `vendors.latitude` / `longitude`, for the map on Store details. */
  latitude?: number | null;
  longitude?: number | null;
  code: string;
  rating: number;
  ratings: number;
  hours: string;
  closesAt: string;
  /** 24-hour "HH:MM", for the time picker on Opening hours. */
  openingTime?: string;
  closingTime?: string;
  service: string;
  bank: string;
  /** Names of the categories in use — the menu's filter chips. */
  groups: string[];
  /** The category picker on the product form; absent from an older backend. */
  categories?: CategoryOption[];
  itemNoun: string; // dish, product, cut…
};

export type Variant = { name: string; price: number; mrp?: number; on: boolean; note?: string };

export type FoodSheet = {
  kind: 'food';
  prepMin: number;
  variants: Variant[];
  addons: { name: string; price: number }[];
  spiceChoice: boolean;
  stockToday: number;
  tags: string[];
};

export type GrocerySheet = {
  kind: 'grocery';
  brand: string;
  ean: string;
  packs: Variant[];
  stock: number;
  lowStockAlert: number;
  batchExpiry: string;
  hsnGst: string;
  maxPerOrder: number;
};

export type ProduceSheet = {
  kind: 'produce';
  unit: string;
  rate: number;
  yesterday?: number;
  note: string;
  tags: string[];
};

export type BakerySheet = {
  kind: 'bakery';
  soldAs: Variant[];
  bakedAt: string;
  nextBatch: string;
  shelfLife: string;
  preorder: boolean;
  bakedToday: number;
  tags: string[];
};

export type MeatSheet = {
  kind: 'meat';
  pricePerKg: number;
  slabs: { weight: string; pieces: string; price: number }[];
  preparation: { name: string; on: boolean }[];
  stockKg: number;
  cutAt: string;
  tolerance: string;
  packingRule: string;
  tags: string[];
};

export type ProductSheet = FoodSheet | GrocerySheet | ProduceSheet | BakerySheet | MeatSheet;

export type Product = {
  id: string;
  category: Category;
  name: string;
  /** Name of the product's category (not the sub category); used by the menu's filter chips. */
  group: string;
  /** `categories.id` of the category, and of the sub category when one is picked. */
  categoryId?: number | null;
  subCategoryId?: number | null;
  subCategory?: string | null;
  veg: boolean;
  priceLine: string;
  available: boolean;
  stockLine: string;
  outNote?: string;
  /** Server path of the primary product_images row, or null when none. */
  image?: string | null;
  sheet: ProductSheet;
};

export type Settlement = {
  id: string;
  /** Refund rows point back at the order they adjust. */
  orderNumber?: string;
  reason?: string;
  amount: number;
  status: 'pending' | 'settled' | 'refund';
  title: string;
  subtitle: string;
  period: string;
  orders?: number;
  gross?: number;
  commission?: number;
  refunds?: number;
  utr?: string;
  paidOn?: string;
};

export type Coupon = {
  /** `coupons.id`; absent for a coupon that has not been saved yet. */
  couponId?: number;
  /** Set when the vendor picks a new validity; the server turns it into a date. */
  validDays?: number;
  code: string;
  kind: 'flat' | 'percent';
  value: number;
  maxDiscount?: number;
  minOrder: number;
  validTill: string;
  used: number;
  active: boolean;
};

/** Board 4a — the earnings card for a period. */
export type EarningsPeriod = { label: string; net: number; gross: number; orders: number; commission: number; coupon: number };

export type VendorEarnings = { month: EarningsPeriod; lastMonth: EarningsPeriod; custom: EarningsPeriod };

export type TodaySales = { amount: number; orders: number; avg: number; avgPrep: number; bars: number[] };

export type DailyBar = { day: string; value: number; amount: number; tone: 'light' | 'mid' | 'dark' };

export type ReportRow = { label: string; value: string };

export type ReportRows = { orders: ReportRow[]; sales: ReportRow[]; settlements: ReportRow[] };

export type DayHours = { day: string; open: boolean; from: string; to: string };

/** Registration details shown on the vendor's Store screens. */
export type StoreDetails = {
  phone: string;
  alternatePhone: string;
  email: string;
  kycVerified: boolean;
  documents: { title: string; detail: string }[];
  bank: { bank: string; account: string; holder: string; ifsc: string };
  commission: number;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  kind: 'order' | 'payment' | 'system' | 'promo';
};

// ─── Delivery ────────────────────────────────────────────────────────────────

/** `delivery_assignments.assignment_status`: 0 assigned, 1 accepted, 2 picked_up, 3 delivered, 4 rejected, 5 cancelled. */
export type RequestStatus = 'open' | 'taken' | 'skipped' | 'accepted' | 'done';

export type ChecklistItem = { key: string; label: string; hint?: string };

export type FoodPickup = {
  kind: 'food';
  checklist: ChecklistItem[];
  deliverWithinMin: number;
  warning: { title: string; body: string };
};
export type GroceryPickup = {
  kind: 'grocery';
  bags: ChecklistItem[];
  weightKg: number;
  /** Only when the store reported items it could not pack. */
  shortSupply?: { title: string; body: string };
  warning: { title: string; body: string };
};
export type ProducePickup = {
  kind: 'produce';
  weighed: { name: string; ordered: string; actual: string }[];
  billed: number;
  /** Only when the store offered a replacement the customer must approve. */
  substitution?: { title: string; body: string };
  checklist: ChecklistItem[];
};
export type BakeryPickup = {
  kind: 'bakery';
  banner: { title: string; body: string };
  checklist: ChecklistItem[];
  message: string;
  slot: string;
};
export type MeatPickup = {
  kind: 'meat';
  banner: { title: string; body: string };
  checklist: ChecklistItem[];
  lines: { name: string; weight: string }[];
  warning: { title: string; body: string };
};
export type PickupSheet = FoodPickup | GroceryPickup | ProducePickup | BakeryPickup | MeatPickup;

export type DeliveryRequest = {
  /** `delivery_assignments.id` — what the API actions take. Absent in demo mode. */
  assignmentId?: number;
  orderId?: number;
  id: string;
  category: Category;
  status: RequestStatus;
  store: { name: string; area: string; address: string; distanceKm: number; note: string; latitude?: number | null; longitude?: number | null };
  drop: { name: string; area: string; address: string; distanceKm: number; latitude?: number | null; longitude?: number | null };
  payout: number;
  breakdown: { base: number; distance: number; tip: number };
  totalKm: number;
  etaMin: number;
  payment: PaymentMode;
  codAmount?: number;
  orderTotal: number;
  items: number;
  parcels: number;
  readyInMin: number;
  waitingMin?: number;
  handoverCode: string;
  customerOtp: string;
  pickup: PickupSheet;
};

export type TripStage = 'to_store' | 'at_store' | 'on_the_way' | 'arrived' | 'complete';

export type ActiveTrip = {
  requestId: string;
  assignmentId?: number;
  stage: TripStage;
  acceptedAt: number;
  arrivedStoreAt?: number;
  pickedUpAt?: number;
  deliveredAt?: number;
  checks: Record<string, boolean>;
  proofPhoto: boolean;
  handoverRating?: 'slow' | 'fine' | 'quick';
};

export type Trip = {
  id: string;
  assignmentId?: number;
  store: string;
  category: Category;
  at: number;
  km: number;
  minutes: number;
  earning: number;
  tip: number;
  status: 'delivered' | 'cancelled';
  note?: string;
  customer?: string;
  verifiedBy?: string;
  breakdown?: { base: number; distance: number; tip: number };
};
