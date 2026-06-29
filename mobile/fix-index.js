const fs   = require('fs');
const path = require('path');

const dist     = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/dist';
const assetsDir = dist + '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts';

if (!fs.existsSync(assetsDir)) {
  console.log('ERROR: Assets dir not found:', assetsDir);
  process.exit(1);
}

// Find all font files with their hashed names
const fontFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.ttf'));
console.log('Found fonts:', fontFiles.length);

// Build @font-face CSS for each font
const fontFaceMap = {
  'MaterialIcons':          fontFiles.find(f => f.startsWith('MaterialIcons.')),
  'Ionicons':               fontFiles.find(f => f.startsWith('Ionicons.')),
  'FontAwesome5_Solid':     fontFiles.find(f => f.startsWith('FontAwesome5_Solid.')),
  'FontAwesome5_Regular':   fontFiles.find(f => f.startsWith('FontAwesome5_Regular.')),
  'FontAwesome5_Brands':    fontFiles.find(f => f.startsWith('FontAwesome5_Brands.')),
  'AntDesign':              fontFiles.find(f => f.startsWith('AntDesign.')),
  'Feather':                fontFiles.find(f => f.startsWith('Feather.')),
  'MaterialCommunityIcons': fontFiles.find(f => f.startsWith('MaterialCommunityIcons.')),
  'FontAwesome':            fontFiles.find(f => f.startsWith('FontAwesome.') && !f.includes('5') && !f.includes('6')),
};

const fontPath = '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';

let fontFaceCSS = '';
Object.entries(fontFaceMap).forEach(([family, file]) => {
  if (file) {
    fontFaceCSS += `
      @font-face {
        font-family: '${family}';
        src: url('${fontPath}${file}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }`;
    console.log('Mapped:', family, '->', file);
  } else {
    console.log('MISSING:', family);
  }
});

// Write the new index.html
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
      ${fontFaceCSS}
      html, body, #root {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        overflow: hidden;
      }
      #root { display: flex; flex: 1; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

fs.writeFileSync(dist + '/index.html', html, 'utf8');
console.log('\nindex.html updated with correct font paths!');
console.log('Now run: git add . && git commit -m "fix icons" && git push origin TaxiSafty');