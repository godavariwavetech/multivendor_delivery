import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React from 'react';

import { BackHeader, Banner, Button, Card, KeyValue, NoteBox, Screen, SectionLabel, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { useVendor } from '@/data/vendorStore';
import { useSharedNav } from '@/navigation/types';

type Params = { BankAccount: { role: 'vendor' | 'delivery' } };

const ACCOUNTS = {
  vendor: {
    bank: 'HDFC Bank',
    masked: '••••••••4412',
    holder: 'Amma Kitchen Foods',
    ifsc: 'HDFC0000123',
  },
  delivery: {
    bank: 'State Bank of India',
    masked: '••••••••7782',
    holder: 'Ravi Kumar',
    ifsc: 'SBIN0001234',
  },
};

/** Partners have no bank name stored, only the IFSC it starts with. */
const BANK_NAMES: Record<string, string> = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  IOBA: 'Indian Overseas Bank',
  IDIB: 'Indian Bank',
};

/** Vendor SRS 9 / Delivery SRS 2 — the account payouts are sent to. */
export function BankAccountScreen() {
  const nav = useSharedNav();
  const toast = useToast();
  const { params } = useRoute<RouteProp<Params, 'BankAccount'>>();
  const vendor = useVendor();
  const delivery = useDelivery();
  const fallback = ACCOUNTS[params.role];
  const stored = params.role === 'vendor' ? vendor.state.details?.bank : undefined;
  const a =
    params.role === 'vendor'
      ? {
          ...fallback,
          bank: stored?.bank ?? fallback.bank,
          masked: stored?.account ?? fallback.masked,
          holder: stored?.holder ?? fallback.holder,
          ifsc: stored?.ifsc ?? fallback.ifsc,
        }
      : {
          ...fallback,
          bank: BANK_NAMES[delivery.profile.ifsc.slice(0, 4).toUpperCase()] ?? delivery.profile.bank ?? fallback.bank,
          masked: delivery.profile.bank ? `••••••••${delivery.profile.bank.slice(-4)}` : fallback.masked,
          holder: delivery.profile.name || fallback.holder,
          ifsc: delivery.profile.ifsc || fallback.ifsc,
        };

  return (
    <Screen
      footer={
        <Button label="Change bank account" variant="outline" flex={1} onPress={() => toast('Bank changes need OTP and admin approval')} />
      }>
      <BackHeader title="Bank account" subtitle="Where your payouts go" onBack={nav.goBack} />
      <Banner tone="mint" title="Payouts reach this account" body="Every settled cycle is paid here automatically." />
      <Card>
        <SectionLabel>Account</SectionLabel>
        <KeyValue label="Bank" value={a.bank} strong />
        <KeyValue label="Account number" value={a.masked} strong />
        <KeyValue label="Account holder" value={a.holder} />
        <KeyValue label="IFSC" value={a.ifsc} />
      </Card>
      <NoteBox>For your safety we never ask for your full account number or UPI PIN on calls.</NoteBox>
    </Screen>
  );
}
