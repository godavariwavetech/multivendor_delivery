import type { Account } from '@/domain/types';

/**
 * Demo logins. Any password of 4+ characters and any 6-digit OTP is accepted.
 * The first account holds both roles, so it sees the workspace picker (board 1a).
 */
export const DEMO_ACCOUNTS: Account[] = [
  {
    mobile: '9840721536',
    roles: ['vendor', 'delivery'],
    vendor: { storeName: "Amma's Kitchen", area: 'Anna Nagar' },
    partner: { name: 'Ravi Kumar', zone: 'Zone 4 · Chennai North' },
  },
  {
    mobile: '9840700001',
    roles: ['vendor'],
    vendor: { storeName: "Amma's Kitchen", area: 'Anna Nagar' },
  },
  {
    mobile: '9840700002',
    roles: ['delivery'],
    partner: { name: 'Ravi Kumar', zone: 'Zone 4 · Chennai North' },
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
