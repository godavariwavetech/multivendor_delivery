import type { AssignedPartner, Category, Order, OrderLine, OrderStatus, PaymentMode } from '@/domain/types';

const MIN = 60_000;
const SEC = 1_000;

const KARTHIK: AssignedPartner = { name: 'Karthik R.', initials: 'KR', vehicle: 'TN 09 BX 4412', rating: 4.8, atCounter: true };
const SURESH: AssignedPartner = { name: 'Suresh M.', initials: 'SM', vehicle: 'TN 02 AK 1180', rating: 4.7, atCounter: true };
const DIVYA: AssignedPartner = { name: 'Divya P.', initials: 'DP', vehicle: 'TN 05 CL 9021', rating: 4.9, atCounter: false };

type Line = [name: string, qty: number, price: number, veg: boolean, variant?: string, options?: string];

/** Line pools per category, so every demo store shows plausible tickets. */
const LINES: Record<Category, Line[]> = {
  food: [
    ['Chicken Biryani', 2, 440, false, 'Full', 'Extra raita · Spice medium'],
    ['Ennai Kathirikai', 1, 140, true, 'Half'],
    ['Mutton Biryani', 1, 520, false, 'Full'],
    ['Bread Halwa', 2, 180, true],
    ['Veg Fried Rice', 2, 300, true],
    ['Gobi 65', 1, 110, true],
    ['Parotta', 5, 100, true, 'Pack of 5'],
    ['Salna', 1, 0, false],
    ['Chapati', 3, 90, true],
    ['Paneer Butter Masala', 1, 210, true],
    ['Chicken Biryani', 2, 320, false, 'Half'],
    ['Parotta', 4, 80, true],
  ],
  grocery: [
    ['Aachi Sambar Powder', 2, 144, true, '200 g'],
    ['Ponni Raw Rice', 1, 660, true, '10 kg'],
    ['Toor Dal', 1, 165, true, '1 kg'],
    ['Gold Winner Oil', 2, 336, true, '1 L'],
    ['Tata Salt', 2, 56, true, '1 kg'],
    ['Surf Excel', 1, 245, true, '1 kg'],
    ['Aashirvaad Atta', 1, 285, true, '5 kg'],
    ['Bru Coffee', 1, 190, true, '200 g'],
    ['Sugar', 1, 48, true, '1 kg'],
    ['Idli Rice', 1, 320, true, '5 kg'],
    ['Aachi Sambar Powder', 1, 38, true, '100 g'],
    ['Tamarind', 1, 90, true, '500 g'],
  ],
  produce: [
    ['Tomato', 1, 36, true, '1 kg'],
    ['Onion', 2, 70, true, '1 kg'],
    ['Spinach', 2, 36, true, 'bunch'],
    ['Banana · Nendran', 1, 84, true, 'dozen'],
    ['Capsicum', 1, 40, true, '500 g'],
    ['Carrot', 1, 60, true, '1 kg'],
    ['Apple · Shimla', 1, 180, true, '1 kg'],
    ['Coriander', 2, 20, true, 'bunch'],
    ['Potato', 2, 80, true, '1 kg'],
    ['Beans', 1, 45, true, '500 g'],
    ['Papaya', 1, 55, true, '1 pc'],
    ['Lemon', 6, 30, true],
  ],
  bakery: [
    ['Butterscotch Cake', 1, 820, true, 'One kg', 'Message: Happy 5th, Arav'],
    ['Veg Puff', 4, 120, true],
    ['Ghee Mysore Pak', 1, 210, true, '250 g'],
    ['Pastry box', 1, 330, true, 'box of 6'],
    ['Plum Cake', 1, 260, true, '500 g'],
    ['Milk Bread', 2, 90, true],
    ['Black Forest Cake', 1, 440, true, 'Half kg'],
    ['Kaju Katli', 1, 380, true, '250 g'],
    ['Egg Puff', 3, 105, false],
    ['Cookies', 1, 150, true, '300 g'],
    ['Donut', 4, 200, true],
    ['Rusk', 1, 70, true],
  ],
  meat: [
    ['Chicken curry cut', 1, 520, false, '1 kg', 'Cleaned'],
    ['Seer fish steaks', 1, 550, false, '500 g'],
    ['Mutton curry cut', 1, 450, false, '500 g'],
    ['Prawns · medium', 1, 260, false, '250 g', 'Deveined'],
    ['Chicken boneless', 1, 340, false, '500 g'],
    ['Eggs', 12, 96, false],
    ['Mutton keema', 1, 480, false, '500 g'],
    ['Pomfret', 2, 380, false],
    ['Chicken wings', 1, 220, false, '500 g'],
    ['Crab', 1, 400, false, '500 g'],
    ['Chicken curry cut', 1, 260, false, '500 g'],
    ['Liver', 1, 120, false, '250 g'],
  ],
};

