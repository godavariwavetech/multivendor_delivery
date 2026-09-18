#!/usr/bin/env node
/**
 * Checks that the partner_app API answers the way the app expects.
 *
 *   node scripts/api-smoke.js [baseUrl] [mobile] [password]
 *   node scripts/api-smoke.js http://192.168.1.5:2407 9840721536 123456
 *
 * It only reads: sign in as each workspace and fetch its state. Nothing is
 * accepted, rejected or delivered.
 */

const [, , baseArg, mobileArg, passwordArg] = process.argv;
const BASE = (baseArg || 'http://localhost:2407').replace(/\/+$/, '');
const MOBILE = mobileArg || '9840721536';
const PASSWORD = passwordArg || '123456';

const call = async (path, { token, body } = {}) => {
  const res = await fetch(`${BASE}/partner_app${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json();
  if (payload.status !== 200) {
    throw new Error(`${path} → ${payload.status} ${payload.message || ''}`);
  }
  return payload;
};

const line = (label, value) => console.log(`  ${label.padEnd(16)} ${value}`);

async function main() {
  console.log(`partner_app at ${BASE}\n`);

  const vendor = await call('/login', { body: { mobile: MOBILE, password: PASSWORD, role: 'vendor' } });
  console.log(`vendor · ${vendor.account.vendor.storeName}`);
  const v = (await call('/getvendorstate', { token: vendor.token })).data;
  line('store', `${v.store.name} · ${v.store.category} · ${v.open ? 'open' : 'closed'}`);
  line('orders', `${v.orders.length} (${v.orders.filter(o => o.status === 'new').length} new)`);
  line('menu', `${v.products.length} items · ${v.coupons.length} coupons`);
  line('earnings', `${v.earnings.month.label} net ₹${v.earnings.month.net}`);
  line('settlements', `${v.settlements.length}`);
  line('notifications', `${v.notifications.length}`);

  const partner = await call('/login', { body: { mobile: MOBILE, password: PASSWORD, role: 'delivery' } });
  console.log(`\ndelivery · ${partner.account.partner.name}`);
  const d = (await call('/getpartnerstate', { token: partner.token })).data;
  line('partner', `${d.profile.name} · ${d.profile.zone} · ${d.online ? 'online' : 'offline'}`);
  line('requests', `${d.requests.length}`);
  line('active', d.active ? `${d.active.requestId} · ${d.active.stage}` : 'none');
  line('trips today', `${d.trips.length} · earned ₹${d.today.earned}`);
  line('week', `${d.week.label} · ₹${d.week.total}`);
  line('statements', `${d.statements.length}`);

  console.log('\nOK');
}

main().catch(error => {
  console.error(`\nFAILED: ${error.message}`);
  process.exitCode = 1;
});
