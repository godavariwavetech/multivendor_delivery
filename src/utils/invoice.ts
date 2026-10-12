import type { Order, Store } from '@/domain/types';

import { formatAmount } from './currency';
import { clock, dayMonth } from './datetime';

type StoreInfo = Pick<Store, 'name' | 'area' | 'address' | 'tenantName'>;

/** A JPEG held as a binary string (one character per byte), ready to be embedded as it is. */
export type InvoiceLogo = { data: string; width: number; height: number; components: 1 | 3 };

/** What the invoice says about who issued it: the store's GST number and its logo. */
type InvoiceIssuer = { gstin?: string; logo?: InvoiceLogo | null };

/** The words and figures on an invoice, shared by the PDF and the preview shown before sharing. */
export type InvoiceContent = {
  /** The tenant (business) name; left out when it is the same as the store's. */
  tenantName?: string;
  storeName: string;
  address: string;
  gstin?: string;
  number: string;
  placed: string;
  customer: string;
  items: { label: string; amount: string }[];
  totals: { label: string; amount: string }[];
  total: string;
  payment: string;
};

export const invoiceContent = (order: Order, store: StoreInfo, gstin?: string): InvoiceContent => ({
  tenantName: store.tenantName && store.tenantName.trim().toLowerCase() !== store.name.trim().toLowerCase() ? store.tenantName.trim() : undefined,
  storeName: store.name,
  address: [store.address, store.area].filter(Boolean).join(', '),
  gstin,
  number: order.id,
  placed: `${dayMonth(order.placedAt)}, ${clock(order.placedAt)}`,
  customer: `${order.customer.name}, ${order.customer.area}`,
  items: order.lines.map(l => {
    const detail = [l.variant, l.options].filter(Boolean).join(', ');
    return { label: `${l.qty} × ${l.name}${detail ? ` (${detail})` : ''}`, amount: formatAmount(l.price) };
  }),
  totals: [
    { label: 'Item total', amount: formatAmount(order.itemTotal) },
    { label: 'Packing', amount: formatAmount(order.packing) },
    { label: 'GST', amount: formatAmount(order.gst) },
    ...(order.coupon ? [{ label: `Coupon ${order.coupon.code}`, amount: formatAmount(-order.coupon.amount) }] : []),
  ],
  total: formatAmount(order.total),
  payment: order.refunded ? 'Refunded' : order.payment === 'cod' ? 'Cash on delivery' : 'Paid online',
});

const LOGO_BOX = 56; // the logo is scaled to fit this square, in points

/** Reads size and colour channels from a JPEG's start-of-frame marker; null if it is not a usable JPEG. */
export const jpegInfo = (data: string): Pick<InvoiceLogo, 'width' | 'height' | 'components'> | null => {
  if (data.charCodeAt(0) !== 0xff || data.charCodeAt(1) !== 0xd8) {
    return null;
  }
  let i = 2;
  while (i + 9 < data.length) {
    if (data.charCodeAt(i) !== 0xff) {
      i += 1;
      continue;
    }
    const marker = data.charCodeAt(i + 1);
    // Baseline and progressive frames; the other frame types are rare and not widely readable.
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = data.charCodeAt(i + 5) * 256 + data.charCodeAt(i + 6);
      const width = data.charCodeAt(i + 7) * 256 + data.charCodeAt(i + 8);
      const components = data.charCodeAt(i + 9);
      return width > 0 && height > 0 && (components === 1 || components === 3) ? { width, height, components } : null;
    }
    i += 2 + (data.charCodeAt(i + 2) * 256 + data.charCodeAt(i + 3));
  }
  return null;
};

const PAGE_W = 595; // A4 in points
const PAGE_H = 842;
const MARGIN = 48;
const RIGHT = PAGE_W - MARGIN;

// Widths (per 1000 em) of the Helvetica glyphs an invoice uses; anything else is treated as 556.
const NARROW: Record<string, number> = { ' ': 278, ',': 278, '.': 278, ':': 278, '-': 333, '(': 333, ')': 333, '#': 556, R: 722, s: 500 };
const textWidth = (text: string, size: number) => {
  let units = 0;
  for (const ch of text) {
    units += NARROW[ch] ?? 556;
  }
  return (units * size) / 1000;
};

/**
 * The PDF's built-in Helvetica has no rupee sign or dashes beyond Latin-1, so those become
 * "Rs." and "-". Everything else outside Latin-1 becomes "?" so the file stays valid.
 */
export const toLatin1 = (text: string) =>
  text
    .replace(/₹/g, 'Rs.')
    .replace(/[−–—]/g, '-')
    .replace(/[^\x20-\xff]/g, '?');

const escapePdf = (text: string) => toLatin1(text).replace(/[\\()]/g, m => `\\${m}`);

/** Breaks a long line (a dish with variants and add-ons) at word boundaries. */
const wrap = (text: string, size: number, maxWidth: number): string[] => {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(toLatin1(next), size) > maxWidth) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    out.push(line);
  }
  return out;
};

