import type { ViewStyle } from 'react-native';

import { palette } from './palette';
import { mix } from './roles';

/**
 * Soft card fills that do not depend on the theme colour. Each is light enough to
 * sit beside any accent (blue, brown, green…) and carries its own dark ink, so the
 * text stays readable whichever theme colour a business picks.
 */
export const pastel = {
  butter: { bg: '#FFF4D6', line: '#F1DE9F', ink: '#6B4E00', accent: '#C28A00', bubble: '#FBE6A8' },
  peach: { bg: '#FFE9DD', line: '#F6CBB5', ink: '#7A3A17', accent: '#E0693A', bubble: '#FAD2BE' },
  mint: { bg: '#DDF3E6', line: '#B5E1C7', ink: '#1F5C3A', accent: '#2E9E5B', bubble: '#BDE7CE' },
  sky: { bg: '#E3EEFC', line: '#BFD5F3', ink: '#1B3F7A', accent: '#3F72D6', bubble: '#C8DCF7' },
  lavender: { bg: '#ECE7FB', line: '#D2C9F1', ink: '#43358A', accent: '#5B4BC4', bubble: '#D8D0F5' },
  rose: { bg: '#FBE4EA', line: '#F1BFCC', ink: '#7A2840', accent: '#D04A72', bubble: '#F6CAD6' },
} as const;

export type PastelName = keyof typeof pastel;

/** `accent` and `bubble` colour an icon and the round chip behind it. */

/** The border colour of a pastel card: its accent, softened so it outlines without shouting. */
export const pastelEdge = (name: PastelName) => mix(pastel[name].accent, '#FFFFFF', 0.45);

/** The card style for a pastel: a white card with only the border coloured, plus a faint shadow. */
export const pastelCard = (name: PastelName): ViewStyle => ({
  backgroundColor: palette.paper,
  borderWidth: 1,
  borderColor: pastelEdge(name),
  boxShadow: '0px 3px 10px rgba(26, 29, 33, 0.04)',
});
