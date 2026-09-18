# Backend integration — Vendor + Delivery app

The app's structure and how to run it are in the [README](../README.md). This note
records what the app talks to, what had to change in the database, and what is still
open.

Backend: `D:\projects\multivendor_backend` — Node/Express + MySQL, port **2407**,
JWT `Bearer` auth, response envelope `{ status, message, ... }` where `status` is
`200` ok / `202` business rejection / `401` auth / `500` error. The app's routes are
mounted at **`/partner_app`** (`partner_app/routes/routes.js`); `/dashboard_api`,
`/super_admin` and `/public_app` are untouched.

## What the app calls

Two calls carry a whole workspace — `GET /getvendorstate` and `GET /getpartnerstate`
return everything their screens render. Every other route is an action that returns
`{ status, message }`; the app then refetches the state (also every 15 s while a
workspace is open).

| Group | Routes |
|---|---|
| Sign-in (public) | `POST /login` · `POST /sendotp` · `POST /verifyotp` · `POST /resetpassword` · `GET /getbranding` |
| Session | `GET /getaccount` · `POST /switchrole` |
| Vendor | `GET /getvendorstate` · `POST /updatestoreonline` · `/updatestorebusy` · `/updateweeklyholiday` · `/acceptorder` · `/rejectorder` · `/extendpreptime` · `/markorderready` · `/confirmhandover` · `/updateproductavailability` · `/saveproduct` · `/savecoupon` · `/togglecoupon` · `/vendor/readnotifications` |
| Delivery | `GET /getpartnerstate` · `POST /updateonline` · `/acceptrequest` · `/rejectrequest` · `/reachedstore` · `/confirmpickup` · `/arrivedcustomer` · `/completedelivery` · `/faildelivery` · `/ratehandover` · `/updatepreferences` · `/delivery/readnotifications` |

A token is issued per workspace: a vendor token is rejected on delivery routes and
the other way round. `POST /switchrole` swaps it for a dual-role account.

Codes are never sent to the side that must ask for them. The partner's request JSON
carries empty `handoverCode` / `customerOtp`; `/confirmpickup` and `/completedelivery`
check what the partner typed against the order row. OTPs for sign-in are logged to
the backend console — no SMS gateway is wired up yet.

## Colours come from the tenant

The app has no hardcoded brand colour. `tenant_branding` holds what the tenant
picked in the admin dashboard — `brand_scope = 'vendor_app'` / `'delivery_app'`
(or `'partner_app'` for both) — and `primary_color` becomes that workspace's
accent. The server derives the rest (deep shade, soft fill, border, wash, and a
light or dark label colour by luminance), so one picked colour is enough.

`GET /getbranding` themes the sign-in screen before anyone signs in; every
signed-in payload carries the same object, so a change in the dashboard reaches
an open app on its next 15-second poll. The app caches the last colours on the
device and falls back to the design-board palette when a tenant has set none.

This drives everything accent-led: buttons, tabs, hero cards, tiles, pills,
toggles, charts and the sign-in screen. The neutral paper surfaces stay as
designed — `header_color` is returned but not applied, since those sit in static
stylesheets.

## Schema changes (`database/migration_partner_app.sql`)

Additive and re-runnable (`ADD COLUMN IF NOT EXISTS`), so the admin dashboard keeps
working. It closes the gaps the board needed:

| Gap | Now |
|---|---|
| No `ready` status between preparing and out_for_delivery | `orders.order_status = 7 ready` |
| No prep time | `orders.prep_minutes`, plus `accepted_at` / `ready_at` / `picked_up_at` |
| No handover code, no delivery OTP | `orders.handover_code`, `orders.delivery_otp` |
| No tip, packing, parcels, coupon on an order | `orders.tip_amount`, `packing_charges`, `parcel_count`, `coupon_code` |
| Store category not on the vendor | `vendors.store_category`, plus `vendors.is_busy` for busy mode |
| Per-category product sheets had nowhere to live | `products.attributes_json`, `products.prep_minutes` |
| Assignment had no pay breakdown or trip stages | `delivery_assignments.base_pay` / `distance_pay` / `tip_pay` / `distance_km` / `offer_expires_at` / `arrived_store_at` / `arrived_customer_at` / `failure_reason` / `handover_rating` / `proof_photo` |
| Partner had no zone or shift | `delivery_partners.zone_name`, `shift_preference`, `online_since` |

`database/seed_partner_app_demo.sql` fills ids 9000–9999 with a demo tenant: two
vendors (food and grocery), two partners, products with variants and add-ons, today's
orders in every state, six days of history plus last month, settlements, payouts,
coupons and notifications. It deletes its own rows first, so re-running it resets the
demo (and re-dates it to today).

Statuses the app maps to:

| Enum | DB source | Values |
|---|---|---|
| `orderStatus` | `orders.order_status` | 0 placed · 1 accepted · 2 preparing · 3 out_for_delivery · 4 delivered · 5 cancelled · 6 rejected · **7 ready** |
| `assignmentStatus` | `delivery_assignments.assignment_status` | 0 offered · 1 accepted · 2 picked_up · 3 delivered · 4 rejected · 5 cancelled |
| `paymentType` | `orders.payment_type` | cod · online · wallet |
| `settlementStatus` | `vendor_settlements` | 0 pending · 1 processed · 2 paid |
| `storeCategory` | `vendors.store_category` | food · grocery · fruit · bakery · meat |

Soft deletes (`d_in`) and `i_ts` stamps apply everywhere; amounts are `decimal(10,2)`
and reach the app as numbers in rupees.

## Still open

1. **Passwords are stored in plain text.** `/partner_app/login` matches the admin
   dashboard's behaviour so the same accounts work in both. `passwordMatches()` also
   accepts a bcrypt hash if `bcryptjs` is installed, so hashing can be switched on
   without touching the app — but the admin API has to change at the same time.
2. **`app.js` logs every request body**, including `/login` passwords and OTPs. It is
   shared with the other mounts, so it was left alone; turn the payload logger off
   before this runs anywhere but a dev machine.
3. **No SMS provider.** Sign-in OTPs are printed to the server console.
4. **Bakery is not in `categories.vertical`** (food, grocery, meat, medicine, fruit).
   `vendors.store_category` accepts it and the app maps `fruit → produce`.
5. **No customer app**, so the delivery OTP shown to a customer has no home. New
   orders get one at accept time, logged to the console with the handover code.
6. **Plain HTTP.** The release build allows cleartext traffic
   (`android/app/build.gradle`) because the backend is on the LAN; remove that when
   the API is served over HTTPS.
7. **Push and live location are not wired.** The app polls every 15 s; `delivery_tracking`
   is unused.

---
