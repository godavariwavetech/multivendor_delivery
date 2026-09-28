import type { Account } from '@/domain/types';

/**
 * The Food account demonstrates the workspace picker. Category stores are
 * vendor-only; one delivery account tests all V1 pickup categories.
 */
export const DEMO_ACCOUNTS: Account[] = [
  {
    mobile: '9840721536',
    roles: ['vendor', 'delivery'],
    vendor: { storeName: "Amma's Kitchen", area: 'Anna Nagar', category: 'food' },
    partner: { name: 'Ravi Kumar', zone: 'Zone 4 · Chennai North' },
  },
  {
    mobile: '9840700001',
    roles: ['vendor'],
    vendor: { storeName: 'Sri Balaji Stores', area: 'Anna Nagar East', category: 'grocery' },
  },
  {
    mobile: '9840700002',
    roles: ['vendor'],
    vendor: { storeName: 'Green Farm Mandi', area: 'Koyambedu', category: 'produce' },
    partner: { name: 'Ravi Kumar', zone: 'Zone 4 · Chennai North' },
  },
  {
    mobile: '9840700003',
    roles: ['vendor'],
    vendor: { storeName: 'Anna Nagar Bakes', area: 'Anna Nagar', category: 'bakery' },
    partner: { name: 'Suresh M.', zone: 'Zone 4, Chennai North' },
  },
  {
    mobile: '9840700004',
    roles: ['vendor'],
    vendor: { storeName: 'Marina Fresh Meats', area: 'Triplicane', category: 'meat' },
    partner: { name: 'Fathima N.', zone: 'Zone 1, Chennai Central' },
  },
  {
    mobile: '9840700005',
    roles: ['delivery'],
    partner: { name: 'Karthik R.', zone: 'Zone 4, Chennai North' },
  },
];

export const findAccount = (mobile: string) =>
  DEMO_ACCOUNTS.find(a => a.mobile === mobile.replace(/\D/g, '').slice(-10));

export const PARTNER_PROFILE = {
  name: 'Ravi Kumar',
  initials: 'RK',
  id: 'DP-4471',
  mobile: '+91 98407 21536',
  rating: 4.8,
  trips: 1842,
  onTime: 96,
  acceptance: 88,
  cancels: 2,
  vehicle: 'TN 09 BX 4412',
  vehicleType: 'Bike · Honda Activa 6G',
  licence: 'TN09 2019 0001234',
  aadhaar: '•••• •••• 7781',
  pan: 'ABCDE••34F',
  kycVerified: true,
  licenceValid: 'Verified',
  bank: 'SBI ••7782',
  ifsc: 'SBIN0001234',
  zone: 'Zone 4',
  zoneArea: 'Chennai North',
  shift: 'evenings',
};
