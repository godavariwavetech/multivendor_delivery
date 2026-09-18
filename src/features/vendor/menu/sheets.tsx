import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Banner, Card, Chip, ChipRow, Divider, KeyValue, SectionLabel, StatTile, Text, TileRow, Toggle } from '@/components';
import type { BakerySheet, FoodSheet, GrocerySheet, MeatSheet } from '@/domain/types';
import { palette, space } from '@/theme';
import { formatAmount } from '@/utils/currency';

/**
 * Board 2a / 2c — what the category actually switches on the product sheet:
 * Food per plate, Grocery per pack, Bakery per weight/box, Meat per kg slab.
 * (Fruits & Veg is a store-wide daily rate sheet: RateSheetScreen.)
 */

function ToggleCard({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text v="cardTitle">{title}</Text>
          <Text v="body" muted>
            {subtitle}
          </Text>
        </View>
        <Toggle value={value} onChange={onChange} />
      </View>
    </Card>
  );
}

// ─── Food ─────────────────────────────────────────────────────────────────────

export function FoodSheetView({
  sheet,
  available,
  onChange,
}: {
  sheet: FoodSheet;
  available: boolean;
  onChange: (sheet: FoodSheet, available?: boolean) => void;
}) {
  return (
    <>
      <Card>
        <SectionLabel>Variants</SectionLabel>
        {sheet.variants.map((v, i) => (
          <View key={v.name}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <Pressable
              style={styles.line}
              onPress={() =>
                onChange({ ...sheet, variants: sheet.variants.map(x => (x.name === v.name ? { ...x, on: !x.on } : x)) })
              }>
              <Text v="cardTitle" style={styles.flex}>
                {v.name}
              </Text>
              <Text v="cardTitle" style={styles.price}>
                {formatAmount(v.price)}
              </Text>
              <Text v="bodyStrong" color={v.on ? palette.sageDeep : palette.inkSubtle} style={styles.onOff}>
                {v.on ? 'On' : 'Off'}
              </Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>Add-ons</SectionLabel>
        <ChipRow scroll={false}>
          {sheet.addons.map(a => (
            <Chip key={a.name} label={`${a.name} ${formatAmount(a.price)}`} tone="peach" />
          ))}
          <Chip
            label="+ Add"
            dashed
            onPress={() => onChange({ ...sheet, addons: [...sheet.addons, { name: 'Extra onion', price: 10 }] })}
          />
        </ChipRow>
      </Card>

      <ToggleCard
        title="Spice level choice"
        subtitle="Mild · Medium · Hot"
        value={sheet.spiceChoice}
        onChange={v => onChange({ ...sheet, spiceChoice: v })}
      />
      <ToggleCard
        title="Available now"
        subtitle={`Stock ${sheet.stockToday} plates · resets daily`}
        value={available}
        onChange={v => onChange(sheet, v)}
      />
    </>
  );
}

// ─── Grocery ──────────────────────────────────────────────────────────────────

export function GrocerySheetView({
  sheet,
  available,
  onChange,
}: {
  sheet: GrocerySheet;
  available: boolean;
  onChange: (sheet: GrocerySheet, available?: boolean) => void;
}) {
  return (
    <>
      <Card>
        <SectionLabel>Pack sizes</SectionLabel>
        {sheet.packs.map((p, i) => (
          <View key={p.name}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <View style={styles.line}>
              <Text v="cardTitle" style={styles.flex}>
                {p.name}
              </Text>
              {p.mrp ? (
                <Text v="body" muted strike style={styles.mrp}>
                  {formatAmount(p.mrp)}
                </Text>
              ) : null}
              <Text v="cardTitle">{formatAmount(p.price)}</Text>
            </View>
          </View>
        ))}
        <Text v="caption" muted style={styles.caption}>
          MRP struck through · discount shown to customer
        </Text>
      </Card>

      <TileRow>
        <StatTile small label="Stock units" value={String(sheet.stock)} />
        <StatTile small label="Low-stock alert" value={String(sheet.lowStockAlert)} />
      </TileRow>

      <Card>
        <KeyValue label="Batch expiry" value={sheet.batchExpiry} strong />
        <KeyValue label="HSN · GST" value={sheet.hsnGst} strong />
        <KeyValue label="Max per order" value={`${sheet.maxPerOrder} units`} strong />
      </Card>

      <ToggleCard title="Listed" subtitle="Hides automatically at zero stock" value={available} onChange={v => onChange(sheet, v)} />
    </>
  );
}

// ─── Bakery ───────────────────────────────────────────────────────────────────

export function BakerySheetView({ sheet, onChange }: { sheet: BakerySheet; onChange: (sheet: BakerySheet) => void }) {
  return (
    <>
      <Card>
        <SectionLabel>Sold as</SectionLabel>
        {sheet.soldAs.map((s, i) => (
          <View key={s.name}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <View style={styles.line}>
              <Text v="cardTitle" style={styles.flex}>
                {s.name}
              </Text>
              <Text v="cardTitle">{formatAmount(s.price)}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>Fresh batch</SectionLabel>
        <ChipRow scroll={false}>
          <Chip label={sheet.bakedAt} selected />
          <Chip label={sheet.nextBatch} />
        </ChipRow>
        <Text v="body" muted style={styles.caption}>
          {sheet.shelfLife}
        </Text>
      </Card>

      <ToggleCard
        title="Pre-order slots"
        subtitle="6 h notice · custom message on cake"
        value={sheet.preorder}
        onChange={v => onChange({ ...sheet, preorder: v })}
      />

      <TileRow>
        <StatTile small label="Baked today" value={String(sheet.bakedToday)} />
        <StatTile small label="Left now" value={String(Math.max(0, sheet.bakedToday - 9))} />
      </TileRow>
    </>
  );
}

// ─── Meat ─────────────────────────────────────────────────────────────────────

export function MeatSheetView({ sheet, onChange }: { sheet: MeatSheet; onChange: (sheet: MeatSheet) => void }) {
  return (
    <>
      <Card>
        <SectionLabel>{`Weight slabs · ${formatAmount(sheet.pricePerKg)}/kg`}</SectionLabel>
        {sheet.slabs.map((s, i) => (
          <View key={s.weight}>
            {i > 0 ? <Divider style={styles.divider} /> : null}
            <View style={styles.line}>
              <Text v="cardTitle" style={styles.flex}>
                {s.weight}
              </Text>
              <Text v="body" subtle style={styles.mrp}>
                {s.pieces}
              </Text>
              <Text v="cardTitle">{formatAmount(s.price)}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SectionLabel>Preparation</SectionLabel>
        <ChipRow scroll={false}>
          {sheet.preparation.map(p => (
            <Chip
              key={p.name}
              label={p.name}
              selected={p.on}
              onPress={() =>
                onChange({ ...sheet, preparation: sheet.preparation.map(x => (x.name === p.name ? { ...x, on: !x.on } : x)) })
              }
            />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <KeyValue label="Stock in hand" value={`${sheet.stockKg} kg`} strong />
        <KeyValue label="Cut fresh at" value={sheet.cutAt} strong />
        <KeyValue label="Weight tolerance" value={sheet.tolerance} strong />
      </Card>

      <Banner tone="mint" title="Packing rule sent to partner" body={sheet.packingRule} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  divider: { marginVertical: space.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  price: { minWidth: 52, textAlign: 'right' },
  onOff: { width: 30, textAlign: 'right' },
  mrp: { marginRight: 2 },
  caption: { marginTop: space.md },
});
