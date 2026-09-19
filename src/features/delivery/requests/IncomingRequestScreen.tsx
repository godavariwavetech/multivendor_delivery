import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Button, CountdownRing, Divider, RouteTimeline, Text, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav, useDeliveryRoute } from '@/navigation/types';
import { palette, radius, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock } from '@/utils/datetime';

import { RESPOND_SECONDS } from './RequestsScreen';

/** Board 1c·2 / 3b·1 — a request sheet over a dimmed screen, with a 20-second ring. */
export function IncomingRequestScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const now = useNow(250);
  const { params } = useDeliveryRoute<'IncomingRequest'>();
  const { request, state, actions } = useDelivery();
  const r = request(params.id);
  const [openedAt] = useState(() => Date.now());

  const left = RESPOND_SECONDS - (now - openedAt) / 1000;
  const busy = Boolean(state.active && state.active.stage !== 'complete');

  useEffect(() => {
    if (left <= 0 && r?.status === 'open') {
      actions.skip(r.id);
      toast('Request expired · reassigned');
      nav.goBack();
    }
  }, [actions, left, nav, r, toast]);

  if (!r) {
    return null;
  }

  const food = r.category === 'food';
  const title = food ? 'Food pickup' : `${CATEGORY_LABEL[r.category]} pickup`;
  const extra = r.pickup.kind === 'food' ? 'hot bag' : r.pickup.kind === 'meat' ? 'cold bag' : r.pickup.kind === 'bakery' ? 'fragile' : r.payment === 'cod' ? 'cash' : 'no cash';

  const accept = () => {
    if (busy) {
      toast('Finish your active delivery first');
      return;
    }
    actions.accept(r.id);
    nav.goBack();
    nav.navigate('DeliveryTabs', { screen: 'Active' });
  };

  return (
    <View style={styles.backdrop}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.ghosts, { paddingTop: insets.top + space.xl }]}>
        <View style={[styles.ghost, styles.ghostSmall]} />
        <View style={[styles.ghost, styles.ghostMid]} />
        <View style={[styles.ghost, styles.ghostLarge]} />
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.head}>
          <CountdownRing seconds={left} total={RESPOND_SECONDS} />
          <View style={styles.flex}>
            <Text v="displaySm">{title}</Text>
            <Text v="body" muted>{`Respond in ${Math.max(0, Math.ceil(left))} seconds`}</Text>
          </View>
          <View style={styles.payout}>
            <Text v="display" color={palette.greenDeep}>
              {formatAmount(r.payout)}
            </Text>
            <Text v="caption" muted>
              payout
            </Text>
          </View>
        </View>

        {food && r.readyInMin > 0 ? (
          <Banner
            tone="leaf"
            title={`Food is ready at ${clock(Date.now() + r.readyInMin * 60_000)}.`}
            body="Reach the store around then — no long wait expected."
          />
        ) : null}

        <View style={styles.route}>
          <RouteTimeline
            from={{ title: r.store.name, subtitle: `${r.store.area} · ${r.store.distanceKm} km away` }}
            to={{ title: r.drop.area, subtitle: `Drop ${r.drop.distanceKm} km from pickup` }}
          />
          <Divider style={styles.divider} />
          <View style={styles.meta}>
            <Text v="caption" muted>
              <Text v="captionStrong">{`${r.totalKm} km`}</Text> total
            </Text>
            <Text v="captionStrong">{`~${r.etaMin} min`}</Text>
            <Text v="caption" muted>
              <Text v="captionStrong">{r.payment === 'cod' ? `COD ${formatAmount(r.codAmount ?? 0)}` : 'Prepaid'}</Text>
              {` · ${extra}`}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="Reject"
            variant="outline"
            size="lg"
            flex={1}
            onPress={() => {
              actions.skip(r.id);
              nav.goBack();
            }}
          />
          <Button label="Accept delivery" variant="green" size="lg" flex={1.8} onPress={accept} />
        </View>
        <Text v="caption" subtle center>
          Rejected requests are reassigned automatically.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: palette.night, justifyContent: 'flex-end' },
  ghosts: { position: 'absolute', top: 0, left: space.gutter, right: space.gutter, gap: 12 },
  ghost: { backgroundColor: 'rgba(255, 255, 255, 0.07)', borderRadius: radius.xl },
  ghostSmall: { height: 44 },
  ghostMid: { height: 80 },
  ghostLarge: { height: 120 },
  sheet: {
    backgroundColor: palette.canvas,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    gap: space.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  payout: { alignItems: 'flex-end' },
  route: { backgroundColor: palette.paper, borderRadius: radius.lg, padding: space.lg },
  divider: { marginVertical: space.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.xs },
});
