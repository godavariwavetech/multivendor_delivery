import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Card,
  Chip,
  ChipRow,
  ChoiceRow,
  ListGroup,
  ListRow,
  NoteBox,
  Screen,
  SectionLabel,
  Text,
  Toggle,
  useToast,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav } from '@/navigation/types';
import { palette, space } from '@/theme';

/** Half-hour slots from 5 AM to midnight — the range a store realistically opens in. */
const SLOTS = Array.from({ length: 39 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    value: `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    label: `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`,
  };
});

const labelFor = (value?: string) => SLOTS.find(s => s.value === value)?.label ?? value ?? '—';

/** Vendor SRS 3 (store timings) with board 3a·5 day parts. */
export function TimingsScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { store, state, actions } = useVendor();
  const food = store.category === 'food';
  const active = state.dayparts.find(d => d.active);
  /** Which field the time list is open for. */
  const [editing, setEditing] = useState<'open' | 'close' | null>(null);

  const opening = store.openingTime;
  const closing = store.closingTime;

  const pick = (value: string) => {
    const next = editing === 'open' ? { opening: value, closing } : { opening, closing: value };
    setEditing(null);
    if (!next.opening || !next.closing) {
      return;
    }
    actions.setHours(next.opening, next.closing);
    toast(`Hours updated · ${labelFor(next.opening)} – ${labelFor(next.closing)}`);
  };

  return (
    <Screen>
      <BackHeader title="Opening hours" subtitle={store.name} onBack={nav.goBack} />

      <Card>
        <SectionLabel>Store hours</SectionLabel>
        <View style={styles.hoursRow}>
          <TimeField label="Opens" value={labelFor(opening)} on={editing === 'open'} onPress={() => setEditing(editing === 'open' ? null : 'open')} />
          <Text v="body" muted>
            to
          </Text>
          <TimeField label="Closes" value={labelFor(closing)} on={editing === 'close'} onPress={() => setEditing(editing === 'close' ? null : 'close')} />
        </View>
        {editing ? (
          <View style={styles.slots}>
            <Text v="caption" muted style={styles.slotHint}>
              {editing === 'open' ? 'Pick the opening time' : 'Pick the closing time'}
            </Text>
            <ChipRow>
              {SLOTS.map(s => (
                <Chip
                  key={s.value}
                  label={s.label}
                  selected={s.value === (editing === 'open' ? opening : closing)}
                  onPress={() => pick(s.value)}
                />
              ))}
            </ChipRow>
          </View>
        ) : (
          <Text v="body" muted style={styles.caption}>
            Customers can only order inside these hours. Tap a time to change it.
          </Text>
        )}
      </Card>

      {food ? (
        <>
          <SectionLabel style={styles.label}>Day parts</SectionLabel>
          <Card>
            <ChoiceRow
              options={state.dayparts.map(d => ({ key: d.id, label: d.label }))}
              value={active?.id}
              onChange={id => {
                actions.setDaypart(id);
                toast(`${state.dayparts.find(d => d.id === id)?.label} menu is live`);
              }}
            />
            <Text v="body" muted style={styles.caption}>
              {active ? `${active.label} menu is live ${active.window}. Dishes outside the active day part stay hidden.` : ''}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionLabel style={styles.label}>Weekly hours</SectionLabel>
      <ListGroup>
        {state.hours.map(h => (
          <ListRow
            key={h.day}
            title={h.day}
            subtitle={h.open ? `${h.from} – ${h.to}` : 'Closed'}
            right={<Toggle value={h.open} onChange={() => actions.toggleDay(h.day)} />}
          />
        ))}
      </ListGroup>

      <NoteBox>The same hours apply every day the store is open. Holiday closures are set by your store admin.</NoteBox>
    </Screen>
  );
}

function TimeField({ label, value, on, onPress }: { label: string; value: string; on: boolean; onPress: () => void }) {
  return (
    <View style={styles.field}>
      <Text v="caption" muted>
        {label}
      </Text>
      <Chip label={value} selected={on} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  hoursRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  field: { gap: 4 },
  slots: { marginTop: space.md, borderTopWidth: 1, borderTopColor: palette.lineSoft, paddingTop: space.md },
  slotHint: { marginBottom: space.sm },
  label: { marginTop: space.sm, marginBottom: 0 },
  caption: { marginTop: space.md },
});
