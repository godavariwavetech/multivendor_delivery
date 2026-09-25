/**
 * Backend: D:\projects\multivendor_backend — Express + MySQL on port 2407, with
 * the app's routes mounted at /partner_app.
 *
 * Pointed at a colleague's hosted instance (godavariwave.in) instead of a local
 * server, so no emulator/LAN address juggling is needed. Still editable from
 * the sign-in screen ("Server") and stored on the device.
 */
export const DEFAULT_API_BASE_URL = 'http://godavariwave.in:2407';

/**
 * The address of the machine the backend was built against, tried on first run
 * so a phone on the same network connects without anyone typing an address.
 * It is only a guess: the Server screen overrides it, and what is typed there
 * is what the device remembers.
 */
export const DEV_LAN_BASE_URL = 'http://192.168.1.7:2407';

/** The mobile app's mount point in the backend. */
export const API_PREFIX = '/partner_app';

export const REQUEST_TIMEOUT_MS = 20000;

/** A photo takes longer than a JSON call, especially on mobile data. */
export const UPLOAD_TIMEOUT_MS = 60000;

/**
 * Demo mode: screens run on the seeded data in src/data/demo instead of the
 * API. Used by the tests, and handy for showing the app with no server around.
 */
export const USE_MOCK_DATA = false;

/** How often a signed-in workspace refetches its state. */
export const POLL_INTERVAL_MS = 15000;

/** Shown in Profile. Keep in step with android/app/build.gradle versionName. */
export const APP_VERSION = '1.0';

/**
 * Map tiles.
 *
 * Every hosted basemap either wants an API key or limits app traffic:
 * openstreetmap.org blocks apps outright, CARTO stamps "API KEY REQUIRED"
 * across keyless tiles. Esri's street basemap serves keyless requests cleanly,
 * so it is the development default.
 *
 * Before release, sign up with a tile host (MapTiler, Stadia, CARTO and Esri
 * all have free tiers), put the key in MAP_TILE_KEY and point MAP_TILE_URL at
 * them — for example:
 *   https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={key}
 * Keep an attribution line whatever you choose; OpenStreetMap's licence
 * requires it.
 */
export const MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const MAP_TILE_KEY = '';
export const MAP_ATTRIBUTION = '© Esri · OpenStreetMap';

export const OTP_LENGTH = 6;
export const DELIVERY_OTP_LENGTH = 4;

/** Board: "Requests expire in 20 seconds." */
export const REQUEST_RESPONSE_SECONDS = 20;

/** Board: prep times the vendor can promise on accept. */
export const PREP_TIME_OPTIONS = [10, 15, 20, 30] as const;

export const SUPPORT_FALLBACK_NUMBER = '+911800000000';
