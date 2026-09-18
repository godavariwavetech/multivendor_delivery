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

export const paymentLine = (req: DeliveryRequest) =>
  req.payment === 'cod'
    ? { title: `${req.items} items · Collect ₹${req.codAmount} cash`, subtitle: 'COD · exact change advised', pill: 'COD', paid: false }
    : { title: `${req.items} items · ₹${req.orderTotal} · Prepaid`, subtitle: 'Nothing to collect from customer', pill: 'Paid', paid: true };
