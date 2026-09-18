import { PackageCheck } from 'lucide-react-native';
import React from 'react';

import { BackHeader, Button, EmptyState, NoteBox, Screen, useToast } from '@/components';
import { useVendor } from '@/data/vendorStore';
import { useVendorNav } from '@/navigation/types';

import { ProductCard } from './ProductCard';

/** Board 3a·1 "4 items out of stock · Fix" — everything customers can't order right now. */
export function OutOfStockScreen() {
  const nav = useVendorNav();
  const toast = useToast();
  const { products, actions } = useVendor();
  const out = products.filter(p => !p.available);

  return (
    <Screen>
      <BackHeader
        title="Out of stock"
        subtitle={out.length ? `${out.length} hidden from customers` : 'Everything is available'}
        onBack={nav.goBack}
      />
      {out.length ? (
        <>
          {out.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onPress={() => nav.navigate('ProductEdit', { id: p.id })}
              right={
                <Button
                  label="Restock"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    actions.setAvailable(p.id, true);
                    toast(`${p.name} is back on the menu`);
                  }}
                />
              }
            />
          ))}
          <NoteBox>Items marked "back tomorrow" become available again automatically at opening time.</NoteBox>
        </>
      ) : (
        <EmptyState icon={PackageCheck} title="Nothing is out of stock" body="Every item on your menu can be ordered right now." />
      )}
    </Screen>
  );
}
