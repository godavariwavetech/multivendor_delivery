import type { AppNotification, Trip } from '@/domain/types';

const MIN = 60_000;

/** Board 1c·5 / 4b·4 — today's trips before the current one. */
export const seedTrips = (now = Date.now()): Trip[] => [
  {
    id: 'VK-2829',
    store: 'Sri Balaji Stores',
    category: 'grocery',
    at: now - 40 * MIN,
    km: 2.8,
    minutes: 15,
    earning: 62,
    tip: 10,
    status: 'delivered',
    customer: 'Vikram S.',
    verifiedBy: 'Customer OTP 3390',
    breakdown: { base: 42, distance: 10, tip: 10 },
  },
  {
    id: 'VK-2822',
    store: 'Sakthi Tiffin',
    category: 'food',
    at: now - 83 * MIN,
    km: 1.9,
    minutes: 11,
    earning: 20,
    tip: 0,
    status: 'cancelled',
    note: 'customer unavailable',
    customer: 'Harish L.',
    breakdown: { base: 20, distance: 0, tip: 0 },
  },
  {
    id: 'VK-2815',
    store: "Amma's Kitchen",
    category: 'food',
    at: now - 120 * MIN,
    km: 3.1,
    minutes: 17,
    earning: 58,
    tip: 0,
    status: 'delivered',
    customer: 'Sneha T.',
    verifiedBy: 'Customer OTP 8812',
    breakdown: { base: 46, distance: 12, tip: 0 },
  },
  {
    id: 'VK-2807',
    store: 'Hotel Saravana',
    category: 'food',
    at: now - 150 * MIN,
    km: 2.2,
    minutes: 13,
    earning: 48,
    tip: 0,
    status: 'delivered',
    customer: 'Rahul K.',
    verifiedBy: 'Customer OTP 1409',
    breakdown: { base: 40, distance: 8, tip: 0 },
  },
];

/** Board 4b·4 — this week's totals before today's trips are added. */
export const WEEK_BASE = {
  label: 'This week · 8–14 Sep',
  trips: 68,
  km: 214,
  total: 4210,
  base: 3128,
  distance: 642,
  peak: 240,
  tips: 200,
  bars: [0.3, 0.52, 0.42, 0.66, 0.46, 0.76, 1],
  payoutDate: 'Tue, 17 Sep',
  bank: 'SBI ••7782',
};

/** Board 4b·1 — today's three-up and the dinner peak bonus. */
export const TODAY_BASE = { deliveries: 12, km: 38, earned: 740, peakDone: 2, peakTarget: 5, peakReward: 120 };

export const STATEMENTS = [
  { id: 'w37', label: '8–14 Sep', trips: 68, amount: 4210, status: 'pending' as const, note: 'Payout on Tue, 17 Sep' },
  { id: 'w36', label: '1–7 Sep', trips: 74, amount: 4585, status: 'paid' as const, note: 'Paid 10 Sep · UTR 431020984' },
  { id: 'w35', label: '25–31 Aug', trips: 61, amount: 3870, status: 'paid' as const, note: 'Paid 3 Sep · UTR 430118822' },
  { id: 'w34', label: '18–24 Aug', trips: 66, amount: 4102, status: 'paid' as const, note: 'Paid 27 Aug · UTR 429876011' },
];

export const partnerNotifications = (now = Date.now()): AppNotification[] => [
  { id: 'pn1', kind: 'order', title: '3 food requests nearby', body: 'Within 2 km of your location. Requests expire in 20 seconds.', at: now - 1 * MIN, read: false },
  { id: 'pn2', kind: 'payment', title: 'Payout scheduled', body: '₹4,210 for 8–14 Sep will reach SBI ••7782 on Tue, 17 Sep.', at: now - 5 * 60 * MIN, read: false },
  { id: 'pn3', kind: 'promo', title: 'Dinner peak bonus is live', body: 'Finish 5 trips before 10 PM for +₹120.', at: now - 3 * 60 * MIN, read: true },
  { id: 'pn4', kind: 'system', title: 'KYC verified', body: 'Your documents were verified. No action needed.', at: now - 9 * 24 * 60 * MIN, read: true },
];
