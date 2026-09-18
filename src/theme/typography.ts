import type { TextStyle } from 'react-native';

/**
 * Inter throughout, for a clean professional look. Inter Display (optically tuned
 * for large sizes) is used for big amounts and screen titles; Inter carries
 * everything else. Both are SIL OFL 1.1 (docs/licenses/Inter-OFL.txt) and include
 * the ₹ sign, so amounts render in one consistent face.
 *
 * Each weight is a separate family name (the file name, which is also the PostScript
 * name, so the same value works on Android and iOS). No `fontWeight` is set: on
 * Android a fontWeight on a custom family makes the system fake a bold.
 */
export const fonts = {
  display: 'InterDisplay-Bold',
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const type = {
  // Large numbers and screen-level headings
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  displaySm: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  code: { fontFamily: fonts.display, fontSize: 44, lineHeight: 52, letterSpacing: 8 },

  // Structure
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  headline: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  stat: { fontFamily: fonts.bold, fontSize: 25, lineHeight: 30, letterSpacing: -0.4 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },

  // Reading text
  bodyStrong: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, letterSpacing: 0.9, textTransform: 'uppercase' },
  tab: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },

  // Controls
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  buttonSm: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  keypad: { fontFamily: fonts.medium, fontSize: 23, lineHeight: 29 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
