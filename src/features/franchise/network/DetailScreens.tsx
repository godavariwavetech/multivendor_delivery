import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Bike, Store } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { BackHeader, Button, Card, EmptyState, KeyValue, Pill, Screen, SectionHeader, StatTile, Text, TileRow, appAlert, useToast } from '@/components';
import type { PillTone } from '@/components';
import { useFranchise } from '@/data/franchiseStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { FranchisePartnerDetail, FranchiseVendorDetail } from '@/domain/types';
import type { FranchiseParams } from '@/navigation/types';
import { useFranchiseNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

const dateText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const dateTimeText = (iso: string | null) =>
  iso ? `${dateText(iso)}, ${new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '';

const cap = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

type Row = [label: string, value: string | undefined | null];

/** Label/value lines for one group; anything the vendor hasn't filled in is left out rather than shown blank. */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  const shown = rows.filter((r): r is [string, string] => Boolean(r[1]));
  if (shown.length === 0) {
    return null;
  }
  return (
    <>
      <SectionHeader title={title} />
      <Card>
        {shown.map(([label, value]) => (
          <View key={label} style={styles.fact}>
            <Text v="body" muted style={styles.factLabel}>
              {label}
            </Text>
            <Text v="body" style={styles.factValue}>
              {value}
            </Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function statusTone(status: string): PillTone {
  return status === 'delivered' ? 'leaf' : status === 'cancelled' || status === 'rejected' || status === 'failed' ? 'outline' : 'neutral';
}

const statusLabel = (status: string) => (status === 'in_progress' ? 'In progress' : cap(status.replace('_', ' ')));

/** Loads one record by id; the screens show a message instead of a blank page when it can't be had. */
function useDetail<T>(load: (id: string) => Promise<{ ok: true; detail: T } | { ok: false; error: string }>, id: string) {
  const [detail, setDetail] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = React.useCallback(async () => {
    const res = await load(id);
    if (res.ok) {
      setDetail(res.detail);
      setError(null);
    } else {
      setError(res.error);
    }
    setLoading(false);
    // load changes whenever the franchise state is polled; the id is what picks the record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { detail, error, loading, reload };
}

function useCall() {
  const toast = useToast();
  return (mobile: string) => Linking.openURL(`tel:${mobile.replace(/\s/g, '')}`).catch(() => toast('Could not open the dialler.'));
}

/** Everything about one vendor of this franchise. */
export function FranchiseVendorScreen() {
  const nav = useFranchiseNav();
  const { params } = useRoute<RouteProp<FranchiseParams, 'FranchiseVendor'>>();
  const { vendorDetail, state, actions } = useFranchise();
  const { detail: v, error, loading, reload } = useDetail<FranchiseVendorDetail>(vendorDetail, params.id);
  const call = useCall();
  const toast = useToast();
  // The list is polled, so a block made here shows up in it; use that for the live flag.
  const listed = state.vendors.find(x => x.id === params.id);
  const blocked = listed?.blocked ?? v?.blocked ?? false;

  if (!v) {
    return (
      <Screen>
        <BackHeader title="Vendor" onBack={nav.goBack} />
        <EmptyState icon={Store} title={loading ? 'Loading…' : "Couldn't load this vendor"} body={loading ? 'Getting the details.' : error ?? 'Try again in a moment.'} />
      </Screen>
    );
  }

  const confirmBlock = () =>
    appAlert(
      blocked ? `Unblock ${v.name}?` : `Block ${v.name}?`,
      blocked ? 'This vendor will be able to sign in again.' : 'This vendor will be signed out and cannot sign in until you unblock them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocked ? 'Unblock' : 'Block',
          style: blocked ? 'default' : 'destructive',
          onPress: async () => {
            const result = await actions.setVendorBlocked(v.id, !blocked);
            toast(result.ok ? (blocked ? 'Vendor unblocked' : 'Vendor blocked') : result.error);
            reload();
          },
        },
      ],
    );

  const status = blocked ? 'Blocked' : v.online ? 'Online' : 'Offline';
  const statusPillTone: PillTone = blocked ? 'outline' : v.online ? 'leaf' : 'neutral';

  return (
    <Screen onRefresh={reload}>
      <BackHeader title={v.name} subtitle={[CATEGORY_LABEL[v.category], v.code].filter(Boolean).join(' · ')} onBack={nav.goBack} pill={status} pillTone={statusPillTone} />

      <Card>
        <View style={styles.pills}>
          <Pill label={`★ ${v.rating}`} tone="soft" />
          <Pill label={v.kycVerified ? 'KYC verified' : 'KYC pending'} tone={v.kycVerified ? 'leaf' : 'outline'} />
          {v.busy ? <Pill label="Busy" tone="neutral" /> : null}
        </View>
      </Card>

      <SectionHeader title={`Orders · ${v.totals.orders} in all`} />
      <TileRow>
        <StatTile tone="sky" value={String(v.totals.accepted)} label="Accepted" />
        <StatTile tone="mint" value={String(v.totals.delivered)} label="Delivered" />
      </TileRow>
      <TileRow>
        <StatTile tone="lavender" value={String(v.totals.inProcess)} label="In process" />
        <StatTile value={String(v.totals.rejected)} label="Rejected" />
      </TileRow>
      <Card>
        <KeyValue label="Waiting for the vendor to respond" value={String(v.totals.waiting)} />
        <KeyValue label="Cancelled" value={String(v.totals.cancelled)} />
      </Card>

      <SectionHeader title="Benefit & loss · all time" />
      <Card>
        <View style={styles.pair}>
          <View style={styles.flex}>
            <Text v="label" muted>
              Benefit
            </Text>
            <Text v="stat" color={palette.green}>
              {formatAmount(v.totals.earned)}
            </Text>
            <Text v="caption" muted>{`on ${formatAmount(v.totals.sales)} delivered sales`}</Text>
          </View>
          <View style={styles.flex}>
            <Text v="label" muted>
              Loss
            </Text>
            <Text v="stat" color={v.totals.lostSales > 0 ? palette.alert : undefined}>
              {formatAmount(v.totals.lostSales)}
            </Text>
            <Text v="caption" muted>{`${v.totals.cancelled + v.totals.rejected} cancelled or rejected`}</Text>
          </View>
        </View>
      </Card>

      <Group
        title="Contact"
        rows={[
          ['Mobile', v.mobile],
          ['Alternate mobile', v.mobile2],
          ['Email', v.email],
        ]}
      />
      <Group
        title="Store"
        rows={[
          ['Address', v.address],
          ['Area', v.area],
          ['Hours', v.hours],
          ['Weekly holiday', v.weeklyHoliday],
          ['Platform commission', v.platformCommissionPct ? `${v.platformCommissionPct}%` : ''],
          ['Joined', dateText(v.joined)],
        ]}
      />
      <Group
        title="Licences & tax"
        rows={[
          ['FSSAI', v.licences.fssai],
          ['GST', v.licences.gst],
          ['Trade licence', v.licences.trade],
          ['Drug licence', v.licences.drug],
          ['PAN', v.licences.pan],
        ]}
      />
      <Group
        title="Payout account"
        rows={[
          ['Account holder', v.bank.holder],
          ['Bank', v.bank.bank],
          ['Account', v.bank.account],
          ['IFSC', v.bank.ifsc],
          ['UPI', v.bank.upi],
        ]}
      />

      <SectionHeader title="Recent orders" />
      {v.recent.length === 0 ? (
        <Text v="body" muted>
          No orders yet.
        </Text>
      ) : (
        v.recent.map(o => (
          <Card key={o.number}>
            <View style={styles.line}>
              <View style={styles.flex}>
                <Text v="cardTitle">{`#${o.number}`}</Text>
                <Text v="caption" muted>
                  {dateTimeText(o.deliveredAt ?? o.placedAt)}
                </Text>
              </View>
              <View style={styles.right}>
                <Text v="stat">{formatAmount(o.amount)}</Text>
                <Pill label={cap(o.status.replace('_', ' '))} tone={statusTone(o.status)} />
              </View>
            </View>
          </Card>
        ))
      )}

      <View style={styles.actions}>
        {v.mobile ? <Button label="Call vendor" variant="outline" flex={1} onPress={() => call(v.mobile)} /> : null}
        <Button label={blocked ? 'Unblock vendor' : 'Block vendor'} variant="outline" flex={1} onPress={confirmBlock} />
      </View>
    </Screen>
  );
}

