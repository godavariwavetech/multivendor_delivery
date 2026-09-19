import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';

import { apiClient, endpoints } from '@/api';
import { BackHeader, Banner, Button, Card, KeyValue, NoteBox, Screen, SectionLabel, Text, TextField, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { useVendor } from '@/data/vendorStore';
import { useSharedNav } from '@/navigation/types';
import { palette, space } from '@/theme';

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

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** The bank an IFSC belongs to, by its first four characters. */
const bankFromIfsc = (ifsc: string) => BANK_NAMES[ifsc.slice(0, 4).toUpperCase()] ?? '';

/** Vendor SRS 9 / Delivery SRS 2 — the account payouts are sent to. */
export function BankAccountScreen() {
  const nav = useSharedNav();
  const toast = useToast();
  const { params } = useRoute<RouteProp<Params, 'BankAccount'>>();
  const vendor = useVendor();
  const delivery = useDelivery();
  const isVendor = params.role === 'vendor';
  const fallback = ACCOUNTS[params.role];
  const stored = isVendor ? vendor.state.details?.bank : undefined;
  const a = isVendor
    ? {
        ...fallback,
        bank: stored?.bank ?? fallback.bank,
        masked: stored?.account ?? fallback.masked,
        holder: stored?.holder ?? fallback.holder,
        ifsc: stored?.ifsc ?? fallback.ifsc,
      }
    : {
        ...fallback,
        bank: bankFromIfsc(delivery.profile.ifsc) || delivery.profile.bank || fallback.bank,
        masked: delivery.profile.bank ? `••••••••${delivery.profile.bank.slice(-4)}` : fallback.masked,
        holder: delivery.profile.name || fallback.holder,
        ifsc: delivery.profile.ifsc || fallback.ifsc,
      };

  const [editing, setEditing] = useState(false);
  const [account, setAccount] = useState('');
  const [confirm, setConfirm] = useState('');
  const [holder, setHolder] = useState(a.holder === '—' ? '' : a.holder);
  const [ifsc, setIfsc] = useState(a.ifsc === '—' ? '' : a.ifsc);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = () => {
    setAccount('');
    setConfirm('');
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const digits = account.replace(/\D/g, '');
    const code = ifsc.trim().toUpperCase();
    if (!/^\d{9,18}$/.test(digits)) {
      return setError('Enter the account number — 9 to 18 digits.');
    }
    if (digits !== confirm.replace(/\D/g, '')) {
      return setError('The two account numbers do not match.');
    }
    if (!IFSC.test(code)) {
      return setError('Enter a valid IFSC code, for example HDFC0000123.');
    }
    if (isVendor && !holder.trim()) {
      return setError("Enter the account holder's name.");
    }

    setBusy(true);
    setError(null);
    try {
      await apiClient.post(endpoints.auth.updateBank, {
        accountNumber: digits,
        ifsc: code,
        holder: holder.trim(),
        bank: bankFromIfsc(code),
      });
      // Pull the stored values back, so the card shows what the server kept.
      await (isVendor ? vendor.refresh() : delivery.refresh());
      toast('Bank account updated');
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the bank account.');
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    const named = bankFromIfsc(ifsc);
    return (
      <Screen
        footer={
          <>
            <Button label="Cancel" variant="outline" flex={1} onPress={() => setEditing(false)} disabled={busy} />
            <Button label={busy ? 'Saving…' : 'Save account'} flex={1.8} onPress={save} disabled={busy} />
          </>
        }>
        <BackHeader title="Change bank account" subtitle="Where your payouts go" onBack={() => setEditing(false)} />
        <Card>
          <SectionLabel>New account</SectionLabel>
          <TextField
            label="Account number"
            value={account}
            onChangeText={setAccount}
            keyboardType="number-pad"
            placeholder="9 to 18 digits"
            maxLength={18}
            style={styles.field}
          />
          <TextField
            label="Re-enter account number"
            value={confirm}
            onChangeText={setConfirm}
            keyboardType="number-pad"
            placeholder="Type it again"
            maxLength={18}
            style={styles.field}
          />
          <TextField
            label="IFSC"
            value={ifsc}
            onChangeText={v => setIfsc(v.toUpperCase())}
            placeholder="HDFC0000123"
            maxLength={11}
            style={styles.field}
          />
          {named ? (
            <Text v="caption" muted style={styles.hint}>
              {named}
            </Text>
          ) : null}
          {isVendor ? (
            <TextField
              label="Account holder"
              value={holder}
              onChangeText={setHolder}
              placeholder="Name as printed in the passbook"
              maxLength={80}
              style={styles.field}
            />
          ) : null}
          {error ? (
            <Text v="caption" color={palette.alert} style={styles.hint}>
              {error}
            </Text>
          ) : null}
        </Card>
        <NoteBox>Payouts go to this account from the next settled cycle. Check the number before saving.</NoteBox>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Change bank account" variant="outline" flex={1} onPress={start} />}>
      <BackHeader title="Bank account" subtitle="Where your payouts go" onBack={nav.goBack} />
      <Banner tone="leaf" title="Payouts reach this account" body="Every settled cycle is paid here automatically." />
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

const styles = {
  field: { marginTop: space.md },
  hint: { marginTop: space.sm },
} as const;
