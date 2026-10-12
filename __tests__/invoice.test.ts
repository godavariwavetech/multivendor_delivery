import { readFileSync } from 'fs';
import { join } from 'path';

import type { Order } from '../src/domain/types';
import { invoiceContent, invoicePdfBase64, jpegInfo } from '../src/utils/invoice';

const line = (i: number) => ({
  name: `Paneer Butter Masala (special) ${i}`,
  qty: 2,
  price: 1250,
  variant: 'Full',
  options: 'Extra butter, no onion, extra spicy with a long note that has to wrap onto another line',
});

const order = (count: number): Order =>
  ({
    id: 'VK-2838',
    status: 'ready',
    placedAt: Date.UTC(2026, 9, 12, 5, 30),
    lines: Array.from({ length: count }, (_, i) => line(i)),
    itemTotal: 148930,
    packing: 20,
    gst: 50,
    coupon: { code: 'SAVE10', amount: 100 },
    total: 148900,
    payout: 0,
    payment: 'cod',
    customer: { name: 'Asha (VIP)', area: 'Anna Nagar' },
    parcels: 1,
  }) as unknown as Order;

const decode = (b64: string) => Buffer.from(b64, 'base64').toString('latin1');
const issuer = { gstin: '33AABCU9603R1ZX' };
const store = { name: "Amma's Kitchen", area: 'Anna Nagar West', address: '14 2nd Avenue' };
// A 120 x 60 blue JPEG standing in for a store's logo.
const LOGO_JPEG = readFileSync(join(__dirname, 'fixtures', 'logo.jpg')).toString('latin1');

const expectValidXref = (pdf: string) => {
  const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
  expect(pdf.slice(xref, xref + 4)).toBe('xref');
  const entries = [...pdf.slice(xref).matchAll(/(\d{10}) 00000 n /g)].map(m => Number(m[1]));
  entries.forEach((offset, i) => expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true));
};

test('invoice PDF is well formed, with correct xref offsets', () => {
  const pdf = decode(invoicePdfBase64(order(3), store, issuer));
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  expectValidXref(pdf);
  expect(pdf).toContain('Rs.1,48,930');
  expect(pdf).toContain('(GSTIN: 33AABCU9603R1ZX)');
  expect(pdf).not.toContain('₹');
  expect(pdf).toContain('Masala ' + String.fromCharCode(92) + '(special' + String.fromCharCode(92) + ')');
  expect(pdf).not.toContain('/Subtype /Image');
});

test('a long order spills onto more pages', () => {
  const pdf = decode(invoicePdfBase64(order(60), store));
  const count = Number(/\/Count (\d+)/.exec(pdf)?.[1]);
  expect(count).toBeGreaterThan(1);
  expect(pdf.match(/\/Type \/Page /g)?.length).toBe(count);
});

test('a JPEG logo is read and embedded in the PDF', () => {
  const info = jpegInfo(LOGO_JPEG);
  expect(info).toEqual({ width: 120, height: 60, components: 3 });
  const pdf = decode(invoicePdfBase64(order(3), store, { ...issuer, logo: { data: LOGO_JPEG, ...info! } }));
  expect(pdf).toContain('/Subtype /Image /Width 120 /Height 60');
  expect(pdf).toContain('/Filter /DCTDecode');
  expect(pdf).toContain('/Im1 Do');
  expectValidXref(pdf);
});

test('something that is not a JPEG is rejected', () => {
  expect(jpegInfo('\u0089PNG\r\n')).toBeNull();
});

test('the tenant name is printed when it differs from the store name', () => {
  const pdf = decode(invoicePdfBase64(order(3), { ...store, tenantName: 'Godavari Foods' }, issuer));
  expect(pdf).toContain('(Godavari Foods)');
  expect(invoiceContent(order(1), { ...store, tenantName: 'Godavari Foods' }).tenantName).toBe('Godavari Foods');
  expectValidXref(pdf);
});

test('the tenant name is left out when it is the same as the store name', () => {
  expect(invoiceContent(order(1), { ...store, tenantName: " amma's kitchen " }).tenantName).toBeUndefined();
  expect(invoiceContent(order(1), { ...store, tenantName: null }).tenantName).toBeUndefined();
  expect(invoiceContent(order(1), store).tenantName).toBeUndefined();
});
