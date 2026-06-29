/**
 * Runs automatically after expo export
 * Copies icon fonts into dist so they load on Vercel
 */
const fs   = require('fs');
const path = require('path');

const dist     = path.join(__dirname, 'dist');
const fontsDir = path.join(__dirname, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const assetsDir = path.join(dist, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');

if (!fs.existsSync(dist)) {
  console.log('No dist folder yet - skipping font copy');
  process.exit(0);
}

if (!fs.existsSync(assetsDir)) {
  console.log('No assets dir yet - skipping');
  process.exit(0);
}

// Read actual exported hashed font filenames from dist
const exportedFonts = fs.readdirSync(assetsDir).filter(f => f.endsWith('.ttf'));
const get = (name) => exportedFonts.find(f => f.startsWith(name + '.') && f.endsWith('.ttf')) || '';

const fontMap = {
  'MaterialIcons':          get('MaterialIcons'),
  'Ionicons':               get('Ionicons'),
  'FontAwesome5_Solid':     get('FontAwesome5_Solid'),
  'FontAwesome5_Regular':   get('FontAwesome5_Regular'),
  'FontAwesome5_Brands':    get('FontAwesome5_Brands'),
  'AntDesign':              get('AntDesign'),
  'Feather':                get('Feather'),
  'MaterialCommunityIcons': get('MaterialCommunityIcons'),
  'FontAwesome':            exportedFonts.find(f => /^FontAwesome\.[a-f0-9]+\.ttf$/.test(f)) || '',
};

const fontPath = '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';

let fontFaceCSS = '';
Object.entries(fontMap).forEach(([family, file]) => {
  if (file) {
    fontFaceCSS += `
    @font-face {
      font-family: '${family}';
      src: url('${fontPath}${file}') format('truetype');
      font-display: block;
      font-weight: normal;
      font-style: normal;
    }`;
    console.log('✅ Font mapped:', family, '->', file);
  }
});

// Read existing index.html and inject font CSS
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Inject font faces into <head>
const fontStyleTag = `<style>${fontFaceCSS}
  html, body, #root { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
  #root { display: flex; flex: 1; }
</style>`;

html = html.replace('</head>', fontStyleTag + '\n</head>');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html updated with font paths');
console.log('Done!');