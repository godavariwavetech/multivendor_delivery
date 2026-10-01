import type { Product } from '@/domain/types';
import { formatAmount } from '@/utils/currency';

/** Keep food menu summaries in sync with the editable variant prices. */
export const productPriceLine = (product: Product): string => {
  const sheet = product.sheet;
  if (sheet.kind !== 'food') {
    return product.priceLine;
  }

  const variants = sheet.variants.map(variant => {
    const name = variant.name.trim().replace(/\s+plate$/i, '');
    const price = formatAmount(variant.price);
    return name && name.toLowerCase() !== 'regular' ? `${name} ${price}` : price;
  });
  return [...variants, `${sheet.prepMin} min`].join(' · ');
};
