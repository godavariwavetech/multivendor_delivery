/**
 * App view models. These are shaped for the screens on the design board; the
 * mapping to the backend schema (multivendor_db.sql) is documented beside each
 * type and implemented once the partner_app API exists.
 */

export type Role = 'vendor' | 'delivery' | 'franchise';

/** `categories.vertical` in the schema: food / grocery / fruit / meat (bakery is not in the schema yet). */
export type Category = 'food' | 'grocery' | 'produce' | 'bakery' | 'meat';

export type PaymentMode = 'prepaid' | 'cod';

// ─── Accounts ────────────────────────────────────────────────────────────────

export type Account = {
  mobile: string;
  roles: Role[];
  vendor?: { storeName: string; area: string; category?: Category };
  partner?: { name: string; zone: string };
  /** `franchises` row: an area franchisee who oversees vendors and partners. */
  franchise?: { name: string; owner: string; area: string };
};

// ─── Vendor ──────────────────────────────────────────────────────────────────

/**
 * `orders.order_status`: 0 placed, 1 accepted, 2 preparing, 3 out_for_delivery,
 * 4 delivered, 5 cancelled, 6 rejected. `ready` has no schema value yet.
 */
export type OrderStatus = 'new' | 'cooking' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'rejected';

export type OrderLine = {
  /** `products.id` of the line's dish, from its variant. It survives a rename or removal; absent on an older backend and in demo seeds. */
  productId?: string;
  /** Server path of the dish's primary photo, or null when it has none. */
  image?: string | null;
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
  customer: { name: string; area: string; address?: string; distanceKm: number; phone?: string };
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
  /** `vendors.shop_image` as a fetchable address; absent from an older backend or when none is set. */
  logo?: string | null;
  /** `tenants.tenant_name`: the business the store belongs to, printed on its invoices. */
  tenantName?: string | null;
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

/** The order's bill as the customer was charged, so a partner can explain what they collect. */
export type OrderBill = {
  lines: { name: string; variant?: string; qty: number; amount: number; image?: string | null }[];
  itemTotal: number;
  packing: number;
  tax: number;
  delivery: number;
  discount: number;
  couponCode?: string;
  tip: number;
  total: number;
};

export type DeliveryRequest = {
  /** `delivery_assignments.id` — what the API actions take. Absent in demo mode. */
  assignmentId?: number;
  orderId?: number;
  id: string;
  /** When the customer placed the order, and the first dish's photo, for the order row. */
  placedAt?: number;
  photo?: string | null;
  category: Category;
  status: RequestStatus;
  store: {
    name: string;
    area: string;
    address: string;
    distanceKm: number;
    note: string;
    latitude?: number | null;
    longitude?: number | null;
    /** The store's contact number, picture and opening hours, for the request details. */
    phone?: string;
    photo?: string | null;
    hours?: string;
  };
  drop: { name: string; area: string; address: string; distanceKm: number; latitude?: number | null; longitude?: number | null };
  payout: number;
  breakdown: { base: number; distance: number; tip: number };
  totalKm: number;
  etaMin: number;
  payment: PaymentMode;
  codAmount?: number;
  orderTotal: number;
  items: number;
  /** The dishes in the order, e.g. "2 × Chicken Biryani (Full), Gulab Jamun". */
  itemNames?: string;
  bill?: OrderBill;
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
  /** For the order row: when it was placed, what the customer paid, where it went, the first dish's photo. */
  placedAt?: number;
  orderTotal?: number;
  area?: string;
  address?: string;
  photo?: string | null;
  /** The order as it was offered (bill, store, addresses), for the trip's detail screen. */
  details?: DeliveryRequest;
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

// ─── Franchise ───────────────────────────────────────────────────────────────

/**
 * A franchise is an area franchisee: it owns a territory and oversees the vendors and
 * delivery partners linked to it (`vendors.franchise_id`, `delivery_partners.franchise_id`).
 * It earns `commissionPct` of the sub-total of every order those vendors deliver.
 */
export type FranchiseProfile = {
  name: string;
  owner: string;
  initials: string;
  code: string;
  mobile: string;
  email: string;
  territory: string;
  area: string;
  commissionPct: number;
  bank: string;
};

export type FranchiseVendor = {
  id: string;
  name: string;
  mobile: string;
  category: Category;
  area: string;
  online: boolean;
  blocked: boolean;
  kycVerified: boolean;
  rating: number;
  openOrders: number;
  ordersToday: number;
  salesToday: number;
  orders30d: number;
  sales30d: number;
  /** Commission earned from this vendor in the last 30 days. */
  earned30d: number;
  /** Cancelled or rejected orders in the last 30 days and the sales value lost with them. */
  cancelled30d: number;
  lostSales30d: number;
};

/** Benefit (commission) and loss (cancelled or rejected sales) for one vendor over a chosen period. */
export type FranchiseVendorResult = {
  id: string;
  name: string;
  orders: number;
  sales: number;
  earned: number;
  cancelled: number;
  lostSales: number;
};

export type FranchiseVendorReport = {
  vendors: FranchiseVendorResult[];
  total: Omit<FranchiseVendorResult, 'id' | 'name'>;
};

/** Everything the franchise can see about one of its vendors. Account numbers arrive masked. */
export type FranchiseVendorDetail = {
  id: string;
  name: string;
  code: string;
  category: Category;
  online: boolean;
  busy: boolean;
  blocked: boolean;
  kycVerified: boolean;
  rating: number;
  mobile: string;
  mobile2: string;
  email: string;
  address: string;
  area: string;
  hours: string;
  weeklyHoliday: string;
  /** What the platform charges this vendor, not the franchise's own rate. */
  platformCommissionPct: number;
  joined: string | null;
  licences: { fssai: string; gst: string; trade: string; drug: string; pan: string };
  bank: { holder: string; bank: string; account: string; ifsc: string; upi: string };
  totals: {
    orders: number;
    /** Orders the vendor accepted, including ones since delivered or cancelled. */
    accepted: number;
    rejected: number;
    delivered: number;
    /** Accepted and still being prepared, waiting for pickup or on the way. */
    inProcess: number;
    /** New orders the vendor has not answered yet. */
    waiting: number;
    cancelled: number;
    open: number;
    sales: number;
    earned: number;
    lostSales: number;
  };
  recent: { number: string; status: string; amount: number; payment: string; placedAt: string | null; deliveredAt: string | null }[];
};

export type FranchisePartnerDetail = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  area: string;
  zone: string;
  shift: string;
  vehicleType: string;
  vehicleNumber: string;
  online: boolean;
  onlineSince: string | null;
  blocked: boolean;
  kycVerified: boolean;
  rating: number;
  joined: string | null;
  documents: { aadhaar: string; licence: string; pan: string };
  bank: { account: string; ifsc: string };
  totals: { delivered: number; today: number; failed: number; active: number; distanceKm: number; pay: number };
  recent: { number: string; status: 'delivered' | 'failed' | 'in_progress'; distanceKm: number; pay: number; at: string | null }[];
};

export type FranchisePartner = {
  id: string;
  name: string;
  mobile: string;
  vehicle: string;
  online: boolean;
  blocked: boolean;
  kycVerified: boolean;
  rating: number;
  onTrip: boolean;
  tripsToday: number;
  tripsTotal: number;
};

export type FranchiseDay = { label: string; orders: number; sales: number; earned: number };

export type FranchiseWeek = { id: string; label: string; current: boolean; orders: number; sales: number; earned: number };

export type FranchiseState = {
  profile: FranchiseProfile;
  today: { orders: number; sales: number; earned: number; liveOrders: number; vendorsOnline: number; partnersOnline: number };
  month: { orders: number; sales: number; earned: number; cancelled: number };
  days: FranchiseDay[];
  weeks: FranchiseWeek[];
  vendors: FranchiseVendor[];
  partners: FranchisePartner[];
};
