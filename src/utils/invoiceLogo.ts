import ImageEditor from '@react-native-community/image-editor';
import { Image } from 'react-native';

import { type InvoiceLogo, jpegInfo } from './invoice';

/** A JPEG up to this size is embedded as it is; anything else is redrawn smaller first. */
const RAW_JPEG_LIMIT = 300 * 1024;
const LOGO_PIXELS = 256;

const bytesToBinary = (bytes: Uint8Array) => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return out;
};

const toLogo = (binary: string): InvoiceLogo | null => {
  const info = jpegInfo(binary);
  return info ? { data: binary, ...info } : null;
};

const imageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));

/**
 * The store's picture as a JPEG the invoice PDF can embed. A PNG or WebP (or a large JPEG) is
 * redrawn as a small JPEG; a transparent PNG gets a black background from that step. Any
 * failure returns null, so the invoice is still shared, just without the logo.
 */
export const loadInvoiceLogo = async (url?: string | null): Promise<InvoiceLogo | null> => {
  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }
  try {
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    if (bytes.length <= RAW_JPEG_LIMIT) {
      const raw = toLogo(bytesToBinary(bytes));
      if (raw) {
        return raw;
      }
    }
    const { width, height } = await imageSize(url);
    const scale = Math.min(1, LOGO_PIXELS / Math.max(width, height));
    const result = await ImageEditor.cropImage(url, {
      offset: { x: 0, y: 0 },
      size: { width, height },
      displaySize: { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) },
      resizeMode: 'contain',
      format: 'jpeg',
      quality: 0.9,
      includeBase64: true,
    });
    return result.base64 ? toLogo(atob(result.base64)) : null;
  } catch {
    return null;
  }
};
