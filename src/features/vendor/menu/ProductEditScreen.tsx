import { Pencil, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  Card,
  Dropdown,
  IconCircle,
  PhotoBox,
  PhotoCropper,
  PhotoSourceSheet,
  Pill,
  Screen,
  SectionLabel,
  Text,
  TextField,
  useToast,
  appAlert,
} from '@/components';
import { useVendor } from '@/data/vendorStore';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { Category, CategoryOption, Product, Store } from '@/domain/types';
import { useVendorNav, useVendorRoute } from '@/navigation/types';
import { palette, space } from '@/theme';
import { getPhoto, photoUrl, type PhotoSource, type PickedPhoto } from '@/utils/photo';
import { productPriceLine } from '@/utils/productPrice';

import { BakerySheetView, FoodSheetView, GrocerySheetView, MeatSheetView, ProduceSheetView } from './sheets';

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
    case 'produce':
      return {
        ...base,
        name: 'New item',
        veg: true,
        priceLine: 'Set rate',
        stockLine: 'Available',
        sheet: { kind: 'produce', unit: 'kg', rate: 0, note: '', tags: [] },
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
 * The item's photo: the stored one, or a freshly chosen one with an × that drops
 * it again. A photo already on the server has no ×, as there is no call to delete it.
 */
function ItemPhoto({ uri, removable, onPress, onRemove }: { uri?: string | null; removable: boolean; onPress: () => void; onRemove: () => void }) {
  return (
    <View style={styles.photoWrap}>
      <PhotoBox size={92} uri={uri ?? undefined} onPress={onPress} label="ADD PHOTO" />
      {uri && removable ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8} onPress={onRemove} style={styles.photoRemove}>
          <X size={14} color={palette.white} strokeWidth={2.8} />
        </Pressable>
      ) : null}
    </View>
  );
}

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
  photoUri,
  photoRemovable,
  onPickPhoto,
  onRemovePhoto,
}: {
  draft: Product;
  categories: CategoryOption[];
  /** Veg / non-veg is a choice for food and bakery; grocery, produce and meat do not ask. */
  askVeg: boolean;
  onChange: (p: Product) => void;
  onDone: () => void;
  isNew: boolean;
  photoUri?: string | null;
  photoRemovable: boolean;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
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

      <View style={styles.photoRow}>
        <ItemPhoto uri={photoUri} removable={photoRemovable} onPress={onPickPhoto} onRemove={onRemovePhoto} />
        <View style={styles.flex}>
          <Text v="bodyStrong">Item photo</Text>
          <Text v="body" muted>
            {photoUri ? 'Tap the photo to change it' : 'Tap to take or choose a photo of the dish'}
          </Text>
        </View>
      </View>

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
  const { store, product, actions } = useVendor();
  const existing = params.id ? product(params.id) : undefined;
  const categories = categoryOptions(store);
  const [draft, setDraft] = useState<Product>(() => existing ?? blankProduct(store.category, categories[0]));
  // A new item has nothing to show yet, so it opens straight into the form.
  const [editing, setEditing] = useState(!existing);
  // A chosen photo waits here, and goes up with the item when it is saved.
  const [pendingPhoto, setPendingPhoto] = useState<PickedPhoto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The photo just taken or chosen, while it is on the crop screen.
  const [cropping, setCropping] = useState<PickedPhoto | null>(null);
  const titles = TITLES[store.category];

  const returnToMenu = () => {
    if (nav.canGoBack()) {
      nav.goBack();
    } else {
      nav.navigate('VendorTabs', { screen: 'Menu' });
    }
  };

  // A dialog, not a toast: a toast vanishes in two seconds and is drawn behind the crop screen.
  const showPhotoProblem = (message: string) => appAlert('Photo problem', message);

  const choosePhoto = async (source: PhotoSource) => {
    setSheetOpen(false);
    // Let the sheet finish closing: the system picker will not open over a dismissing modal.
    await new Promise<void>(resolve => setTimeout(resolve, 250));
    try {
      const picked = await getPhoto(source);
      if (picked) {
        setCropping(picked);
      }
    } catch (error) {
      showPhotoProblem(error instanceof Error ? error.message : 'The photo could not be opened.');
    }
  };

  const removePhoto = () => {
    setPendingPhoto(null);
    setSheetOpen(false);
  };

  const save = async () => {
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
    if (draft.sheet.kind === 'food' && draft.sheet.variants.length === 0) {
      toast('Add at least one variant before saving');
      return;
    }
    if (draft.sheet.kind === 'produce' && !(draft.sheet.rate > 0)) {
      toast(`Set the price per ${draft.sheet.unit} before saving`);
      return;
    }
    if (draft.sheet.kind === 'bakery') {
      const sizes = draft.sheet.soldAs;
      if (sizes.length === 0) {
        toast('Add at least one size before saving');
        return;
      }
      if (sizes.some(s => !s.name.trim())) {
        toast('Give every size a name');
        return;
      }
      if (!sizes.some(s => s.on && s.price > 0)) {
        toast('Set a price for at least one size');
        return;
      }
    }
    const updated = { ...draft, name };
    const saved = await actions.saveProduct({ ...updated, priceLine: productPriceLine(updated) }, pendingPhoto);
    if (!saved) {
      return;
    }
    toast(`${name} ${existing ? 'updated' : 'added'}`);
    returnToMenu();
  };

  const sheet = draft.sheet;
  const where = [draft.group, draft.subCategory].filter(Boolean).join(' › ');
  const subline = (
    sheet.kind === 'grocery'
      ? [`Brand ${sheet.brand}`, where]
      : sheet.kind === 'produce'
        ? [where, `Per ${sheet.unit}`]
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
        onBack={returnToMenu}
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
          photoUri={pendingPhoto?.uri ?? photoUrl(draft.image)}
          photoRemovable={Boolean(pendingPhoto)}
          onPickPhoto={() => setSheetOpen(true)}
          onRemovePhoto={removePhoto}
        />
      ) : (
        <View style={styles.head}>
          <ItemPhoto
            uri={pendingPhoto?.uri ?? photoUrl(draft.image)}
            removable={Boolean(pendingPhoto)}
            onPress={() => setSheetOpen(true)}
            onRemove={removePhoto}
          />
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
      {sheet.kind === 'produce' ? (
        <ProduceSheetView sheet={sheet} onChange={s => setDraft(d => ({ ...d, sheet: s }))} />
      ) : null}
      {sheet.kind === 'bakery' ? (
        <BakerySheetView sheet={sheet} onChange={s => setDraft(d => ({ ...d, sheet: s }))} />
      ) : null}
      {sheet.kind === 'meat' ? (
        <MeatSheetView sheet={sheet} onChange={s => setDraft(d => ({ ...d, sheet: s }))} />
      ) : null}

      <PhotoSourceSheet
        visible={sheetOpen}
        hasPhoto={Boolean(pendingPhoto)}
        onClose={() => setSheetOpen(false)}
        onCamera={() => choosePhoto('camera')}
        onGallery={() => choosePhoto('gallery')}
        onRemove={removePhoto}
      />
      <PhotoCropper
        photo={cropping}
        onCancel={() => setCropping(null)}
        onDone={cropped => {
          setPendingPhoto(cropped);
          setCropping(null);
        }}
        onError={message => {
          setCropping(null);
          showPhotoProblem(message);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoWrap: { width: 92, height: 92 },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.ink,
    borderWidth: 2,
    borderColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRow: { flexDirection: 'row', gap: space.lg, alignItems: 'center', marginTop: space.md },
  head: { flexDirection: 'row', gap: space.lg, alignItems: 'center', marginBottom: space.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: { marginTop: space.md },
  flex: { flex: 1, gap: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: space.sm },
});
