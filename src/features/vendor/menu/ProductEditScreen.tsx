import { Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  Chip,
  ChipRow,
  IconCircle,
  PhotoBox,
  Pill,
  Screen,
  SectionLabel,
  Text,
  TextField,
  useToast,
} from '@/components';
import { apiClient, endpoints } from '@/api';
import { useVendor } from '@/data/vendorStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { Category, Product } from '@/domain/types';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { palette, space } from '@/theme';
import { photoUrl, pickPhoto } from '@/utils/photo';

import { BakerySheetView, FoodSheetView, GrocerySheetView, MeatSheetView } from './sheets';

const TITLES: Record<Category, { edit: string; add: string; save: string }> = {
  food: { edit: 'Edit item', add: 'New dish', save: 'Save item' },
  grocery: { edit: 'Edit product', add: 'New product', save: 'Save product' },
  produce: { edit: 'Edit item', add: 'New item', save: 'Save item' },
  bakery: { edit: 'Edit item', add: 'New item', save: 'Save item' },
  meat: { edit: 'Edit cut', add: 'New cut', save: 'Save cut' },
};

const blankProduct = (category: Category, group: string): Product => {
  const base = { id: `new-${Date.now()}`, category, group, available: true, outNote: undefined };
  switch (category) {
    case 'grocery':
      return {
        ...base,
        name: 'New product',
        veg: true,
        priceLine: 'Set pack sizes',
        stockLine: 'Stock 0',
        sheet: { kind: 'grocery', brand: '—', ean: 'EAN —', packs: [{ name: '1 unit', mrp: 0, price: 0, on: true }], stock: 0, lowStockAlert: 5, batchExpiry: '—', hsnGst: '— · 5%', maxPerOrder: 5 },
      };
    case 'bakery':
      return {
        ...base,
        name: 'New bake',
        veg: true,
        priceLine: 'Set sizes',
        stockLine: '0 left now',
        sheet: { kind: 'bakery', soldAs: [{ name: 'Regular', price: 0, on: true }], bakedAt: 'Baked —', nextBatch: 'Next —', shelfLife: 'Shelf life 24 h', preorder: false, bakedToday: 0, tags: ['Veg'] },
      };
    case 'meat':
      return {
        ...base,
        name: 'New cut',
        veg: false,
        priceLine: 'Set weight slabs',
        stockLine: '0 kg in hand',
        sheet: { kind: 'meat', pricePerKg: 0, slabs: [{ weight: '500 g', pieces: '≈ —', price: 0 }], preparation: [{ name: 'Cleaned', on: true }], stockKg: 0, cutAt: '—', tolerance: '± 30 g, billed actual', packingRule: 'Leak-proof pouch with ice pack.', tags: ['Non-veg', 'Cold chain'] },
      };
    default:
      return {
        ...base,
        name: 'New dish',
        veg: true,
        priceLine: 'Set price',
        stockLine: 'Available',
        sheet: { kind: 'food', prepMin: 15, variants: [{ name: 'Regular', price: 0, on: true }], addons: [], spiceChoice: false, stockToday: 20, tags: ['Veg'] },
      };
  }
};

/**
 * The details the vendor types: what the item is called, which group it belongs
 * to, whether it is veg, and how long it takes to make. Everything below this on
 * the screen is priced per category, so it stays in the sheet views.
 */
function DetailsForm({
  draft,
  groups,
  onChange,
  onDone,
  isNew,
}: {
  draft: Product;
  groups: string[];
  onChange: (p: Product) => void;
  onDone: () => void;
  isNew: boolean;
}) {
  const sheet = draft.sheet;
  return (
    <Card>
      <SectionLabel>{isNew ? 'New item' : 'Item details'}</SectionLabel>

      <TextField
        label="Name"
        value={draft.name}
        onChangeText={name => onChange({ ...draft, name })}
        placeholder="e.g. Chicken Biryani"
        autoFocus={isNew}
        maxLength={60}
        style={styles.field}
      />

      {groups.length ? (
        <>
          <Text v="bodyStrong" style={styles.field}>
            Group
          </Text>
          <ChipRow scroll={false}>
            {groups.map(g => (
              <Chip key={g} label={g} selected={draft.group === g} onPress={() => onChange({ ...draft, group: g })} />
            ))}
          </ChipRow>
        </>
      ) : null}

      <Text v="bodyStrong" style={styles.field}>
        Food type
      </Text>
      <ChipRow scroll={false}>
        <Chip label="Veg" selected={draft.veg} onPress={() => onChange({ ...draft, veg: true })} />
        <Chip label="Non-veg" selected={!draft.veg} onPress={() => onChange({ ...draft, veg: false })} />
      </ChipRow>

      {sheet.kind === 'food' ? (
        <TextField
          label="Prep time"
          value={String(sheet.prepMin)}
          onChangeText={v => onChange({ ...draft, sheet: { ...sheet, prepMin: Number(v.replace(/\D/g, '')) || 0 } })}
          keyboardType="number-pad"
          suffix="min"
          maxLength={3}
          style={styles.field}
        />
      ) : null}

      <Button label="Done" variant="outline" onPress={onDone} style={styles.field} />
    </Card>
  );
}

