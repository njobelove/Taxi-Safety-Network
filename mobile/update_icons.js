/**
 * Run this ONCE to copy PWA icons to your mobile/dist folder
 * Then commit and push to GitHub
 */
const fs   = require('fs');
const path = require('path');

const dist = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/dist';

// Icons are embedded as base64 in this script
// Copy them to dist/icons/ folder
const iconsDir = dist + '/icons';
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

console.log('Icons directory created at:', iconsDir);
console.log('Now copy icon-192.png, icon-512.png to mobile/dist/icons/');
console.log('Then update manifest.json to reference them');

// Update manifest.json
const manifestPath = dist + '/manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.icons = [
    { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ];
  manifest.screenshots = [
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'narrow' },
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json updated with real PNG icons');
}