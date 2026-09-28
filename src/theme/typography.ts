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
  hero: { fontFamily: fonts.regular, fontSize: 25, lineHeight: 30, letterSpacing: -0.3 },
  display: { fontFamily: fonts.regular, fontSize: 21, lineHeight: 26, letterSpacing: -0.2 },
  displaySm: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  code: { fontFamily: fonts.regular, fontSize: 32, lineHeight: 39, letterSpacing: 6 },

  // Structure
  title: { fontFamily: fonts.regular, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  headline: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 19 },
  stat: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  cardTitle: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },

  // Reading text
  bodyStrong: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16 },
  body: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16 },
  caption: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 14 },
  captionStrong: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 14 },
  label: { fontFamily: fonts.regular, fontSize: 9, lineHeight: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  tab: { fontFamily: fonts.regular, fontSize: 9, lineHeight: 12 },

  // Controls
  button: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  buttonSm: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  keypad: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 22 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
