/** Indian mobile numbers: 10 digits starting 6-9. */
export const isValidMobile = (value: string): boolean => /^[6-9]\d{9}$/.test(value.trim());

export const isValidOtp = (value: string, length: number): boolean =>
  new RegExp(`^\\d{${length}}$`).test(value.trim());

export const isNonEmpty = (value: string): boolean => value.trim().length > 0;

export const isValidPassword = (value: string): boolean => value.length >= 6;

/** Digits only, capped at `max` characters — for OTP and code inputs. */
export const digitsOnly = (value: string, max: number): string =>
  value.replace(/\D/g, '').slice(0, max);
