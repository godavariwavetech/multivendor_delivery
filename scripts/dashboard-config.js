// Shared by the dashboard server (reject early) and CI (never trust the input).
// Run directly in CI to turn the workflow inputs into build files.
const fs = require('fs');
const path = require('path');

const RULES = {
  businessName: [/^[A-Za-z0-9][A-Za-z0-9 \-]{1,29}$/, 'Business name: 2-30 letters, numbers, spaces or dashes.'],
  domain: [/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i, 'Domain: like shop.example.com (no https://, port or path).'],
  themeColor: [/^#[0-9a-f]{6}$/i, 'Theme colour: a #RRGGBB hex value.'],
  phone: [/^\+?[0-9 ()\-]{7,18}$/, 'Phone: 7-18 digits, may start with +.'],
  email: [/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/, 'Email: not a valid address.'],
  location: [/^[A-Za-z0-9 ,.\-]{2,80}$/, 'Location: 2-80 letters, numbers, spaces, commas, dots or dashes.'],
};
const MAX_LOGO_BYTES = 200 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Returns an error message, or null when every supplied field is acceptable. Blank = keep default. */
function validate(fields) {
  for (const [key, [re, message]] of Object.entries(RULES)) {
    const value = (fields[key] || '').trim();
    if (value && !re.test(value)) return message;
  }
  const logo = (fields.logo || '').trim();
  if (logo) {
    if (!/^[A-Za-z0-9+/=]+$/.test(logo)) return 'Logo: not valid base64.';
    const bytes = Buffer.from(logo, 'base64');
    if (bytes.length > MAX_LOGO_BYTES) return 'Logo: larger than 200 KB.';
    if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return 'Logo: must be a PNG image.';
  }
  return null;
}

function apply(fields, root) {
  const file = path.join(root, 'src/config/appConfig.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pick = key => (fields[key] || '').trim();
  if (pick('businessName')) config.businessName = pick('businessName');
  if (pick('domain')) config.domain = pick('domain').toLowerCase();
  if (pick('themeColor')) config.themeColor = pick('themeColor').toUpperCase();
  if (pick('phone')) config.contact.phone = pick('phone');
  if (pick('email')) config.contact.email = pick('email');
  if (pick('location')) config.location = pick('location');
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');

  const logo = pick('logo');
  if (logo) {
    const png = Buffer.from(logo, 'base64');
    fs.writeFileSync(path.join(root, 'src/assets/images/ekart360-logo.png'), png);
    fs.writeFileSync(path.join(root, 'build-logo.png'), png); // source for the launcher icons
  }
  return config;
}

module.exports = { validate };

if (require.main === module) {
  const e = process.env;
  const fields = {
    businessName: e.BUSINESS_NAME, domain: e.DOMAIN, themeColor: e.THEME_COLOR,
    phone: e.PHONE, email: e.EMAIL, location: e.LOCATION, logo: e.LOGO_BASE64,
  };
  const problem = validate(fields);
  if (problem) {
    console.error('Invalid dashboard input: ' + problem);
    process.exit(1);
  }
  console.log(apply(fields, path.resolve(__dirname, '..')));
}
