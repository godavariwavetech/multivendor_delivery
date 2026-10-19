import { Bike, Calendar, ChevronRight, Store } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ChipRow, DateRangePicker, EmptyState, Pill, Screen, Text, TitleHeader, appAlert, useToast } from '@/components';
import type { PillTone } from '@/components';
import { useFranchise } from '@/data/franchiseStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { FranchiseVendorResult } from '@/domain/types';
import { useFranchiseNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

type Filter = 'all' | 'online' | 'blocked';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'blocked', label: 'Blocked' },
];

const matches = (filter: Filter, row: { online: boolean; blocked: boolean }) =>
  filter === 'all' || (filter === 'online' ? row.online && !row.blocked : row.blocked);

function FilterRow({ value, onChange, counts }: { value: Filter; onChange: (next: Filter) => void; counts: Record<Filter, number> }) {
  return (
    <ChipRow>
      {FILTERS.map(f => (
        <Chip key={f.key} label={`${f.label} · ${counts[f.key]}`} selected={value === f.key} onPress={() => onChange(f.key)} />
      ))}
    </ChipRow>
  );
}

const statusPill = (row: { online: boolean; blocked: boolean }): { label: string; tone: PillTone } =>
  row.blocked ? { label: 'Blocked', tone: 'outline' } : row.online ? { label: 'Online', tone: 'leaf' } : { label: 'Offline', tone: 'neutral' };

