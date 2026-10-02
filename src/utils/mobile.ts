import { isValidMobile } from './validation';

/**
 * Digits of a typed or pasted Indian mobile number with a country code ("+91",
 * "91") or trunk "0" removed, so a pasted "+91 98407 21536" is not cut off at the
 * wrong end. May still be longer than 10.
 */
const withoutPrefix = (value: string): string => {
  const d = value.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) {
    return d.slice(2);
  }
  if (d.length > 10 && d.startsWith('0')) {
    return d.slice(1);
  }
  return d;
};

/** The first 10 digits of whatever was typed or pasted. */
export const mobileDigits = (value: string): string => withoutPrefix(value).slice(0, 10);

/** True when more than 10 digits were entered, so the extra ones are being dropped. */
export const mobileHasExtraDigits = (value: string): boolean => withoutPrefix(value).length > 10;

/** "9840721536" → "98407 21536", for display in the field. */
export const formatMobile = (value: string): string => {
  const d = mobileDigits(value);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
};

/**
 * What to tell the person about the number as it stands, or null while it is
 * fine or still being typed. A full 10 digits must also be a real mobile number.
 */
export const mobileIssue = (digits: string, extraDigits: boolean): string | null => {
  if (extraDigits) {
    return 'A mobile number has 10 digits. Please enter a correct number.';
  }
  if (digits.length === 10 && !isValidMobile(digits)) {
    return 'Please enter a correct mobile number. It starts with 6, 7, 8 or 9.';
  }
  return null;
};
