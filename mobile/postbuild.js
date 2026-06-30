/**
 * TSN Post-Build Script v2
 * Copies fonts to a clean /fonts/ path (avoids node_modules in URL which Vercel may ignore)
 */
const fs   = require('fs');
const path = require('path');

const dist      = path.join(__dirname, 'dist');
const srcFonts  = path.join(dist, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const destFonts = path.join(dist, 'fonts');

if (!fs.existsSync(dist)) { console.error('No dist/ folder. Run expo export first.'); process.exit(1); }
if (!fs.existsSync(srcFonts)) { console.error('No font assets in dist. Make sure App.js has font requires.'); process.exit(1); }

// Create clean fonts folder (no node_modules in path)
if (!fs.existsSync(destFonts)) fs.mkdirSync(destFonts, { recursive: true });

const files = fs.readdirSync(srcFonts).filter(f => f.endsWith('.ttf'));
files.forEach(f => fs.copyFileSync(path.join(srcFonts, f), path.join(destFonts, f)));
console.log('Copied', files.length, 'fonts to dist/fonts/ (clean path)');

const get = (name) => files.find(f => f.startsWith(name + '.') && f.endsWith('.ttf')) || '';

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

Object.entries(fonts).forEach(([k,v]) => v ? console.log('✅',k,'->','/fonts/'+v) : console.log('⚠ MISSING:',k));

const css = Object.entries(fonts).filter(([,v])=>v).map(([family,file]) => `
  @font-face {
    font-family: '${family}';
    src: url('/fonts/${file}') format('truetype');
    font-display: block;
    font-weight: normal;
    font-style: normal;
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

fs.writeFileSync(path.join(dist,'index.html'), html, 'utf8');
console.log('\n✅ index.html patched - fonts load from /fonts/ (clean path)');

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
fs.writeFileSync(path.join(dist,'manifest.json'), JSON.stringify(manifest,null,2), 'utf8');
console.log('✅ manifest.json written');