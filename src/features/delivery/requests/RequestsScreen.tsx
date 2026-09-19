import { Inbox, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, Button, Card, EmptyState, LinkButton, NoteBox, Pill, Screen, Text, TitleHeader, useToast } from '@/components';
import { useDelivery } from '@/data/deliveryStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { DeliveryRequest } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useDeliveryNav } from '@/navigation/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';
import { clock, formatCountdown } from '@/utils/datetime';

export const RESPOND_SECONDS = 20;

export const readyLine = (r: DeliveryRequest, now: number) => {
  if (r.readyInMin <= 0) {
    return 'ready now';
  }
  return r.category === 'food' ? `Food ready at ${clock(now + r.readyInMin * 60_000)}` : `ready in ${r.readyInMin} min`;
};

/** Board 4b·2 — the first open request is offered with a 20-second timer. */
export function RequestsScreen() {
  const nav = useDeliveryNav();
  const toast = useToast();
  const now = useNow();
  const { state, openRequests, activeRequest, actions } = useDelivery();
  const [offer, setOffer] = useState<{ id: string; at: number } | null>(null);

  const first = openRequests[0];
  const busy = Boolean(state.active && state.active.stage !== 'complete');

  // Start a fresh 20-second window whenever a different request moves to the top.
  useEffect(() => {
    if (first && offer?.id !== first.id) {
      setOffer({ id: first.id, at: Date.now() });
    }
  }, [first, offer?.id]);

  const left = offer ? RESPOND_SECONDS - Math.floor((now - offer.at) / 1000) : RESPOND_SECONDS;

  useEffect(() => {
    if (state.online && !busy && first && offer?.id === first.id && left <= 0) {
      actions.skip(first.id);
      toast('Request expired · reassigned to another partner');
    }
  }, [actions, busy, first, left, offer?.id, state.online, toast]);

  const accept = (r: DeliveryRequest) => {
    if (busy) {
      toast(`Finish #${activeRequest?.id} first`);
      return;
    }
    actions.accept(r.id);
    toast(`#${r.id} accepted · head to ${r.store.name}`);
    nav.navigate('DeliveryTabs', { screen: 'Active' });
  };

  const others = state.requests.filter(r => r.id !== first?.id && (r.status === 'open' || r.status === 'taken'));

  return (
    <Screen tab>
      <TitleHeader
        title="Requests"
        right={
          <Text v="body" muted>
            {`Zone 4 · ${state.online ? 'online' : 'offline'}`}
          </Text>
        }
      />

      {!state.online ? (
        <EmptyState
          icon={WifiOff}
          title="You're offline"
          body="Go online to see delivery requests near you."
          action="Go online"
          onAction={() => actions.setOnline(true)}
        />
      ) : (
        <>
          {busy && activeRequest ? (
            <Banner
              tone="leaf"
              title={`Finish #${activeRequest.id} first`}
              body="You can look, but new requests can be accepted after your active delivery."
              right={<LinkButton label="Continue" color={palette.greenDeep} onPress={() => nav.navigate('DeliveryTabs', { screen: 'Active' })} />}
            />
          ) : null}

          {first ? (
            <Card tone="highlight">
              <RequestBody request={first} now={now} strongPayout />
              <View style={styles.actions}>
                <Button
                  label="Skip"
                  variant="outline"
                  flex={1}
                  onPress={() => {
                    actions.skip(first.id);
                    toast('Skipped · offered to another partner');
                  }}
                />
                <Button
                  label={busy ? 'Accept' : `Accept · ${formatCountdown(Math.max(0, left))}`}
                  flex={1.8}
                  disabled={busy}
                  onPress={() => accept(first)}
                />
              </View>
            </Card>
          ) : null}

          {others.map(r => (
            <Card
              key={r.id}
              onPress={r.status === 'open' ? () => nav.navigate('IncomingRequest', { id: r.id }) : undefined}
              style={r.status === 'taken' ? styles.faded : undefined}>
              {r.status === 'taken' ? (
                <>
                  <View style={styles.head}>
                    <Text v="cardTitle" color={palette.inkMuted}>
                      {r.store.name}
                    </Text>
                    <Text v="cardTitle" color={palette.inkMuted}>
                      {formatAmount(r.payout)}
                    </Text>
                  </View>
                  <Text v="body" subtle style={styles.gap}>
                    Taken by another partner
                  </Text>
                </>
              ) : (
                <RequestBody request={r} now={now} />
              )}
            </Card>
          ))}

          {!first && !others.length ? (
            <EmptyState
              icon={Inbox}
              title="No requests right now"
              body="Stay online. Requests near you appear here the moment a store marks an order ready."
              action="Load more requests (demo)"
              onAction={actions.refreshRequests}
            />
          ) : null}

          <NoteBox>Requests expire in 20 seconds. Skipping does not affect your rating; not responding does.</NoteBox>
        </>
      )}
    </Screen>
  );
}

function RequestBody({ request: r, now, strongPayout }: { request: DeliveryRequest; now: number; strongPayout?: boolean }) {
  const tags: { label: string; tone: 'neutral' | 'sky' | 'leaf' }[] = [];
  if (r.category !== 'food') {
    tags.push({ label: CATEGORY_LABEL[r.category], tone: 'leaf' });
  }
  if (r.payment === 'cod') {
    tags.push({ label: `COD ${formatAmount(r.codAmount ?? 0)}`, tone: 'neutral' });
  }
  if (r.parcels > 1) {
    tags.push({ label: `${r.parcels} ${r.category === 'grocery' ? 'bags' : 'parcels'}`, tone: 'neutral' });
  }
  if (r.waitingMin) {
    tags.push({ label: `Waiting ${r.waitingMin} min`, tone: 'sky' });
  }

  return (
    <>
      <View style={styles.head}>
        <Text v="cardTitle" style={styles.flex}>
          {r.store.name}
        </Text>
        <Text v="cardTitle" color={strongPayout ? palette.greenDeep : undefined}>
          {formatAmount(r.payout)}
        </Text>
      </View>
      <Text v="body" muted style={styles.gap}>
        {strongPayout
          ? `Pickup ${r.store.distanceKm} km · drop ${r.drop.distanceKm} km · ${r.totalKm} km total`
          : `Pickup ${r.store.distanceKm} km · drop ${r.drop.distanceKm} km · ${readyLine(r, now)}`}
      </Text>
      {strongPayout ? (
        <Text v="body" muted>
          {`${readyLine(r, now)} · ${r.payment === 'cod' ? 'cash on delivery' : 'prepaid'}`}
        </Text>
      ) : null}
      {tags.length ? (
        <View style={styles.tags}>
          {tags.map(t => (
            <Pill key={t.label} label={t.label} tone={t.tone} />
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  flex: { flex: 1 },
  gap: { marginTop: space.xs },
  actions: { flexDirection: 'row', gap: 10, marginTop: space.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  faded: { opacity: 0.7 },
});