/** Everything about one delivery partner of this franchise. */
export function FranchisePartnerScreen() {
  const nav = useFranchiseNav();
  const { params } = useRoute<RouteProp<FranchiseParams, 'FranchisePartner'>>();
  const { partnerDetail, state, actions } = useFranchise();
  const { detail: p, error, loading, reload } = useDetail<FranchisePartnerDetail>(partnerDetail, params.id);
  const call = useCall();
  const toast = useToast();
  const listed = state.partners.find(x => x.id === params.id);
  const blocked = listed?.blocked ?? p?.blocked ?? false;

  if (!p) {
    return (
      <Screen>
        <BackHeader title="Delivery partner" onBack={nav.goBack} />
        <EmptyState icon={Bike} title={loading ? 'Loading…' : "Couldn't load this partner"} body={loading ? 'Getting the details.' : error ?? 'Try again in a moment.'} />
      </Screen>
    );
  }

  const confirmBlock = () =>
    appAlert(
      blocked ? `Unblock ${p.name}?` : `Block ${p.name}?`,
      blocked ? 'This partner will be able to sign in again.' : 'This partner will be signed out and cannot sign in until you unblock them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocked ? 'Unblock' : 'Block',
          style: blocked ? 'default' : 'destructive',
          onPress: async () => {
            const result = await actions.setPartnerBlocked(p.id, !blocked);
            toast(result.ok ? (blocked ? 'Partner unblocked' : 'Partner blocked') : result.error);
            reload();
          },
        },
      ],
    );

  const status = blocked ? 'Blocked' : p.totals.active > 0 ? 'On a trip' : p.online ? 'Online' : 'Offline';
  const statusPillTone: PillTone = blocked ? 'outline' : p.totals.active > 0 ? 'sky' : p.online ? 'leaf' : 'neutral';

  return (
    <Screen onRefresh={reload}>
      <BackHeader
        title={p.name}
        subtitle={[cap(p.vehicleType), p.vehicleNumber].filter(Boolean).join(' · ')}
        onBack={nav.goBack}
        pill={status}
        pillTone={statusPillTone}
      />

      <Card>
        <View style={styles.pills}>
          <Pill label={`★ ${p.rating}`} tone="soft" />
          <Pill label={p.kycVerified ? 'KYC verified' : 'KYC pending'} tone={p.kycVerified ? 'leaf' : 'outline'} />
          {p.zone ? <Pill label={p.zone} tone="neutral" /> : null}
        </View>
      </Card>

      <TileRow>
        <StatTile small label="Today" value={String(p.totals.today)} />
        <StatTile small label="Delivered" value={String(p.totals.delivered)} />
        <StatTile small label="Failed" value={String(p.totals.failed)} />
      </TileRow>

      <SectionHeader title="Deliveries · all time" />
      <Card>
        <KeyValue label="Distance covered" value={`${p.totals.distanceKm} km`} />
        <KeyValue label="Delivery pay earned" value={formatAmount(p.totals.pay)} strong />
      </Card>

      <Group
        title="Contact"
        rows={[
          ['Mobile', p.mobile],
          ['Address', p.address],
          ['Area', p.area],
        ]}
      />
      <Group
        title="Work"
        rows={[
          ['Zone', p.zone],
          ['Shift', cap(p.shift)],
          ['Vehicle', [cap(p.vehicleType), p.vehicleNumber].filter(Boolean).join(' · ')],
          ['Online since', p.onlineSince ? dateTimeText(p.onlineSince) : ''],
          ['Joined', dateText(p.joined)],
        ]}
      />
      <Group
        title="Documents"
        rows={[
          ['Aadhaar', p.documents.aadhaar],
          ['Driving licence', p.documents.licence],
          ['PAN', p.documents.pan],
        ]}
      />
      <Group
        title="Payout account"
        rows={[
          ['Account', p.bank.account],
          ['IFSC', p.bank.ifsc],
        ]}
      />

      <SectionHeader title="Recent deliveries" />
      {p.recent.length === 0 ? (
        <Text v="body" muted>
          No deliveries yet.
        </Text>
      ) : (
        p.recent.map(r => (
          <Card key={r.number}>
            <View style={styles.line}>
              <View style={styles.flex}>
                <Text v="cardTitle">{`#${r.number}`}</Text>
                <Text v="caption" muted>
                  {[dateTimeText(r.at), r.distanceKm ? `${r.distanceKm} km` : ''].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.right}>
                <Text v="stat">{formatAmount(r.pay)}</Text>
                <Pill label={statusLabel(r.status)} tone={statusTone(r.status)} />
              </View>
            </View>
          </Card>
        ))
      )}

      <View style={styles.actions}>
        {p.mobile ? <Button label="Call partner" variant="outline" flex={1} onPress={() => call(p.mobile)} /> : null}
        <Button label={blocked ? 'Unblock partner' : 'Block partner'} variant="outline" flex={1} onPress={confirmBlock} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: 6 },
  factLabel: { width: 124 },
  factValue: { flex: 1, textAlign: 'right' },
  flex: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pair: { flexDirection: 'row', gap: space.lg },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  right: { alignItems: 'flex-end', gap: 4 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md },
});