type Spec = {
  id: string;
  status: OrderStatus;
  ageSec: number;
  lines: [number, number?];
  payment?: PaymentMode;
  prep?: number;
  /** Seconds of prep already used; > prep*60 means late. */
  cookedSec?: number;
  partner?: AssignedPartner;
  code?: string;
  closeNote?: string;
  closedAgoMin?: number;
  refunded?: boolean;
  customer?: [string, string, number];
  note?: string;
  coupon?: boolean;
  parcels?: number;
};

const SPECS: Spec[] = [
  { id: 'VK-2841', status: 'new', ageSec: 42, lines: [0, 1], coupon: true, note: 'Less oil please, pack gravy separately.', customer: ['Meera S.', 'Thiru Vi Ka Nagar', 3.4], parcels: 2 },
  { id: 'VK-2840', status: 'new', ageSec: 80, lines: [2, 3], customer: ['Arun P.', 'Kilpauk', 2.6] },
  { id: 'VK-2843', status: 'new', ageSec: 25, lines: [4, 5], payment: 'cod', customer: ['Sanjay R.', 'Anna Nagar West', 1.8] },
  { id: 'VK-2842', status: 'new', ageSec: 55, lines: [6], customer: ['Divya K.', 'Mogappair', 3.9] },
  { id: 'VK-2845', status: 'new', ageSec: 95, lines: [8, 9], coupon: true, customer: ['Farhan A.', 'Villivakkam', 2.9] },
  { id: 'VK-2844', status: 'new', ageSec: 130, lines: [10, 11], customer: ['Pooja N.', 'Shenoy Nagar', 2.1] },
  { id: 'VK-2835', status: 'cooking', ageSec: 1500, lines: [6, 7], prep: 15, cookedSec: 15 * 60 + 200, partner: KARTHIK, customer: ['Kavitha R.', 'Aminjikarai', 1.9] },
  { id: 'VK-2839', status: 'cooking', ageSec: 700, lines: [4, 5], payment: 'cod', prep: 15, cookedSec: 15 * 60 - 372, customer: ['Joseph D.', 'Shenoy Nagar', 2.2] },
  { id: 'VK-2837', status: 'cooking', ageSec: 520, lines: [2, 3], prep: 25, cookedSec: 25 * 60 - 700, customer: ['Priya V.', 'Anna Nagar East', 1.4] },
  { id: 'VK-2838', status: 'cooking', ageSec: 300, lines: [8, 9], prep: 20, cookedSec: 20 * 60 - 845, customer: ['Rahul K.', 'Villivakkam', 3.1] },
  { id: 'VK-2834', status: 'cooking', ageSec: 420, lines: [10], prep: 15, cookedSec: 15 * 60 - 510, customer: ['Sneha T.', 'Mogappair', 4.0] },
  { id: 'VK-2832', status: 'cooking', ageSec: 150, lines: [11, 7], payment: 'cod', prep: 20, cookedSec: 20 * 60 - 1080, customer: ['Ganesh B.', 'Ayanavaram', 2.8] },
  { id: 'VK-2836', status: 'ready', ageSec: 1860, lines: [6, 7], partner: KARTHIK, code: '5192', customer: ['Meera S.', 'Thiru Vi Ka Nagar', 3.4], parcels: 2 },
  { id: 'VK-2831', status: 'ready', ageSec: 1500, lines: [0], partner: DIVYA, code: '3087', customer: ['Lakshmi N.', 'Anna Nagar', 1.1] },
  { id: 'VK-2830', status: 'ready', ageSec: 1320, lines: [9, 8], partner: SURESH, code: '7714', customer: ['Imran S.', 'Kolathur', 3.6] },
  { id: 'VK-2833', status: 'delivered', ageSec: 3300, lines: [0, 3], closeNote: 'Delivered 7:48 PM', closedAgoMin: 12, customer: ['Anitha G.', 'Anna Nagar West', 2.0] },
  { id: 'VK-2829', status: 'picked_up', ageSec: 2900, lines: [4, 5], partner: SURESH, closeNote: 'Picked up · Suresh M.', closedAgoMin: 8, customer: ['Vikram S.', 'Padi', 3.9] },
  { id: 'VK-2826', status: 'cancelled', ageSec: 5400, lines: [2, 1], closeNote: 'Cancelled · out of stock', closedAgoMin: 80, refunded: true, customer: ['Deepa M.', 'Kilpauk', 2.5] },
  { id: 'VK-2824', status: 'rejected', ageSec: 6200, lines: [10], closeNote: 'Rejected · kitchen overloaded', closedAgoMin: 95, customer: ['Ramesh A.', 'Perambur', 4.4] },
];

