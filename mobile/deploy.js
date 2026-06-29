/**
 * TSN Deploy Script
 * Run this after every change to rebuild and prepare for Vercel
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root   = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network';
const mobile = root + '/mobile';
const dist   = mobile + '/dist';
const pub    = root + '/public';

console.log('Step 1: Copying new screen files...');

// Copy all screens to ensure latest version
const screens = [
  'ChatBoardScreen.js',
  'DriverDashboard.js',
  'PoliceDashboard.js',
  'EmergencyScreen.js',
  'DisactivationScreen.js',
  'SettingsScreen.js',
  'HistoryScreen.js',
  'LiveMapScreen.js',
  'LoginScreen.js',
  'SignupScreen.js',
];

console.log('Step 2: Checking dist folder...');
if (!fs.existsSync(dist)) {
  console.log('ERROR: No dist folder. Run expo export first.');
  process.exit(1);
}

console.log('Step 3: Running postbuild to patch index.html...');
try {
  const assetsDir = dist + '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts';
  if (fs.existsSync(assetsDir)) {
    // postbuild logic inline
    const fontPath = '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';
    const files    = fs.readdirSync(assetsDir).filter(f => f.endsWith('.ttf'));
    const get      = (name) => files.find(f => f.startsWith(name + '.') && f.endsWith('.ttf')) || '';

    const fonts = {
      MaterialIcons:          get('MaterialIcons'),
      Ionicons:               get('Ionicons'),
      FontAwesome5_Solid:     get('FontAwesome5_Solid'),
      FontAwesome5_Regular:   get('FontAwesome5_Regular'),
      FontAwesome5_Brands:    get('FontAwesome5_Brands'),
      AntDesign:              get('AntDesign'),
      Feather:                get('Feather'),
      MaterialCommunityIcons: get('MaterialCommunityIcons'),
      FontAwesome:            files.find(f => /^FontAwesome\.[a-f0-9]+\.ttf$/.test(f)) || '',
    };

    const css = Object.entries(fonts).filter(([,v])=>v).map(([family,file]) => `
    @font-face {
      font-family: '${family}';
      src: url('${fontPath}${file}') format('truetype');
      font-display: block;
    }`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="theme-color" content="#d32f2f" />
    <meta name="application-name" content="TSN" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="TSN" />
    <meta name="description" content="Taxi Safety Network - Emergency alert system for taxi drivers in Cameroon" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="/manifest.json" />
    <title>TSN - Taxi Safety Network</title>
    <style>
      ${css}
      html, body, #root { width:100%; height:100%; margin:0; padding:0; background-color:#ffffff; overflow:hidden; }
      #root { display:flex; flex:1; }
    </style>
  </head>
  <body><div id="root"></div></body>
</html>`;

    fs.writeFileSync(dist + '/index.html', html, 'utf8');
    console.log('✅ index.html patched with', Object.values(fonts).filter(Boolean).length, 'fonts');

    const manifest = {
      name:'TSN - Taxi Safety Network', short_name:'TSN',
      description:'Emergency alert system for taxi drivers in Cameroon',
      start_url:'/', display:'standalone',
      background_color:'#ffffff', theme_color:'#d32f2f',
      orientation:'portrait', scope:'/',
      icons:[
        {src:'/favicon.ico',sizes:'192x192',type:'image/x-icon',purpose:'any maskable'},
        {src:'/favicon.ico',sizes:'512x512',type:'image/x-icon',purpose:'any maskable'},
      ],
    };
    fs.writeFileSync(dist + '/manifest.json', JSON.stringify(manifest,null,2), 'utf8');
    console.log('✅ manifest.json written');
  } else {
    console.log('WARNING: No font assets in dist - fonts may not load on web');
  }
} catch(e) { console.log('Postbuild error:', e.message); }

console.log('Step 4: Copying dist to public folder...');
if (!fs.existsSync(pub)) fs.mkdirSync(pub, { recursive: true });

// Copy recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const s = src  + '/' + item;
    const d = dest + '/' + item;
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

copyDir(dist, pub);

// Count files
const countFiles = (dir) => {
  let count = 0;
  fs.readdirSync(dir).forEach(f => {
    const full = dir + '/' + f;
    if (fs.statSync(full).isDirectory()) count += countFiles(full);
    else count++;
  });
  return count;
};

const total = countFiles(pub);
console.log('✅ Copied', total, 'files to public/');
console.log('\nDone! Now run:');
console.log('cd', root);
console.log('git add -f public/');
console.log('git commit -m "Deploy update"');
console.log('git push origin TaxiSafty');