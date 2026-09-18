import type { Category, OrderStatus } from './types';

export const CATEGORY_LABEL: Record<Category, string> = {
  food: 'Food',
  grocery: 'Grocery',
  produce: 'Fruits & Veg',
  bakery: 'Bakery',
  meat: 'Meat',
};

export const CATEGORY_LONG_LABEL: Record<Category, string> = {
  food: 'Food',
  grocery: 'Grocery',
  produce: 'Fruits & Vegetables',
  bakery: 'Bakery & Sweets',
  meat: 'Meat & Seafood',
};

export const CATEGORIES: Category[] = ['food', 'grocery', 'produce', 'bakery', 'meat'];

/** Food kitchens "cook"; every other category "packs". */
export const workLabel = (category: Category) => (category === 'food' ? 'Cooking' : 'Packing');

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  cooking: 'Cooking',
  ready: 'Ready',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const REJECT_REASONS = [
  'Item unavailable',
  'Kitchen overloaded',
  'Store closing',
  'Cannot meet the delivery time',
] as const;

export const DELIVERY_FAILURE_REASONS = [
  'Customer unavailable',
  'Customer not answering calls',
  'Wrong or incomplete address',
  'Customer refused the order',
  'Unable to reach the location',
] as const;
