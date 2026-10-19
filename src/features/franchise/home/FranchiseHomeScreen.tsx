import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, DayBars, HomeHeader, Screen, SectionHeader, StatTile, Text, TileRow } from '@/components';
import { useFranchise } from '@/data/franchiseStore';
import { useFranchiseNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

/** Franchise home: today's commission, the area's orders, and the vendors and partners under it. */
export function FranchiseHomeScreen() {
  const nav = useFranchiseNav();
  const { state, refresh } = useFranchise();
  const { profile, today, days, vendors, partners } = state;

  const peak = Math.max(1, ...days.map(d => d.sales));

  // Best earner first; vendors with no sales yet keep the list's own (alphabetical) order.
  const ranked = [...vendors].sort((a, b) => b.earned30d - a.earned30d);
  const attention = [
    ...partners.filter(p => p.blocked).map(p => `${p.name} (partner) is blocked`),
    ...vendors.filter(v => v.blocked).map(v => `${v.name} is blocked`),
    ...vendors.filter(v => !v.kycVerified).map(v => `${v.name}: KYC pending`),
    ...partners.filter(p => !p.kycVerified).map(p => `${p.name} (partner): KYC pending`),
    ...vendors.filter(v => !v.online && !v.blocked).map(v => `${v.name} is offline`),
  ];
  const bars = days.map((d, i) => ({
    day: d.label,
    value: d.sales / peak,
    tone: i === days.length - 1 ? ('dark' as const) : d.sales >= peak * 0.6 ? ('mid' as const) : ('light' as const),
  }));

  return (
    <Screen tab onRefresh={refresh}>
      <HomeHeader
        initials={profile.initials || '··'}
        name={profile.name || 'Franchise'}
        status={[profile.territory, profile.area].filter(Boolean).join(' · ')}
        onBell={() => nav.navigate('Notifications')}
      />

      <Card tone="accent" style={styles.hero}>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          Your commission today
        </Text>
        <Text v="hero" color={palette.white} style={styles.heroValue}>
          {formatAmount(today.earned)}
        </Text>
        <Text v="body" color="rgba(255, 255, 255, 0.86)">
          {`${profile.commissionPct}% of ${formatAmount(today.sales)} delivered sales`}
        </Text>
      </Card>

      <TileRow>
        <StatTile tone="sky" value={String(today.orders)} label="Delivered" />
        <StatTile tone="lavender" value={String(today.liveOrders)} label="In progress" onPress={() => nav.navigate('FranchiseTabs', { screen: 'Vendors' })} />
        <StatTile tone="mint" value={formatAmount(today.sales)} label="Sales" />
      </TileRow>

      <Card>
        <View style={styles.row}>
          <Text v="cardTitle">Daily sales</Text>
          <Text v="body" muted>
            Last 7 days
          </Text>
        </View>
        {days.some(d => d.sales > 0) ? <DayBars data={bars} /> : <Text v="body" muted>No deliveries in the last 7 days.</Text>}
      </Card>

      <Card onPress={() => nav.navigate('FranchiseTabs', { screen: 'Vendors' })}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">{`${today.vendorsOnline} of ${vendors.length} vendors online`}</Text>
            <Text v="body" muted>
              {vendors.filter(v => v.blocked).length ? `${vendors.filter(v => v.blocked).length} blocked` : 'Stores in your area'}
            </Text>
          </View>
          <ChevronRight size={22} color={palette.inkSubtle} strokeWidth={2.2} />
        </View>
      </Card>

      <Card onPress={() => nav.navigate('FranchiseTabs', { screen: 'Partners' })}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text v="cardTitle">{`${today.partnersOnline} of ${partners.length} delivery partners online`}</Text>
            <Text v="body" muted>
              {`${partners.filter(p => p.onTrip).length} on a delivery right now`}
            </Text>
          </View>
          <ChevronRight size={22} color={palette.inkSubtle} strokeWidth={2.2} />
        </View>
      </Card>

      {attention.length ? (
        <Card tone="highlight">
          <Text v="cardTitle">Needs attention</Text>
          {attention.slice(0, 4).map(line => (
            <Text key={line} v="body" muted>
              {line}
            </Text>
          ))}
          {attention.length > 4 ? (
            <Text v="caption" muted>{`and ${attention.length - 4} more`}</Text>
          ) : null}
        </Card>
      ) : null}

      {ranked.length ? (
        <>
          <SectionHeader title="Vendor performance · 30 days" />
          <Card>
            {ranked.map((v, i) => (
              <Pressable
                key={v.id}
                onPress={() => nav.navigate('FranchiseVendor', { id: v.id })}
                style={[styles.vendorRow, i > 0 && styles.vendorDivider]}
                accessibilityRole="button"
              >
                <View style={styles.flex}>
                  <Text v="cardTitle" numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text v="caption" muted numberOfLines={1}>
                    {`${v.openOrders} open now · ${v.orders30d} delivered`}
                  </Text>
                </View>
                <View style={styles.amounts}>
                  <Text v="stat" color={palette.green}>
                    {formatAmount(v.earned30d)}
                  </Text>
                  <Text v="caption" color={v.lostSales30d > 0 ? palette.alert : undefined} muted={v.lostSales30d === 0}>
                    {`Loss ${formatAmount(v.lostSales30d)}`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.xl, borderRadius: 26, gap: 2 },
  heroValue: { fontSize: 34, lineHeight: 40, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  flex: { flex: 1 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  vendorDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  amounts: { alignItems: 'flex-end' },
});
