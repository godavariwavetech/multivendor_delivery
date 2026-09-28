# eKart360 Partner — Vendor + Delivery app

One React Native CLI app for two roles, built from the design board
*Vendor Delivery Dual Role App*. The session carries the role; the app keeps one
shell (header block, card language, 5-slot tab bar) and swaps the accent, the tab set
and the home surface.

| | Vendor | Delivery partner |
|---|---|---|
| Accent | deep clay `#643312` | sage `#56633F` |
| Tabs | Home · Orders · Menu · Earnings · Profile | Home · Requests · Active · Earnings · Profile |

## Status

Every screen on the board is built, and the app now runs on the backend: it signs in
against `/partner_app`, loads both workspaces from MySQL and writes every action back
(accept, reject, mark ready, handover, pickup, delivery OTP, coupons, availability,
online/busy). It refetches on each action and every 15 seconds.

Run the backend first (`npm start` in `D:\projects\multivendor_backend`, port 2407)
with `database/migration_partner_app.sql` and `database/seed_partner_app_demo.sql`
applied. What the app calls and what changed in the database is in
[docs/backend-alignment.md](docs/backend-alignment.md).

### Live backend sign in

| Mobile | Password | Roles |
|---|---|---|
| 98407 21536 | 123456 | Vendor (Amma's Kitchen, food) **and** partner (Ravi Kumar) — pick either with the tabs |
| 98407 00001 | 123456 | Vendor only (Sri Balaji Stores, grocery) |
| 98407 00002 | 123456 | Partner only (Karthik R.) |

These come from the demo seed. A number can only open a workspace it is registered
for. "Use OTP instead" and "Forgot password" work too — no SMS gateway is wired up,
so the code is printed in the backend's console.

### V1 category test credentials (mock mode)

Set `USE_MOCK_DATA` to `true` in `src/config/constants.ts`. Every password below
is `123456` (any password of four or more characters also works). The Delivery
workspace includes Food, Grocery, Fruits & Vegetables, Bakery & Sweets, and Meat &
Seafood pickup scenarios.

| Mobile | Password | Opens |
|---|---|---|
| 98407 21536 | 123456 | Both workspaces — Food vendor (Amma's Kitchen) or Delivery partner; choose the tab at sign-in. |
| 98407 00001 | 123456 | Vendor only — Sri Balaji Stores (Grocery). |
| 98407 00002 | 123456 | Vendor only — Green Farm Mandi (Fruits & Vegetables). |
| 98407 00003 | 123456 | Vendor only — Anna Nagar Bakes (Bakery & Sweets). |
| 98407 00004 | 123456 | Vendor only — Marina Fresh Meats (Meat & Seafood). |
| 98407 00005 | 123456 | Delivery partner only — all five V1 category pickup flows. |

### Server address

*Server settings* under the sign-in button sets where the app looks for the backend,
and remembers it on the device:

- Android emulator → `http://10.0.2.2:2407` (the default)
- Phone on the same Wi-Fi → your PC's address, e.g. `http://192.168.1.5:2407`
- USB → `adb reverse tcp:2407 tcp:2407`, then `http://localhost:2407`

Check the server answers before installing anything:

```sh
node scripts/api-smoke.js                       # localhost
node scripts/api-smoke.js http://192.168.1.5:2407
```

### Demo mode

`USE_MOCK_DATA` in `src/config/constants.ts` switches the whole app back to the
seeded data in `src/data/demo` — no server, no sign-in check (any password of 4+
characters, any 6-digit OTP), and Profile → *Demo · store category* to see every
category's menu and pickup handling. The test suite runs in this mode.

## Run

```sh
npm install
npm start            # Metro
npm run android      # debug build on a device/emulator
npm test             # renders every screen in both roles (demo data)
                     # __tests__/live-api.test.tsx additionally renders screens on
                     # the real API when the backend is reachable, and skips if not
npm run typecheck
npm run lint
```

### Release APK on this machine

```sh
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a -PskipHermesc
```

- `-PskipHermesc` — the organisation's Device Guard policy blocks `hermesc.exe`, so the
  bundle ships as plain JS (Hermes compiles it at startup). Don't use for store builds.
- `android/local.properties` must point `cmake.dir` at CMake 3.31.6; the default 3.22.1
  hits Windows' 260-character path limit.

## Layout

```
src/
  app/          App entry and providers
  navigation/   Auth, vendor and delivery stacks + both tab shells
  theme/        palette (sampled from the board), role accents, type scale
  components/   UI kit: cards, pills, toggles, keypad, slide-to-confirm, map placeholder…
  data/         session, vendorStore, deliveryStore (API + reducers) and demo seed data
  domain/       view-model types and labels, mapped to multivendor_db.sql
  features/
    auth/       login (with workspace tabs), OTP, password reset
    vendor/     home, orders (accept, cooking queue, handover), menu + category sheets,
                earnings, coupons, reports, profile
    delivery/   home, requests, active trip (to store → pickup → code → drop → OTP → done),
                category pickup handling, earnings, history, profile
    shared/     notifications, language, help, report a problem, privacy, bank account
  utils/        currency, time, order and trip helpers
  api/          HTTP client, endpoints and token/server-address storage
```

Fonts: Inter and Inter Display (SIL OFL 1.1, licence in `docs/licenses/Inter-OFL.txt`).
