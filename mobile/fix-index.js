const fs = require('fs');

const dist = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/dist';
const fontPath = '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/';
const assetsDir = dist + '/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts';

// Read actual exported font filenames
const files = fs.readdirSync(assetsDir);
const get = (name) => files.find(f => f.startsWith(name + '.') && f.endsWith('.ttf')) || '';

const MaterialIcons          = get('MaterialIcons');
const Ionicons               = get('Ionicons');
const FontAwesome5_Solid     = get('FontAwesome5_Solid');
const FontAwesome5_Regular   = get('FontAwesome5_Regular');
const FontAwesome5_Brands    = get('FontAwesome5_Brands');
const AntDesign              = get('AntDesign');
const Feather                = get('Feather');
const MaterialCommunityIcons = get('MaterialCommunityIcons');
const FontAwesome            = files.find(f => /^FontAwesome\.[a-f0-9]+\.ttf$/.test(f)) || '';

console.log('MaterialIcons:', MaterialIcons);
console.log('Ionicons:', Ionicons);
console.log('FontAwesome5_Solid:', FontAwesome5_Solid);

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
      @font-face {
        font-family: 'MaterialIcons';
        src: url('${fontPath}${MaterialIcons}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'Ionicons';
        src: url('${fontPath}${Ionicons}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'FontAwesome5_Solid';
        src: url('${fontPath}${FontAwesome5_Solid}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'FontAwesome5_Regular';
        src: url('${fontPath}${FontAwesome5_Regular}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'FontAwesome5_Brands';
        src: url('${fontPath}${FontAwesome5_Brands}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'AntDesign';
        src: url('${fontPath}${AntDesign}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'Feather';
        src: url('${fontPath}${Feather}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('${fontPath}${MaterialCommunityIcons}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'FontAwesome';
        src: url('${fontPath}${FontAwesome}') format('truetype');
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
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
console.log('\ndist/index.html updated with correct hashed font paths!');