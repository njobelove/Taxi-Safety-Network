const fs   = require('fs');
const path = 'C:/Users/user/Desktop/Final Year/Taxi-Safety-Network/mobile/screens/ProfileSetupScreen.js';
let code   = fs.readFileSync(path, 'utf8');

// Find the quick actions array and add History and Settings
const oldActions = `          {[
            { ico: '⊞',  lbl: 'Dashboard',          to: isDriver ? 'driverDashboard' : 'policeDashboard' },
            { ico: '🗺',  lbl: 'Live Driver Map',     to: 'liveMap'      },
            { ico: '💬', lbl: 'Community Chat',      to: 'chatBoard'    },
            { ico: '📊', lbl: 'Statistics',          to: 'statistics'   },
            ...(isDriver ? [
              { ico: '🚨', lbl: 'Report Emergency',    to: 'emergency'    },
              { ico: '🔕', lbl: 'Deactivate My Alert', to: 'disactivation'},
            ] : []),
          ].map(({ ico, lbl, to }) => (`;

const newActions = `          {[
            { ico: '⊞',  lbl: 'Dashboard',           to: isDriver ? 'driverDashboard' : 'policeDashboard' },
            { ico: '🗺',  lbl: 'Live Driver Map',      to: 'liveMap'      },
            { ico: '💬', lbl: 'Community Chat',       to: 'chatBoard'    },
            { ico: '📊', lbl: 'Statistics',           to: 'statistics'   },
            { ico: '📋', lbl: 'Alert History',        to: 'history'      },
            { ico: '⚙',  lbl: 'Settings',             to: 'settings'     },
            ...(isDriver ? [
              { ico: '🚨', lbl: 'Report Emergency',    to: 'emergency'    },
              { ico: '🔕', lbl: 'Deactivate My Alert', to: 'disactivation'},
            ] : []),
          ].map(({ ico, lbl, to }) => (`;

if (code.includes(oldActions)) {
  code = code.replace(oldActions, newActions);
  console.log('✅ Quick actions fixed!');
} else {
  // Try simpler approach - find the actions array differently
  console.log('Pattern not found - trying alternative...');
  
  // Find and replace just the statistics line to add after it
  code = code.replace(
    "{ ico: '📊', lbl: 'Statistics',          to: 'statistics'   },",
    "{ ico: '📊', lbl: 'Statistics',          to: 'statistics'   },\n            { ico: '📋', lbl: 'Alert History',        to: 'history'      },\n            { ico: '⚙',  lbl: 'Settings',             to: 'settings'     },"
  );
  
  // Also try without extra spaces
  code = code.replace(
    "{ ico: '📊', lbl: 'Statistics',         to: 'statistics'  },",
    "{ ico: '📊', lbl: 'Statistics',         to: 'statistics'  },\n            { ico: '📋', lbl: 'Alert History',       to: 'history'     },\n            { ico: '⚙',  lbl: 'Settings',            to: 'settings'    },"
  );
  
  console.log('✅ Alternative fix applied');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Has history action:', code.includes("'history'"));
console.log('Has settings action:', code.includes("'settings'"));