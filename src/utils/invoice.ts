import type { Order, Store } from '@/domain/types';

import { formatAmount } from './currency';
import { clock, dayMonth } from './datetime';

/**
 * A plain-text invoice, so it can go through any app the vendor shares to
 * (WhatsApp, SMS, email) without needing a PDF library.
 */
export const invoiceText = (order: Order, store: Pick<Store, 'name' | 'area' | 'address'>): string => {
  const rule = '------------------------------';
  const lines = order.lines.map(l => {
    const detail = [l.variant, l.options].filter(Boolean).join(', ');
    return `${l.qty} × ${l.name}${detail ? ` (${detail})` : ''}  ${formatAmount(l.price)}`;
  });
  const paid = order.refunded ? 'Refunded' : order.payment === 'cod' ? 'Cash on delivery' : 'Paid online';

  return [
    store.name,
    [store.address, store.area].filter(Boolean).join(', '),
    '',
    `INVOICE #${order.id}`,
    `${dayMonth(order.placedAt)}, ${clock(order.placedAt)}`,
    `Customer: ${order.customer.name}, ${order.customer.area}`,
    rule,
    ...lines,
    rule,
    `Item total: ${formatAmount(order.itemTotal)}`,
    `Packing: ${formatAmount(order.packing)}`,
    `GST: ${formatAmount(order.gst)}`,
    ...(order.coupon ? [`Coupon ${order.coupon.code}: ${formatAmount(-order.coupon.amount)}`] : []),
    `TOTAL: ${formatAmount(order.total)}`,
    `Payment: ${paid}`,
    '',
    'Thank you!',
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n');
};
