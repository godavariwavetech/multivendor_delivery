const RUPEE = '₹';

/** Indian grouping: 1,48,930 rather than 148,930. */
export const formatAmount = (value: number, symbol = RUPEE): string => {
  const negative = value < 0;
  const whole = Math.round(Math.abs(value));
  const s = String(whole);

  let grouped: string;
  if (s.length <= 3) {
    grouped = s;
  } else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }

  return `${negative ? '−' : ''}${symbol}${grouped}`;
};

/** For deductions shown as a negative line in a breakdown. */
export const formatDeduction = (value: number, symbol = RUPEE): string =>
  formatAmount(-Math.abs(value), symbol);

export const formatPercent = (value: number): string => `${value}%`;