/**
 * A one-or-more page A4 invoice as a PDF, returned base64 encoded. Written by hand against
 * the PDF 1.4 spec (Helvetica, no embedded fonts) so it needs no PDF library.
 */
export const invoicePdfBase64 = (order: Order, store: StoreInfo, issuer: InvoiceIssuer = {}): string => {
  const pages: string[][] = [[]];
  let y = PAGE_H - MARGIN;

  const ops = () => pages[pages.length - 1];
  const text = (value: string, x: number, size: number, bold = false, align: 'left' | 'right' = 'left') => {
    const safe = toLatin1(value);
    const left = align === 'right' ? x - textWidth(safe, size) : x;
    ops().push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${left.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(value)}) Tj ET`);
  };
  const rule = () => {
    ops().push(`0.75 G 0.5 w ${MARGIN} ${y.toFixed(2)} m ${RIGHT} ${y.toFixed(2)} l S`);
  };
  const down = (amount: number) => {
    y -= amount;
    if (y < MARGIN + 40) {
      pages.push([]);
      y = PAGE_H - MARGIN;
    }
  };

  const logo = issuer.logo ?? null;
  const logoScale = logo ? Math.min(LOGO_BOX / logo.width, LOGO_BOX / logo.height) : 0;
  const logoW = logo ? logo.width * logoScale : 0;
  const logoH = logo ? logo.height * logoScale : 0;
  // The store's name and address sit beside the logo when there is one.
  const headX = logo ? MARGIN + LOGO_BOX + 14 : MARGIN;
  const headTop = y;
  if (logo) {
    ops().push(`q ${logoW.toFixed(2)} 0 0 ${logoH.toFixed(2)} ${MARGIN} ${(y - logoH).toFixed(2)} cm /Im1 Do Q`);
  }

  const c = invoiceContent(order, store, issuer.gstin);

  y -= logo ? 10 : 0; // the first baseline sits a little below the top edge of the logo
  if (c.tenantName) {
    text(c.tenantName, headX, 10, true);
    down(18);
  } else if (logo) {
    down(6);
  }
  text(c.storeName, headX, 20, true);
  down(18);
  if (c.address) {
    for (const line of wrap(c.address, 10, RIGHT - headX)) {
      text(line, headX, 10);
      down(13);
    }
  }
  if (c.gstin) {
    text(`GSTIN: ${c.gstin}`, headX, 10, true);
    down(13);
  }
  if (logo) {
    y = Math.min(y, headTop - logoH); // the invoice number never starts inside the logo
  }
  down(logo ? 20 : 10);
  text(`INVOICE #${c.number}`, MARGIN, 14, true);
  text(c.placed, RIGHT, 10, false, 'right');
  down(16);
  text(`Customer: ${c.customer}`, MARGIN, 10);
  down(14);
  rule();
  down(16);

  text('Item', MARGIN, 10, true);
  text('Amount', RIGHT, 10, true, 'right');
  down(6);
  rule();
  down(16);

  for (const item of c.items) {
    const [first, ...rest] = wrap(item.label, 10, RIGHT - MARGIN - 90);
    text(first ?? '', MARGIN, 10);
    text(item.amount, RIGHT, 10, false, 'right');
    down(14);
    for (const line of rest) {
      text(line, MARGIN + 12, 10);
      down(14);
    }
  }

  rule();
  down(16);
  const row = (label: string, amount: string, bold = false) => {
    text(label, MARGIN, bold ? 12 : 10, bold);
    text(amount, RIGHT, bold ? 12 : 10, bold, 'right');
    down(bold ? 18 : 14);
  };
  c.totals.forEach(t => row(t.label, t.amount));
  rule();
  down(16);
  row('TOTAL', c.total, true);
  text(`Payment: ${c.payment}`, MARGIN, 10);
  down(30);
  text('Thank you!', MARGIN, 11, true);

  // Objects: 1 catalog, 2 page tree, 3 Helvetica, 4 Helvetica-Bold, then a page + content stream per page.
  const objects: string[] = [];
  const firstPage = logo ? 6 : 5; // object 5 is the logo image when there is one
  const pageIds = pages.map((_, i) => firstPage + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  if (logo) {
    objects[5] =
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} ` +
      `/ColorSpace /${logo.components === 1 ? 'DeviceGray' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.data.length} >>\n` +
      `stream\n${logo.data}\nendstream`;
  }
  const xobjects = logo ? ' /XObject << /Im1 5 0 R >>' : '';
  pages.forEach((content, i) => {
    const stream = content.join('\n');
    objects[firstPage + i * 2] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xobjects} >> /Contents ${firstPage + 1 + i * 2} 0 R >>`;
    objects[firstPage + 1 + i * 2] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  // Every character is Latin-1 by construction, so each one is exactly one byte.
  return btoa(pdf);
};