/**
 * Board 2a — the product sheet per category. The screen is shared; only the sheet
 * body changes with the store's category.
 */
export function ProductEditScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { params } = useVendorRoute<'ProductEdit'>();
  const { store, product, actions, refresh } = useVendor();
  const existing = params.id ? product(params.id) : undefined;
  const [draft, setDraft] = useState<Product>(() => existing ?? blankProduct(store.category, store.groups[0]));
  // A new item has nothing to show yet, so it opens straight into the form.
  const [editing, setEditing] = useState(!existing);
  const [uploading, setUploading] = useState(false);
  const titles = TITLES[store.category];

  /**
   * The upload is keyed on the product id, so a brand-new item has to be saved
   * before it can carry a photo — there is no row to attach it to yet.
   */
  const addPhoto = async () => {
    if (!existing) {
      toast('Save the item first, then add a photo');
      return;
    }
    const picked = await pickPhoto('Item photo');
    if (!picked) {
      return;
    }
    setUploading(true);
    try {
      const res = await apiClient.upload<{ image: string }>(endpoints.vendor.uploadProductImage, picked, {
        product_id: draft.id,
      });
      setDraft(d => ({ ...d, image: res.image }));
      await refresh();
      toast('Photo saved');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'The photo could not be saved.');
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const name = draft.name.trim();
    if (!name) {
      // The backend refuses a nameless product, so catch it before the round trip.
      toast('Give the item a name first');
      setEditing(true);
      return;
    }
    actions.saveProduct({ ...draft, name });
    toast(`${name} ${existing ? 'updated' : 'added'}`);
    nav.goBack();
  };

  const sheet = draft.sheet;
  const subline =
    sheet.kind === 'food'
      ? `${draft.group} · Prep ${sheet.prepMin} min`
      : sheet.kind === 'grocery'
        ? `Brand ${sheet.brand} · ${draft.group}`
        : sheet.kind === 'bakery'
          ? `${draft.group} · Eggless option`
          : `${draft.group} · Bone-in`;
  const tags = sheet.kind === 'food' || sheet.kind === 'bakery' || sheet.kind === 'meat' ? sheet.tags : [];

  return (
    <Screen footer={<Button label={titles.save} size="lg" flex={1} onPress={save} />}>
      <BackHeader
        title={existing ? titles.edit : titles.add}
        subtitle={`${store.name} · ${CATEGORY_LABEL[store.category]}`}
        onBack={nav.goBack}
        pill={CATEGORY_LABEL[store.category]}
        pillTone="sky"
      />

      {editing ? (
        <DetailsForm
          draft={draft}
          groups={store.groups}
          onChange={setDraft}
          onDone={() => setEditing(false)}
          isNew={!existing}
        />
      ) : (
        <View style={styles.head}>
          <PhotoBox size={92} uri={photoUrl(draft.image)} busy={uploading} onPress={addPhoto} />
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <Text v="headline" style={styles.flex}>
                {draft.name}
              </Text>
              <IconCircle icon={Pencil} size={38} onPress={() => setEditing(true)} />
            </View>
            <Text v="body" muted>
              {subline}
            </Text>
            <View style={styles.tags}>
              {sheet.kind === 'grocery' ? (
                <>
                  <Pill label={sheet.ean} tone="neutral" />
                  <Text v="bodyStrong" color={palette.blue} onPress={() => toast('Barcode scanner opens the camera')}>
                    Scan
                  </Text>
                </>
              ) : (
                tags.map(t => (
                  <Pill key={t} label={t} tone={t === 'Non-veg' ? 'sky' : t === 'Veg' ? 'leaf' : 'neutral'} />
                ))
              )}
            </View>
          </View>
        </View>
      )}

      {sheet.kind === 'food' ? (
        <FoodSheetView sheet={sheet} available={draft.available} onChange={(s, available) => setDraft(d => ({ ...d, sheet: s, available: available ?? d.available }))} />
      ) : null}
      {sheet.kind === 'grocery' ? (
        <GrocerySheetView sheet={sheet} available={draft.available} onChange={(s, available) => setDraft(d => ({ ...d, sheet: s, available: available ?? d.available }))} />
      ) : null}
      {sheet.kind === 'bakery' ? (
        <BakerySheetView sheet={sheet} onChange={s => setDraft(d => ({ ...d, sheet: s }))} />
      ) : null}
      {sheet.kind === 'meat' ? (
        <MeatSheetView sheet={sheet} onChange={s => setDraft(d => ({ ...d, sheet: s }))} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: space.lg, alignItems: 'center', marginBottom: space.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: { marginTop: space.md },
  flex: { flex: 1, gap: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: space.sm },
});
