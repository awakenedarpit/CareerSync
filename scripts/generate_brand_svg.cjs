const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '../client/public/brand/carrersync-brand-logo.jpg');
const buf = fs.readFileSync(imgPath);
const b64 = buf.toString('base64');
console.log('Base64 image length:', b64.length);

// 1. Full brand logo with wordmark and tagline (1024 x 576)
// Preserving the original artwork 100% without modification
const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <title>CarrerSync — Learn • Verify • Get Hired</title>
  <rect width="1024" height="576" fill="#FFFFFF"/>
  <image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="1024" height="576" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../client/public/brand/carrersync-brand-logo.svg'), fullSvg, 'utf8');
console.log('Saved client/public/brand/carrersync-brand-logo.svg');

// 2. Standalone emblem/icon (focused on the graduate + orbit + star)
// Emblem bounding box roughly x: 290 to 734, y: 15 to 370
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="280 10 464 365" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <title>CarrerSync Emblem</title>
  <rect x="280" y="10" width="464" height="365" fill="#FFFFFF"/>
  <image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="1024" height="576" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../client/public/brand/carrersync-icon.svg'), iconSvg, 'utf8');
console.log('Saved client/public/brand/carrersync-icon.svg');

// 3. Dark-theme friendly card logo (wrapped in a clean rounded card for dark surfaces)
const darkCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <title>CarrerSync Logo (Light Surface)</title>
  <rect width="1024" height="576" rx="32" fill="#FFFFFF"/>
  <image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="1024" height="576" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../client/public/brand/carrersync-logo-card.svg'), darkCardSvg, 'utf8');
console.log('Saved client/public/brand/carrersync-logo-card.svg');

// 4. Update favicon.svg with standalone emblem
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="280 10 464 365" width="32" height="32" preserveAspectRatio="xMidYMid meet">
  <rect x="280" y="10" width="464" height="365" rx="40" fill="#FFFFFF"/>
  <image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="1024" height="576" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../client/public/favicon.svg'), faviconSvg, 'utf8');
console.log('Updated client/public/favicon.svg');
