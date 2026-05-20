const fs = require('fs');
const path = require('path');

const src = process.env.GOOGLE_SERVICES_JSON;
if (!src) {
  console.log('GOOGLE_SERVICES_JSON env var not set; skipping copy.');
  process.exit(0);
}

try {
  const dests = [
    path.join(process.cwd(), 'android', 'app', 'google-services.json'),
    path.join(process.cwd(), 'google-services.json')
  ];

  for (const dest of dests) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Wrote ${dest}`);
  }
} catch (e) {
  console.error('Error copying google-services.json:', e);
  process.exit(1);
}
