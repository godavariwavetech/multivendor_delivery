/** "AK" from "Amma's Kitchen", "RK" from "Ravi Kumar". */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

/** "#VK-2841" */
export const orderRef = (orderNumber: string): string => `#${orderNumber}`;

/** "dish" -> "dishes", "cut" -> "cuts". Enough for the store item nouns. */
export const pluralOf = (singular: string): string =>
  /(s|sh|ch|x|z)$/.test(singular) ? `${singular}es` : `${singular}s`;

/** "2 items" / "1 item" / "10 dishes" */
export const pluralise = (count: number, singular: string, plural = pluralOf(singular)): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const maskAccount = (accountNumber: string): string =>
  accountNumber.length <= 4 ? accountNumber : `••${accountNumber.slice(-4)}`;
