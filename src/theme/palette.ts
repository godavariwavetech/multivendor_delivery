/**
 * Colours sampled from the design board PDF (Vendor Delivery Dual Role App).
 * Names describe the colour, not its use — see `roles.ts` for how each role maps them.
 */
export const palette = {
  // shared surfaces
  cream: '#F5EAD8', // app background
  paper: '#F9F4ED', // cards, tab bar, keypad keys
  sunken: '#EEE7DB', // note boxes, photo placeholders, neutral pills
  line: '#DCD3C4', // borders, dividers, inactive tracks
  lineSoft: '#E7DFD2',
  stone: '#C0B6A5',
  night: '#2E2B25', // dimmed backdrop behind incoming requests

  // ink
  ink: '#201E1D',
  inkSoft: '#474238',
  inkMuted: '#7D766B',
  inkSubtle: '#A39B8E',
  white: '#FFFFFF',

  // deep clay — vendor
  clay: '#643312',
  clayDeep: '#402310',
  clayMid: '#B2622D',
  clayLight: '#D67F48',
  peach: '#FFE1D0',
  peachLine: '#FFC6A5',
  peachWash: '#FFF2EB',

  // sage — delivery partner
  sage: '#56633F',
  sageDeep: '#3D472B',
  sageDarkest: '#272E1B',
  sageMid: '#728157',
  sageToggle: '#8FA073',
  mint: '#E1EECC',
  mintLine: '#AEBF92',
  mintLineSoft: '#CCDBB2',
  mintWash: '#F0FAE1',
} as const;

export type PaletteColor = keyof typeof palette;