/** Asks first: blocking stops the account signing in, which is easy to do by accident on a list. */
function useConfirmBlock() {
  const toast = useToast();
  return (what: string, name: string, blocked: boolean, run: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    appAlert(
      blocked ? `Block ${name}?` : `Unblock ${name}?`,
      blocked ? `This ${what} will be signed out and cannot sign in until you unblock them.` : `This ${what} will be able to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocked ? 'Block' : 'Unblock',
          style: blocked ? 'destructive' : 'default',
          onPress: async () => {
            const result = await run();
            toast(result.ok ? (blocked ? `${name} blocked` : `${name} unblocked`) : result.error);
          },
        },
      ],
    );
}

type Period = { from: Date | null; to: Date | null };

const lastThirtyDays = (): Period => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { from, to };
};

const dayText = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * One vendor's benefit and loss for a period of its own. The calendar icon opens a picker for
 * the From and To dates; each card keeps its own choice, so vendors can be compared over
 * different spans.
 */
function VendorResult({ id }: { id: string }) {
  const { vendorReport, state } = useFranchise();
  const [period, setPeriod] = useState<Period>(lastThirtyDays);
  const [picking, setPicking] = useState(false);
  const [result, setResult] = useState<FranchiseVendorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const from = period.from?.getTime();
  const to = period.to?.getTime();
  // Refetch when the vendor list is replaced by a poll, not on every render.
  const listed = state.vendors.length;

  useEffect(() => {
    if (from === undefined || to === undefined) {
      return;
    }
    let live = true;
    vendorReport(new Date(from), new Date(to), id).then(res => {
      if (!live) {
        return;
      }
      setError(res.ok ? null : res.error);
      if (res.ok) {
        setResult(res.report.vendors[0] ?? null);
      }
    });
    return () => {
      live = false;
    };
    // vendorReport changes on every poll; depending on it would refetch every 15 seconds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, id, listed]);

  return (
    <View style={styles.result}>
      <Pressable onPress={() => setPicking(true)} hitSlop={6} style={styles.periodRow} accessibilityRole="button" accessibilityLabel="Choose period">
        <View style={styles.flex}>
          <Text v="label" muted>
            Benefit & loss
          </Text>
          <Text v="caption" muted numberOfLines={2}>
            {period.from && period.to ? `${dayText(period.from)} – ${dayText(period.to)}` : 'Choose a period'}
          </Text>
        </View>
        <View style={styles.calendar}>
          <Calendar size={20} color={palette.violet} strokeWidth={2.2} />
        </View>
      </Pressable>

      <View style={styles.stats}>
        <Stat label="Benefit" value={formatAmount(result?.earned ?? 0)} detail={`on ${formatAmount(result?.sales ?? 0)} · ${result?.orders ?? 0} orders`} good />
        <Stat
          label="Loss"
          value={formatAmount(result?.lostSales ?? 0)}
          detail={`${result?.cancelled ?? 0} cancelled or rejected`}
          bad={(result?.lostSales ?? 0) > 0}
        />
      </View>
      {error ? (
        <Text v="caption" color={palette.alert}>
          {error}
        </Text>
      ) : null}

      <DateRangePicker
        customOnly
        open={picking}
        onClose={() => setPicking(false)}
        title="Select dates"
        value={period}
        onChange={next => setPeriod(next.from && next.to ? next : lastThirtyDays())}
      />
    </View>
  );
}

/** Vendors linked to this franchise: status, sales, and benefit and loss for a period chosen per vendor. */
export function FranchiseVendorsScreen() {
  const nav = useFranchiseNav();
  const { state, refresh, actions } = useFranchise();
  const [filter, setFilter] = useState<Filter>('all');
  const confirm = useConfirmBlock();
  const rows = state.vendors;
  const counts = {
    all: rows.length,
    online: rows.filter(v => matches('online', v)).length,
    blocked: rows.filter(v => v.blocked).length,
  };
  const shown = rows.filter(v => matches(filter, v));

  return (
    <Screen tab onRefresh={refresh}>
      <TitleHeader title="Vendors" />
      <FilterRow value={filter} onChange={setFilter} counts={counts} />

      {shown.length === 0 ? (
        <EmptyState
          icon={Store}
          title={rows.length ? 'No vendors here' : 'No vendors yet'}
          body={rows.length ? 'Try another filter.' : 'Vendors your admin links to this franchise appear here.'}
        />
      ) : null}

      {shown.map(v => {
        const pill = statusPill(v);
        return (
          <Card key={v.id} onPress={() => nav.navigate('FranchiseVendor', { id: v.id })}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <Text v="cardTitle" numberOfLines={1}>
                  {v.name}
                </Text>
                <Text v="body" muted numberOfLines={1}>
                  {`${CATEGORY_LABEL[v.category]} · ${v.area} · ★ ${v.rating}`}
                </Text>
              </View>
              <Pill label={pill.label} tone={pill.tone} />
              <ChevronRight size={20} color={palette.inkSubtle} strokeWidth={2.2} />
            </View>

            <View style={styles.stats}>
              <Stat label="Today" value={formatAmount(v.salesToday)} detail={`${v.ordersToday} orders`} />
              <Stat label="30 days" value={formatAmount(v.sales30d)} detail={`${v.orders30d} orders`} />
              <Stat label="Open now" value={String(v.openOrders)} detail="orders" />
            </View>

            <VendorResult id={v.id} />

            {!v.kycVerified ? (
              <Text v="caption" color={palette.alert} style={styles.note}>
                KYC pending
              </Text>
            ) : null}
            <Button
              label={v.blocked ? 'Unblock vendor' : 'Block vendor'}
              variant="outline"
              size="sm"
              style={styles.action}
              onPress={() => confirm('vendor', v.name, !v.blocked, () => actions.setVendorBlocked(v.id, !v.blocked))}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

/** Delivery partners linked to this franchise. */
export function FranchisePartnersScreen() {
  const nav = useFranchiseNav();
  const { state, refresh, actions } = useFranchise();
  const [filter, setFilter] = useState<Filter>('all');
  const confirm = useConfirmBlock();
  const rows = state.partners;
  const counts = {
    all: rows.length,
    online: rows.filter(p => matches('online', p)).length,
    blocked: rows.filter(p => p.blocked).length,
  };
  const shown = rows.filter(p => matches(filter, p));

  return (
    <Screen tab onRefresh={refresh}>
      <TitleHeader title="Delivery partners" />
      <FilterRow value={filter} onChange={setFilter} counts={counts} />

      {shown.length === 0 ? (
        <EmptyState
          icon={Bike}
          title={rows.length ? 'No partners here' : 'No partners yet'}
          body={rows.length ? 'Try another filter.' : 'Delivery partners your admin links to this franchise appear here.'}
        />
      ) : null}

      {shown.map(p => {
        const pill = statusPill(p);
        return (
          <Card key={p.id} onPress={() => nav.navigate('FranchisePartner', { id: p.id })}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <Text v="cardTitle" numberOfLines={1}>
                  {p.name}
                </Text>
                <Text v="body" muted numberOfLines={1}>
                  {[p.vehicle, `★ ${p.rating}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pill label={p.onTrip ? 'On a trip' : pill.label} tone={p.onTrip ? 'sky' : pill.tone} />
              <ChevronRight size={20} color={palette.inkSubtle} strokeWidth={2.2} />
            </View>

            <View style={styles.stats}>
              <Stat label="Today" value={String(p.tripsToday)} detail="deliveries" />
              <Stat label="All time" value={String(p.tripsTotal)} detail="deliveries" />
            </View>

            {!p.kycVerified ? (
              <Text v="caption" color={palette.alert} style={styles.note}>
                KYC pending
              </Text>
            ) : null}
            <Button
              label={p.blocked ? 'Unblock partner' : 'Block partner'}
              variant="outline"
              size="sm"
              style={styles.action}
              onPress={() => confirm('partner', p.name, !p.blocked, () => actions.setPartnerBlocked(p.id, !p.blocked))}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

function Stat({ label, value, detail, good, bad }: { label: string; value: string; detail: string; good?: boolean; bad?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text v="label" muted>
        {label}
      </Text>
      <Text v="stat" color={good ? palette.green : bad ? palette.alert : undefined}>
        {value}
      </Text>
      <Text v="caption" muted>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  stat: { flex: 1, gap: 2 },
  result: { marginTop: space.md, gap: space.sm },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  calendar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lilac },
  note: { marginTop: space.sm },
  action: { marginTop: space.md },
});
