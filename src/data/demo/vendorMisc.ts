import type { AppNotification, Coupon, Settlement } from '@/domain/types';

/** Board 4a·4 — vendor earnings for September. */
export const VENDOR_EARNINGS = {
  month: { label: 'September', net: 148930, gross: 184220, orders: 542, commission: 33160, coupon: 2130 },
  lastMonth: { label: 'August', net: 139410, gross: 172480, orders: 511, commission: 31046, coupon: 2024 },
  custom: { label: '1–14 Sep', net: 75210, gross: 93040, orders: 276, commission: 16747, coupon: 1083 },
};

export const TODAY_SALES = { amount: 12480, orders: 38, avg: 328, avgPrep: 8, bars: [0.28, 0.46, 0.34, 0.62, 0.78, 0.9, 1] };

export const DAILY_SALES = [
  { day: 'Tue', value: 0.45, amount: 4210, tone: 'light' as const },
  { day: 'Wed', value: 0.62, amount: 5780, tone: 'light' as const },
  { day: 'Thu', value: 0.37, amount: 3450, tone: 'light' as const },
  { day: 'Fri', value: 0.75, amount: 7020, tone: 'mid' as const },
  { day: 'Sat', value: 0.57, amount: 5310, tone: 'light' as const },
  { day: 'Sun', value: 0.9, amount: 8440, tone: 'mid' as const },
  { day: 'Mon', value: 1, amount: 9360, tone: 'dark' as const },
];

export const SETTLEMENTS: Settlement[] = [
  {
    id: 'st-0914',
    amount: 34180,
    status: 'pending',
    title: '₹34,180 pending',
    subtitle: 'Cycle 8–14 Sep · payout 17 Sep',
    period: '8–14 Sep',
    orders: 128,
    gross: 41680,
    commission: 7500,
    refunds: 0,
    paidOn: 'Expected 17 Sep',
  },
  {
    id: 'st-0907',
    amount: 41260,
    status: 'settled',
    title: '₹41,260',
    subtitle: '1–7 Sep · UTR 429188341 · HDFC ••4412',
    period: '1–7 Sep',
    orders: 151,
    gross: 50310,
    commission: 9050,
    refunds: 0,
    utr: '429188341',
    paidOn: 'Paid 10 Sep, 11:02 AM',
  },
  {
    id: 'st-0831',
    amount: 38940,
    status: 'settled',
    title: '₹38,940',
    subtitle: '25–31 Aug · UTR 428910255 · HDFC ••4412',
    period: '25–31 Aug',
    orders: 143,
    gross: 47490,
    commission: 8550,
    refunds: 0,
    utr: '428910255',
    paidOn: 'Paid 3 Sep, 11:00 AM',
  },
  {
    id: 'rf-2831',
    amount: 720,
    status: 'refund',
    title: '₹720 refund adjusted',
    subtitle: '#VK-2826 · linked to original payment',
    period: '14 Sep',
    refunds: 720,
    paidOn: 'Adjusted in cycle 8–14 Sep',
  },
];

export const COUPONS: Coupon[] = [
  { code: 'EKART50', kind: 'flat', value: 50, minOrder: 299, validTill: '30 Sep', used: 112, active: true },
  { code: 'DINNER20', kind: 'percent', value: 20, maxDiscount: 100, minOrder: 399, validTill: '15 Oct', used: 64, active: true },
  { code: 'WELCOME100', kind: 'flat', value: 100, minOrder: 499, validTill: '31 Aug', used: 208, active: false },
];

const MIN = 60_000;

export const vendorNotifications = (now = Date.now()): AppNotification[] => [
  { id: 'vn1', kind: 'order', title: 'New order #VK-2841', body: '3 items · ₹640 · Prepaid. Accept within 3:00.', at: now - 42_000, read: false },
  { id: 'vn2', kind: 'order', title: 'Partner at your counter', body: 'Karthik R. is waiting for #VK-2836. Handover code 5192.', at: now - 2 * MIN, read: false },
  { id: 'vn3', kind: 'payment', title: 'Settlement paid', body: '₹41,260 credited for 1–7 Sep · UTR 429188341.', at: now - 7 * 24 * 60 * MIN, read: true },
  { id: 'vn4', kind: 'system', title: 'Rasmalai is out of stock', body: 'Customers can’t order it until you mark it available.', at: now - 3 * 60 * MIN, read: true },
  { id: 'vn5', kind: 'promo', title: 'Weekend dinner boost', body: 'Stores running DINNER20 saw 18% more orders last weekend.', at: now - 26 * 60 * MIN, read: true },
];

export const REPORT_ROWS = {
  orders: [
    { label: 'Completed', value: '498' },
    { label: 'Cancelled by customer', value: '21' },
    { label: 'Rejected by store', value: '9' },
    { label: 'Refunded', value: '14' },
  ],
  sales: [
    { label: 'Gross sales', value: '₹1,84,220' },
    { label: 'Average order', value: '₹328' },
    { label: 'Top item', value: 'Chicken Biryani · 312' },
    { label: 'Peak hour', value: '8–9 PM' },
  ],
  settlements: [
    { label: 'Settled', value: '₹80,200' },
    { label: 'Pending', value: '₹34,180' },
    { label: 'Commission', value: '₹33,160' },
    { label: 'Refund adjustments', value: '₹2,130' },
  ],
};
