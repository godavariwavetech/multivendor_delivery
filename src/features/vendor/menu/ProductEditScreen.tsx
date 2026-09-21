import { Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  Dropdown,
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
import type { Category, CategoryOption, Product, Store } from '@/domain/types';
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

/**
 * The store's category list. A backend that does not send one still has the names
 * of the categories in use, so those become the options (negative ids: local only).
 */
const categoryOptions = (store: Store): CategoryOption[] =>
  store.categories?.length
    ? store.categories
    : store.groups.map((name, i) => ({ id: -(i + 1), name, subCategories: [] }));

/** The category a product is filed under: by id when the server sent one, else by name. */
const categoryOf = (categories: CategoryOption[], p: Product) =>
  categories.find(c => c.id === p.categoryId) ?? categories.find(c => c.name === p.group);

const blankProduct = (category: Category, first?: CategoryOption): Product => {
  const base = {
    id: `new-${Date.now()}`,
    category,
    group: first?.name ?? 'Menu',
    categoryId: first?.id ?? null,
    subCategoryId: null,
    subCategory: null,
    available: true,
    outNote: undefined,
  };
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
 * The details the vendor types: what the item is called, its category and sub
 * category, and — for food and bakery only — whether it is veg, and how long it
 * takes to make. Everything below this on the screen is priced per store type,
 * so it stays in the sheet views.
 */
function DetailsForm({
  draft,
  categories,
  askVeg,
  onChange,
  onDone,
  isNew,
}: {
  draft: Product;
  categories: CategoryOption[];
  /** Veg / non-veg is a choice for food and bakery; grocery, produce and meat do not ask. */
  askVeg: boolean;
  onChange: (p: Product) => void;
  onDone: () => void;
  isNew: boolean;
}) {
  const sheet = draft.sheet;
  const selected = categoryOf(categories, draft);
  const pickCategory = (c: CategoryOption) =>
    onChange({ ...draft, group: c.name, categoryId: c.id, subCategoryId: null, subCategory: null });
  // A sub category belongs to its category, so clearing one clears both.
  const clearCategory = () => onChange({ ...draft, group: '', categoryId: null, subCategoryId: null, subCategory: null });
  const subCategories = selected?.subCategories ?? [];
  const pickSubCategory = (s: { id: number; name: string } | undefined) =>
    onChange({ ...draft, subCategoryId: s?.id ?? null, subCategory: s?.name ?? null });
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

      <Dropdown
        label="Category"
        value={selected?.id}
        options={categories.map(c => ({ key: c.id, label: c.name }))}
        onSelect={key => {
          const c = categories.find(x => x.id === key);
          if (c) {
            pickCategory(c);
          } else {
            clearCategory();
          }
        }}
        clearable
        placeholder={categories.length ? 'Select category' : 'No categories yet'}
        disabled={!categories.length}
        style={styles.field}
      />

      <Dropdown
        label="Sub category"
        value={draft.subCategoryId}
        options={subCategories.map(s => ({ key: s.id, label: s.name }))}
        onSelect={key => pickSubCategory(subCategories.find(s => s.id === key))}
        clearable
        placeholder={subCategories.length ? 'Select sub category' : 'None available'}
        disabled={!subCategories.length}
        style={styles.field}
      />

      {askVeg ? (
        <Dropdown
          label="Veg / Non-veg"
          value={draft.veg ? 'veg' : 'nonveg'}
          options={[
            { key: 'veg', label: 'Veg' },
            { key: 'nonveg', label: 'Non-veg' },
          ]}
          onSelect={key => onChange({ ...draft, veg: key === 'veg' })}
          style={styles.field}
        />
      ) : null}

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
  const categories = categoryOptions(store);
  const [draft, setDraft] = useState<Product>(() => existing ?? blankProduct(store.category, categories[0]));
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
    if (categories.length && !draft.group && draft.categoryId == null) {
      // Cleared with the ×: without one, the backend would file it under the store's first category.
      toast('Pick a category first');
      setEditing(true);
      return;
    }
    actions.saveProduct({ ...draft, name });
    toast(`${name} ${existing ? 'updated' : 'added'}`);
    nav.goBack();
  };

  const sheet = draft.sheet;
  const where = [draft.group, draft.subCategory].filter(Boolean).join(' › ');
  const subline = (
    sheet.kind === 'grocery'
      ? [`Brand ${sheet.brand}`, where]
      : [where, sheet.kind === 'food' ? `Prep ${sheet.prepMin} min` : sheet.kind === 'bakery' ? 'Eggless option' : 'Bone-in']
  )
    .filter(Boolean)
    .join(' · ');
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
          categories={categories}
          askVeg={store.category === 'food' || store.category === 'bakery'}
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
