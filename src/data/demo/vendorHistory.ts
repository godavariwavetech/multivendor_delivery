export type HistoryOrder = { id: string; placedAt: string; amount: number; status: 'Ready' | 'Cooking' | 'Delivered' };
export type HistorySummary = { orders: number; gross: number; payout: number; avg: number; recentOrders: HistoryOrder[] };

type Day = Omit<HistorySummary, 'avg' | 'recentOrders'>;

/** Small, repeatable dataset for exercising the vendor history-period UI. */
const DAYS: Record<string, Day> = {
  '2026-09-22': { orders: 7, gross: 4860, payout: 3990 },
  '2026-09-23': { orders: 8, gross: 5340, payout: 4380 },
  '2026-09-24': { orders: 12, gross: 8930, payout: 7330 },
  '2026-09-25': { orders: 9, gross: 7140, payout: 5860 },
  '2026-09-26': { orders: 15, gross: 11020, payout: 9040 },
  '2026-09-27': { orders: 11, gross: 8260, payout: 6780 },
  '2026-09-28': { orders: 13, gross: 9780, payout: 8030 },
};

const RECENT_ORDERS: Record<string, HistoryOrder[]> = {
  '2026-09-25': [
    { id: '#1045', placedAt: '25 Sept, 8:20 PM', amount: 680, status: 'Ready' },
    { id: '#1044', placedAt: '25 Sept, 7:48 PM', amount: 520, status: 'Cooking' },
    { id: '#1043', placedAt: '25 Sept, 7:15 PM', amount: 760, status: 'Delivered' },
    { id: '#1040', placedAt: '25 Sept, 6:42 PM', amount: 890, status: 'Delivered' },
    { id: '#1038', placedAt: '25 Sept, 6:05 PM', amount: 540, status: 'Delivered' },
    { id: '#1037', placedAt: '25 Sept, 5:31 PM', amount: 720, status: 'Delivered' },
    { id: '#1034', placedAt: '25 Sept, 4:56 PM', amount: 610, status: 'Delivered' },
    { id: '#1032', placedAt: '25 Sept, 3:40 PM', amount: 830, status: 'Delivered' },
    { id: '#1029', placedAt: '25 Sept, 2:15 PM', amount: 1590, status: 'Delivered' },
  ],
  '2026-09-24': [
    { id: '#1042', placedAt: '24 Sept, 8:35 PM', amount: 840, status: 'Delivered' },
    { id: '#1041', placedAt: '24 Sept, 7:55 PM', amount: 610, status: 'Delivered' },
  ],
  '2026-09-26': [
    { id: '#1046', placedAt: '26 Sept, 8:10 PM', amount: 940, status: 'Ready' },
  ],
};

const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const mockHistorySummary = (from: Date, to: Date): HistorySummary => {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const total: Day = { orders: 0, gross: 0, payout: 0 };
  const recentOrders: HistoryOrder[] = [];

  while (cursor <= end) {
    const day = DAYS[key(cursor)];
    if (day) {
      total.orders += day.orders;
      total.gross += day.gross;
      total.payout += day.payout;
    }
    recentOrders.push(...(RECENT_ORDERS[key(cursor)] ?? []));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { ...total, avg: total.orders ? Math.round(total.gross / total.orders) : 0, recentOrders };
};
