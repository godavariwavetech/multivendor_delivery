/**
 * Formatting is done by hand rather than with Intl so the output is identical on
 * every JS engine: "7:42 PM", "2:18", "42s ago".
 */

/** "7:42 PM" */
export const clock = (ms: number): string => {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "2:18" — accept windows, prep timers, respond timers. Negative input renders as its absolute value. */
export const formatCountdown = (totalSeconds: number): string => {
  const s = Math.abs(Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** "42s ago", "6 min ago", "2 h ago" */
export const ago = (ms: number, now = Date.now()): string => {
  const sec = Math.max(0, Math.floor((now - ms) / 1000));
  if (sec < 60) {
    return `${sec}s ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} min ago`;
  }
  const hours = Math.floor(min / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "16 Sep" */
export const dayMonth = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "Today, 7:42 PM" or "16 Sep, 7:42 PM" */
export const dayClock = (ms: number, now = Date.now()): string => {
  const same = new Date(ms).toDateString() === new Date(now).toDateString();
  return `${same ? 'Today' : dayMonth(ms)}, ${clock(ms)}`;
};
