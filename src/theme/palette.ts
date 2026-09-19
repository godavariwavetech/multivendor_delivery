/**
 * The eKart360 brand colours, sampled from the logo artwork: blue #1D44B5 (the
 * "e" and the wordmark) and green #098D11 (the cart and the "360").
 *
 * The surfaces are cool neutrals so the two brand hues sit on the same ground
 * the logo is drawn on. They replaced the design board's warm cream and clay,
 * which pulled against a blue-green mark. Names describe the colour, not its
 * use — see `roles.ts` for how each role maps them.
 */
export const palette = {
  // shared surfaces
  canvas: '#F4F6F8', // app background
  paper: '#FFFFFF', // cards, tab bar, keypad keys
  sunken: '#EDEFF3', // note boxes, photo placeholders, neutral pills
  line: '#D7DCE3', // borders, dividers, inactive tracks
  lineSoft: '#E5E9EF',
  stone: '#AAB2BD',
  night: '#22252A', // dimmed backdrop behind incoming requests

  // ink
  ink: '#1A1D21',
  inkSoft: '#3E444C',
  inkMuted: '#5F6673',
  inkSubtle: '#8A919C',
  white: '#FFFFFF',

  /**
   * Errors, validation messages, an overdue countdown, a closed store, the
   * unread dot. The old warm palette borrowed a mid clay tone for this; the
   * brand blue cannot say "something is wrong", so it is now explicit.
   */
  alert: '#B3261E',

  /**
   * The veg / non-veg marks on a dish. In India these are prescribed by FSSAI —
   * a green dot for vegetarian, a brown one for non-vegetarian — so they carry
   * a fixed meaning and must never follow the brand accent. They were the old
   * sage and clay, which meant a change of brand colour silently turned every
   * non-veg dish blue.
   */
  veg: '#0A7D12',
  nonVeg: '#8C2B18',

  // brand blue — vendor
  blue: '#1D44B5', // sampled from the logo
  blueDeep: '#132C75',
  blueMid: '#3C63CF',
  blueLight: '#7B96E6',
  sky: '#DDE5FA',
  skyLine: '#B9C9F3',
  skyWash: '#F0F4FD',

  // brand green — delivery partner
  green: '#098D11', // sampled from the logo
  greenDeep: '#055C0B',
  greenDarkest: '#043D07',
  greenMid: '#2BA833',
  greenToggle: '#52C25A',
  leaf: '#D9F2DB',
  leafLine: '#A3DCA7',
  leafLineSoft: '#C6E9C9',
  leafWash: '#EFFBF0',
} as const;

export type PaletteColor = keyof typeof palette;
