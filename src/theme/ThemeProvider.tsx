import React, { createContext, useContext, useMemo } from 'react';

import { palette } from './palette';
import { Branding, Role, RoleColors, roleColors, roleColorsFrom } from './roles';

export type Theme = {
  role: Role;
  c: typeof palette;
  /** The active workspace's colours, already resolved against the tenant's branding. */
  r: RoleColors;
  /** Both workspaces, for the few places that show the other role's colour. */
  brand: Branding | null;
};

const ThemeContext = createContext<Theme>({ role: 'vendor', c: palette, r: roleColors.vendor, brand: null });

export function ThemeProvider({ role, brand, children }: { role: Role; brand?: Branding | null; children: React.ReactNode }) {
  const value = useMemo<Theme>(
    () => ({ role, c: palette, r: roleColorsFrom(role, brand), brand: brand ?? null }),
    [role, brand],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
