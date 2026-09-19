import { palette } from './palette';

export type Role = 'vendor' | 'delivery';

/**
 * Board 1d: "The app keeps one shell — same header block, same card language,
 * same 5-slot tab bar — and swaps the accent, the tab set and the home surface."
 * Everything that differs between the two roles lives here.
 */
export type RoleColors = {
  accent: string; // primary buttons, selected chips, hero cards
  accentDeep: string; // text on soft accent surfaces
  onAccent: string; // label colour on accent fills
  soft: string; // highlighted tiles, active tab pill, soft pills
  line: string; // highlighted card borders
  wash: string; // tinted callout backgrounds
};

export const roleColors: Record<Role, RoleColors> = {
  vendor: {
    accent: palette.blue,
    accentDeep: palette.blueDeep,
    onAccent: palette.white,
    soft: palette.sky,
    line: palette.skyLine,
    wash: palette.skyWash,
  },
  delivery: {
    accent: palette.green,
    accentDeep: palette.greenDeep,
    onAccent: palette.white,
    soft: palette.leaf,
    line: palette.leafLine,
    wash: palette.leafWash,
  },
};

/**
 * The colours the tenant picked in the admin dashboard, as the backend sends
 * them (GET /partner_app/getbranding, and with every signed-in payload). The
 * shades around the picked colour are derived server-side.
 */
export type RoleTheme = {
  accent: string;
  accentDeep: string;
  onAccent: string;
  soft: string;
  onSoft: string;
  line: string;
  wash: string;
  button: string;
  background: string | null;
  logo: string | null;
  logoDark: string | null;
  icon: string | null;
  loginBackground: string | null;
};

export type Branding = { vendor: RoleTheme | null; delivery: RoleTheme | null };

/** The workspace's colours: the tenant's pick when there is one, else the board's. */
export const roleColorsFrom = (role: Role, brand?: Branding | null): RoleColors => {
  const picked = brand?.[role];
  if (!picked) {
    return roleColors[role];
  }
  return {
    accent: picked.accent,
    accentDeep: picked.accentDeep,
    onAccent: picked.onAccent,
    soft: picked.soft,
    line: picked.line,
    wash: picked.wash,
  };
};
