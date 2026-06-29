/**
 * Run this AFTER expo export --platform web
 * It copies font files into the dist folder so Vercel serves them
 */
const fs   = require('fs');
const path = require('path');

const base   = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile';
const fonts  = base + '/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts';
const dist   = base + '/dist';
const outDir = dist + '/fonts';

if (!fs.existsSync(dist)) {
  console.log('ERROR: dist/ folder not found. Run: npx expo export --platform web first');
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const needed = [
  'MaterialIcons.ttf',
  'Ionicons.ttf',
  'FontAwesome5_Solid.ttf',
  'FontAwesome5_Regular.ttf',
  'FontAwesome5_Brands.ttf',
  'AntDesign.ttf',
  'Feather.ttf',
  'MaterialCommunityIcons.ttf',
  'FontAwesome.ttf',
];

needed.forEach(font => {
  const src  = fonts + '/' + font;
  const dest = outDir + '/' + font;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied to dist/fonts/:', font);
  } else {
    console.log('Not found:', font);
  }
});

// Also copy to dist/_expo/static/fonts if that folder exists
const expoFonts = dist + '/_expo/static/fonts';
if (!fs.existsSync(expoFonts)) fs.mkdirSync(expoFonts, { recursive: true });
needed.forEach(font => {
  const src  = fonts + '/' + font;
  const dest = expoFonts + '/' + font;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied to _expo/static/fonts/:', font);
  }
});

console.log('\nAll fonts copied! Now git add, commit and push.');