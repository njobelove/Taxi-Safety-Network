const fs   = require('fs');
const path = require('path');

const screensDir = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/screens';
const servicesDir = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile';

// Files to update
const files = [
  ...fs.readdirSync(screensDir).map(f => path.join(screensDir, f)),
  path.join(servicesDir, 'App.js'),
].filter(f => f.endsWith('.js'));

let totalFixed = 0;

files.forEach(filePath => {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Only touch files that import from @expo/vector-icons
  if (!code.includes('@expo/vector-icons')) return;

  const before = code;

  // Replace any import from @expo/vector-icons with our local Icon component
  code = code.replace(
    /import\s*\{[^}]+\}\s*from\s*['"]@expo\/vector-icons[^'"]*['"]\s*;?\n?/g,
    "import { MaterialIcons, Ionicons, FontAwesome5 } from '../services/Icon';\n"
  );

  // Fix App.js import path (one level up from screens)
  if (filePath.endsWith('App.js')) {
    code = code.replace(
      "from '../services/Icon'",
      "from './services/Icon'"
    );
  }

  // Also remove expo-font import from App.js since we no longer need it
  if (filePath.endsWith('App.js')) {
    code = code.replace(/import \* as Font from 'expo-font';\n?/g, '');
    code = code.replace(/import \{ MaterialIcons, Ionicons, FontAwesome5 \} from '\.\/services\/Icon';\n?/g, '');
    // Add it back once, cleanly
    code = code.replace(
      "import { AuthProvider, useAuth } from './services/AuthContext';",
      "import { AuthProvider, useAuth } from './services/AuthContext';"
    );
  }

  if (code !== before) {
    fs.writeFileSync(filePath, code, 'utf8');
    const name = path.basename(filePath);
    console.log('✅ Fixed:', name);
    totalFixed++;
  }
});

// Copy Icon.js to services folder
const iconSrc  = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/Icon.js';
const iconDest = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/services/Icon.js';

if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
  console.log('✅ Copied Icon.js to services/');
} else {
  console.log('⚠ Icon.js not found at:', iconSrc, '— please copy it manually to services/Icon.js');
}

console.log('\nTotal files fixed:', totalFixed);
console.log('Done! Now rebuild: npx expo export --platform web');