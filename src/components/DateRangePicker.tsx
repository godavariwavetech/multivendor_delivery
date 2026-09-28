import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { palette, radius, space, useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

type Range = { from: Date | null; to: Date | null };

const sameDay = (a: Date | null, b: Date) => Boolean(a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
const dateKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const shortDate = (d: Date | null) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Select date');
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysAgo = (days: number) => {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
};

const quickRanges = () => {
  const today = startOfDay(new Date());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return [
    { label: 'Today', range: { from: today, to: today } },
    { label: 'Yesterday', range: { from: daysAgo(1), to: daysAgo(1) } },
    { label: 'Last 7 days', range: { from: daysAgo(6), to: today } },
    { label: 'Last 30 days', range: { from: daysAgo(29), to: today } },
    { label: 'This month', range: { from: thisMonth, to: today } },
    { label: 'Last month', range: { from: lastMonthStart, to: lastMonthEnd } },
  ];
};

/** A dependency-free From/To month calendar used for history filters. */
export function DateRangePicker({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  const { r } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Range>(value);
  const [month, setMonth] = useState(() => value.to ?? value.from ?? new Date());
  const [custom, setCustom] = useState(false);
  const [selecting, setSelecting] = useState<'from' | 'to'>('from');
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: first.getDay() + count }, (_, index) => (index < first.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), index - first.getDay() + 1)));
  }, [month]);
  const choose = (day: Date) => {
    if (selecting === 'from' || !draft.from) {
      setDraft({ from: day, to: null });
      return;
    }
    setDraft(dateKey(day) < dateKey(draft.from) ? { from: day, to: draft.from } : { from: draft.from, to: day });
  };
  const inRange = (day: Date) => Boolean(draft.from && draft.to && dateKey(day) > dateKey(draft.from) && dateKey(day) < dateKey(draft.to));
  const label = value.from ? `${shortDate(value.from)}${value.to ? ` – ${shortDate(value.to)}` : ''}` : 'Select date range';

  return (
    <>
      <Pressable onPress={() => { setDraft(value); setMonth(value.to ?? value.from ?? new Date()); setSelecting('from'); setCustom(false); setOpen(true); }} style={({ pressed }) => [styles.trigger, { borderColor: r.line }, pressed && styles.pressed]}>
        <View style={[styles.calendarIcon, { backgroundColor: r.soft }]}><Calendar size={17} color={r.accentDeep} /></View>
        <View style={styles.flex}>
          <Text v="caption" muted>History period</Text>
          <Text v="bodyStrong">{label}</Text>
        </View>
        <ChevronRight size={18} color={palette.inkMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetTitle}><Text v="headline">Select history period</Text><Pressable onPress={() => setOpen(false)} hitSlop={10}><X size={20} color={palette.inkMuted} /></Pressable></View>
            {custom ? (
              <>
                <Text v="caption" muted>{selecting === 'to' ? 'Now select the To date' : 'Choose a From date, then tap To'}</Text>
                <View style={styles.selectedRow}>
                  <Pressable onPress={() => setSelecting('from')} style={[styles.selectedDate, selecting === 'from' && { borderColor: r.accent, borderWidth: 1 }]}><Text v="caption" muted>FROM</Text><Text v="bodyStrong">{shortDate(draft.from)}</Text></Pressable>
                  <Pressable disabled={!draft.from} onPress={() => setSelecting('to')} style={[styles.selectedDate, selecting === 'to' && { borderColor: r.accent, borderWidth: 1 }, !draft.from && styles.disabledDate]}><Text v="caption" muted>TO</Text><Text v="bodyStrong">{shortDate(draft.to)}</Text></Pressable>
                </View>
                <View style={styles.monthRow}>
                  <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={10}><ChevronLeft size={21} color={palette.ink} /></Pressable>
                  <Text v="cardTitle">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
                  <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={10}><ChevronRight size={21} color={palette.ink} /></Pressable>
                </View>
                <View style={styles.weekRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <Text key={`${day}-${i}`} v="caption" muted center style={styles.weekDay}>{day}</Text>)}</View>
                <View style={styles.grid}>{days.map((day, i) => !day ? <View key={`blank-${i}`} style={styles.day} /> : <Pressable key={day.toISOString()} onPress={() => choose(day)} style={[styles.day, inRange(day) && { backgroundColor: r.soft }, Boolean(selecting === 'from' && draft.from && sameDay(draft.from, day)) && { backgroundColor: r.accent, borderRadius: radius.pill }, Boolean(selecting === 'to' && draft.from && draft.to && (sameDay(draft.from, day) || sameDay(draft.to, day))) && { backgroundColor: r.accent, borderRadius: radius.pill }]}><Text v="captionStrong" center color={(selecting === 'from' && draft.from && sameDay(draft.from, day)) || (selecting === 'to' && draft.from && draft.to && (sameDay(draft.from, day) || sameDay(draft.to, day))) ? r.onAccent : palette.ink}>{day.getDate()}</Text></Pressable>)}</View>
                <View style={styles.actions}>
                  <Button label="Clear" variant="outline" size="sm" flex={1} onPress={() => { const emptyRange = { from: null, to: null }; setDraft(emptyRange); onChange(emptyRange); setOpen(false); }} />
                  <Button label="Apply" size="sm" flex={1} disabled={!draft.from || !draft.to} onPress={() => { onChange(draft); setOpen(false); }} />
                </View>
              </>
            ) : (
              <View style={styles.quickList}>
                {quickRanges().map(option => <Pressable key={option.label} style={styles.quickOption} onPress={() => { onChange(option.range); setOpen(false); }}><Text v="bodyStrong">{option.label}</Text><Text v="caption" muted>{`${shortDate(option.range.from)} – ${shortDate(option.range.to)}`}</Text></Pressable>)}
                <Pressable style={[styles.quickOption, styles.customOption]} onPress={() => setCustom(true)}><Text v="bodyStrong" color={r.accentDeep}>Custom range</Text><ChevronRight size={18} color={r.accentDeep} /></Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, pressed: { opacity: 0.76 }, trigger: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.paper, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  calendarIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,29,33,0.45)' },
  sheet: { backgroundColor: palette.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.lg, gap: 12 }, handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.line, alignSelf: 'center' },
  sheetTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, quickList: { gap: 2 }, quickOption: { minHeight: 46, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line }, customOption: { borderBottomWidth: 0, marginTop: 4 }, selectedRow: { flexDirection: 'row', gap: 8 }, selectedDate: { flex: 1, gap: 3, padding: space.sm, backgroundColor: palette.sunken, borderRadius: radius.sm }, disabledDate: { opacity: 0.55 }, monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  weekRow: { flexDirection: 'row' }, weekDay: { width: '14.2857%', paddingVertical: 5 }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.2857%', height: 38, justifyContent: 'center' }, actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
