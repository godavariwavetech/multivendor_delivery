import type { ActiveTrip, DeliveryRequest } from '@/domain/types';

const MIN = 60_000;

/** Minutes left in a food order's delivery window since pickup; null for other categories. */
export function keepHotMinutesLeft(trip: ActiveTrip, req: DeliveryRequest, now: number) {
  if (req.pickup.kind !== 'food' || !trip.pickedUpAt) {
    return null;
  }
  return Math.max(0, Math.round(req.pickup.deliverWithinMin - (now - trip.pickedUpAt) / MIN));
}

export function tripStatusPill(trip: ActiveTrip, req: DeliveryRequest, now: number) {
  switch (trip.stage) {
    case 'to_store':
      return 'Heading to store';
    case 'at_store':
      return 'At the store';
    case 'on_the_way': {
      const left = keepHotMinutesLeft(trip, req, now);
      return left === null ? 'Out for delivery' : `Keep hot · ${left} min`;
    }
    case 'arrived':
      return 'At customer';
    default:
      return 'Delivered';
  }
}

/** When the store expects the order to be ready, measured from acceptance. */
export const readyAt = (trip: ActiveTrip, req: DeliveryRequest) => trip.acceptedAt + req.readyInMin * MIN;

/** Arrival target: matched to the kitchen's ready time, never earlier than the ride takes. */
export const arriveBy = (trip: ActiveTrip, req: DeliveryRequest) =>
  Math.max(readyAt(trip, req), trip.acceptedAt + Math.round(req.store.distanceKm * 4) * MIN);

export const etaAt = (trip: ActiveTrip, req: DeliveryRequest, now: number) =>
  (trip.pickedUpAt ?? now) + req.etaMin * MIN;

/**
 * The dishes in a request. The server sends them as `itemNames`; a server that does not yet
 * still lists them inside the pickup sheet of a produce or meat order, so those are used instead.
 */
export const requestItemNames = (req: DeliveryRequest): string | undefined => {
  if (req.itemNames) {
    return req.itemNames;
  }
  const pickup = req.pickup;
  if (pickup.kind === 'produce') {
    return pickup.weighed.map(w => w.name).join(', ') || undefined;
  }
  if (pickup.kind === 'meat') {
    return pickup.lines.map(l => `${l.name} (${l.weight})`).join(', ') || undefined;
  }
  return undefined;
};

const rupees = (n: number) => `₹${Math.round(n * 100) / 100}`;

/** The full payment detail shown when the payment card is tapped. */
export const paymentDetail = (req: DeliveryRequest) => {
  const bill = req.bill;
  const how =
    req.payment === 'cod' ? `Cash on delivery · collect ${rupees(req.codAmount ?? req.orderTotal)}` : 'Prepaid · nothing to collect';
  if (!bill) {
    // A server that does not send the bill yet: the total is still known.
    return [requestItemNames(req), `${req.items} items`, `Order total ${rupees(req.orderTotal)}`, how].filter(Boolean).join('\n');
  }
  const lines = bill.lines.map(
    l => `${l.qty > 1 ? `${l.qty} × ` : ''}${l.name}${l.variant ? ` (${l.variant})` : ''} — ${rupees(l.amount)}`,
  );
  const charges: [string, number][] = [
    ['Item total', bill.itemTotal],
    ['Packing', bill.packing],
    ['GST', bill.tax],
    ['Delivery', bill.delivery],
    ['Tip', bill.tip],
  ];
  const rows = charges.filter(([, amount]) => amount > 0).map(([label, amount]) => `${label}: ${rupees(amount)}`);
  if (bill.discount > 0) {
    rows.push(`Discount${bill.couponCode ? ` (${bill.couponCode})` : ''}: −${rupees(bill.discount)}`);
  }
  return [...lines, '', ...rows, `Total: ${rupees(bill.total)}`, '', how].join('\n');
};

export const paymentLine = (req: DeliveryRequest) =>
  req.payment === 'cod'
    ? { title: `${req.items} items · Collect ₹${req.codAmount} cash`, subtitle: 'COD · exact change advised', pill: 'COD', paid: false }
    : { title: `${req.items} items · ₹${req.orderTotal} · Prepaid`, subtitle: 'Nothing to collect from customer', pill: 'Paid', paid: true };
