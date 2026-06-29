const fs   = require('fs');
const path = require('path');

const base    = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile';
const srcDir  = base + '/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts';
const webDir  = base + '/web';
const destDir = base + '/web/assets';

// Step 1 — Create web/assets folder
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('Created:', destDir);
}

// Step 2 — Copy all font files
const fonts = fs.readdirSync(srcDir).filter(f => f.endsWith('.ttf'));
fonts.forEach(font => {
  fs.copyFileSync(srcDir + '/' + font, destDir + '/' + font);
  console.log('Copied:', font);
});

// Step 3 — Fix index.HTML -> index.html (rename if wrong case)
const wrongCase = webDir + '/index.HTML';
const rightCase = webDir + '/index.html';
if (fs.existsSync(wrongCase)) {
  // On Windows, rename via temp file
  fs.renameSync(wrongCase, webDir + '/index_temp.html');
  fs.renameSync(webDir + '/index_temp.html', rightCase);
  console.log('Renamed index.HTML -> index.html');
}

console.log('\nAll done! Fonts copied:', fonts.length);
console.log('web/ contents:', fs.readdirSync(webDir));