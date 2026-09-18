/** "3.4 km" / "800 m" */
export const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

/** Rough trip estimate used only for static screens; the maps SDK replaces this. */
export const estimateMinutes = (km: number, averageKmph = 18): number =>
  Math.max(1, Math.round((km / averageKmph) * 60));
