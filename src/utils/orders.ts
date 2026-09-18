import type { Order, OrderLine } from '@/domain/types';

import { formatCountdown } from './datetime';

/** Board: vendors have 3 minutes to accept a new order. */
export const ACCEPT_WINDOW_SEC = 180;

export const lineLabel = (l: OrderLine) => `${l.qty} × ${l.name}${l.variant ? ` (${l.variant})` : ''}`;

/** "2 × Chicken Biryani (Full) · 1 × Ennai Kathirikai" */
export const linesSummary = (lines: OrderLine[]) => lines.map(lineLabel).join(' · ');

export const itemCount = (order: Order) => order.lines.reduce((n, l) => n + (l.qty > 5 ? 1 : l.qty), 0);

export const itemsLabel = (order: Order) => {
  const n = itemCount(order);
  return `${n} item${n === 1 ? '' : 's'}`;
};

export const acceptSecondsLeft = (order: Order, now: number) =>
  ACCEPT_WINDOW_SEC - Math.floor((now - order.placedAt) / 1000);

/** Seconds of promised prep time left; negative once the order is late. */
export const prepSecondsLeft = (order: Order, now: number) => {
  if (!order.acceptedAt || !order.prepMinutes) {
    return 0;
  }
  return order.prepMinutes * 60 - Math.floor((now - order.acceptedAt) / 1000);
};

export const prepProgress = (order: Order, now: number) => {
  if (!order.acceptedAt || !order.prepMinutes) {
    return 0;
  }
  return (now - order.acceptedAt) / (order.prepMinutes * 60_000);
};

export const prepLabel = (order: Order, now: number) => {
  const left = prepSecondsLeft(order, now);
  return left >= 0 ? `${formatCountdown(left)} left` : `+${formatCountdown(left)} late`;
};
