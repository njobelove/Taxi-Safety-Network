const fs   = require('fs');
const path = require('path');

const dist      = path.join(__dirname, 'dist');
const assetsDir = path.join(dist, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');

if (!fs.existsSync(dist)) { console.error('No dist/ folder. Run expo export first.'); process.exit(1); }
if (!fs.existsSync(assetsDir)) { console.error('No font assets in dist. Make sure App.js has font requires.'); process.exit(1); }

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

Object.entries(fonts).forEach(([k,v]) => v ? console.log('✅',k,'->',v) : console.log('⚠ MISSING:',k));

const css = Object.entries(fonts).filter(([,v])=>v).map(([family,file]) => `
  @font-face {
    font-family: '${family}';
    src: url('${fontPath}${file}') format('truetype');
    font-display: block;
    font-weight: normal;
    font-style: normal;
  }`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="theme-color" content="#d32f2f" />
    <meta name="application-name" content="TSN" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="TSN" />
    <meta name="description" content="Taxi Safety Network - Emergency alert system for taxi drivers in Cameroon" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
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

const manifest = {
  name:'TSN - Taxi Safety Network', short_name:'TSN',
  description:'Emergency alert system for taxi drivers in Cameroon',
  start_url:'/', display:'standalone',
  background_color:'#ffffff', theme_color:'#d32f2f',
  orientation:'portrait', scope:'/',
  icons:[
    {src:'/favicon.ico',sizes:'64x64',  type:'image/x-icon',purpose:'any maskable'},
    {src:'/favicon.ico',sizes:'192x192',type:'image/x-icon',purpose:'any maskable'},
    {src:'/favicon.ico',sizes:'512x512',type:'image/x-icon',purpose:'any maskable'},
  ],
};
fs.writeFileSync(path.join(dist,'manifest.json'), JSON.stringify(manifest,null,2), 'utf8');
console.log('\n✅ index.html patched with', Object.values(fonts).filter(Boolean).length, 'fonts');
console.log('✅ manifest.json written — PWA install enabled');