const payoutFor = (itemTotal: number, packing: number) => Math.round(itemTotal * 0.82 + packing);

export function seedOrders(category: Category, now = Date.now()): Order[] {
  const pool = LINES[category];
  return SPECS.map(spec => {
    const lines: OrderLine[] = spec.lines
      .filter((i): i is number => i !== undefined)
      .map(i => {
        const [name, qty, price, veg, variant, options] = pool[i];
        return { name, qty, price, veg, variant, options };
      });
    const itemTotal = lines.reduce((sum, l) => sum + l.price, 0);
    const packing = 20;
    const gst = Math.round(itemTotal * 0.05);
    const coupon = spec.coupon ? { code: 'EKART50', amount: 50 } : undefined;
    const total = itemTotal + packing + gst - (coupon?.amount ?? 0);
    const placedAt = now - spec.ageSec * SEC;
    const acceptedAt = spec.prep && spec.cookedSec !== undefined ? now - spec.cookedSec * SEC : undefined;
    const [custName, custArea, km] = spec.customer ?? ['Customer', 'Anna Nagar', 2];
    const items = lines.reduce((sum, l) => sum + (l.qty > 5 ? 1 : l.qty), 0);

    return {
      id: spec.id,
      status: spec.status,
      placedAt,
      lines,
      itemTotal,
      packing,
      gst,
      coupon,
      total,
      payout: spec.id === 'VK-2841' && category === 'food' ? 497 : payoutFor(itemTotal, packing),
      payment: spec.payment ?? 'prepaid',
      refunded: spec.refunded,
      customer: { name: custName, area: custArea, distanceKm: km },
      note: category === 'food' ? spec.note : undefined,
      prepMinutes: spec.prep,
      acceptedAt,
      readyAt: spec.status === 'ready' ? now - 2 * MIN : undefined,
      partner: spec.partner,
      handoverCode: spec.code,
      parcels: spec.parcels ?? Math.max(1, Math.min(3, items)),
      closedAt: spec.closedAgoMin !== undefined ? now - spec.closedAgoMin * MIN : undefined,
      closeNote: spec.closeNote,
    };
  });
}

let sequence = 2842;

/** Demo: a fresh order arriving, used by the "simulate new order" action. */
export function makeIncomingOrder(category: Category, now = Date.now()): Order {
  const pool = LINES[category];
  const a = pool[Math.floor(Math.random() * pool.length)];
  const b = pool[Math.floor(Math.random() * pool.length)];
  const lines: OrderLine[] = [a, b].map(([name, qty, price, veg, variant, options]) => ({ name, qty, price, veg, variant, options }));
  const itemTotal = lines.reduce((s, l) => s + l.price, 0);
  const gst = Math.round(itemTotal * 0.05);
  const id = `VK-${sequence++}`;
  return {
    id,
    status: 'new',
    placedAt: now,
    lines,
    itemTotal,
    packing: 20,
    gst,
    total: itemTotal + 20 + gst,
    payout: payoutFor(itemTotal, 20),
    payment: Math.random() > 0.7 ? 'cod' : 'prepaid',
    customer: { name: 'Nithya R.', area: 'Anna Nagar', distanceKm: 2.1 },
    parcels: 2,
  };
}

export const ASSIGNABLE_PARTNERS = [KARTHIK, SURESH, DIVYA];
