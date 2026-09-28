import { Search, SearchX } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip, ChipRow, EmptyState, Fab, LinkButton, NoteBox, Screen, Text, WorkspaceHero, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav } from '@/navigation/types';
import { fonts, palette, radius, space } from '@/theme';
import { pluralise } from '@/utils/format';

import { ProductCard } from './ProductCard';

/** Board 4a·3 / 3a·5 (Food, with day parts) and 1b·4 (products, variants & stock). */
export function MenuScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { store, products, state, actions } = useVendor();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const food = store.category === 'food';
  const produce = store.category === 'produce';
  const activeDaypart = state.dayparts.find(d => d.active);
  const unavailable = products.filter(p => !p.available).length;

  const visible = useMemo(
    () =>
      products.filter(
        p => (!group || p.group === group) && p.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [group, products, query],
  );

  const noun = store.itemNoun;
  const addLabel = `Add ${noun}`;

  return (
    <View style={styles.root}>
      <Screen tab>
        <WorkspaceHero
          title="Menu"
          subtitle={`${pluralise(products.length, noun)} · ${unavailable} unavailable`}
          right={
            food ? (
              <LinkButton label="Timings" onPress={() => nav.navigate('Timings')} />
            ) : produce ? (
              <LinkButton label="Today's rates" onPress={() => nav.navigate('RateSheet')} />
            ) : (
              <Text v="caption" color="rgba(255,255,255,0.88)">{`${pluralise(products.length, noun)} · ${unavailable} unavailable`}</Text>
            )
          }
        />

        <View style={styles.search}>
          <Search size={20} color={palette.inkMuted} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={food ? 'Search dishes' : 'Search products'}
            placeholderTextColor={palette.inkSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.actions}>
          <Text v="caption" muted>
            {pluralise(products.length, noun)}
          </Text>
          <LinkButton
            label={unavailable ? `Out of stock · ${unavailable}` : 'Out of stock'}
            onPress={() => nav.navigate('OutOfStock')}
          />
        </View>

        <ChipRow>
          <Chip
            label={food && activeDaypart ? activeDaypart.label : 'All'}
            selected={group === null}
            onPress={() => setGroup(null)}
          />
          {store.groups.map(g => (
            <Chip key={g} label={g} selected={group === g} onPress={() => setGroup(group === g ? null : g)} />
          ))}
        </ChipRow>

        {visible.length ? (
          visible.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onPress={() => (produce ? nav.navigate('RateSheet') : nav.navigate('ProductEdit', { id: p.id }))}
              onToggle={available => {
                actions.setAvailable(p.id, available);
                toast(available ? `${p.name} is available` : `${p.name} marked out of stock`);
              }}
            />
          ))
        ) : (
          <EmptyState icon={SearchX} title="Nothing matches" body="Try another name or clear the filter." />
        )}

        {food && activeDaypart ? (
          <NoteBox>
            {`${activeDaypart.label} menu is live ${activeDaypart.window}. Dishes outside the active day part stay hidden from customers.`}
          </NoteBox>
        ) : null}
        {produce && !state.ratesPublished ? (
          <NoteBox>Today's rates aren't published yet. Items stay hidden from customers until you publish.</NoteBox>
        ) : null}
      </Screen>
      <Fab label={addLabel} onPress={() => (produce ? nav.navigate('RateSheet') : nav.navigate('ProductEdit', {}))} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: space.lg,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: palette.ink, paddingVertical: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
});
