# TSN MongoDB Atlas Setup

## 1. Create a MongoDB Atlas Account
Go to https://www.mongodb.com/atlas and create a free account.

## 2. Create a Cluster
- Click "Build a Database"
- Choose FREE tier (M0)
- Select a region close to Cameroon (Europe West works well)
- Name your cluster: `Cluster0`

## 3. Create Database and Collections
In Atlas → Browse Collections → Add My Own Data:
- Database name: `tsn_cameroon`
- Create these collections:
  - `drivers`
  - `police_stations`
  - `alerts`

## 4. Enable Data API
In Atlas → App Services → Create Application:
- Name: `tsn-app`
- Enable Data API
- Copy your **App ID** (looks like: `tsn-app-abcde`)

## 5. Create an API Key
In App Services → Authentication → API Keys:
- Create a key
- Copy it — you only see it once

## 6. Set Network Access
In Atlas → Network Access:
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (for development)
- For production, add your server's IP

## 7. Update services/api.js
Replace these two lines in `services/api.js`:
```js
const ATLAS_APP_ID = 'YOUR_ATLAS_APP_ID';   // paste your App ID
const API_KEY      = 'YOUR_ATLAS_API_KEY';  // paste your API key
```

## 8. Install Required Packages
Run in your mobile folder:
```bash
npx expo install expo-sqlite expo-crypto expo-av
npm install
```
Then:
```bash
npx expo start --clear
```

## 9. Test Flow
1. Open app → Sign Up → choose "Taxi Driver" → fill form → submit
   - Check Atlas → Collections → drivers → your driver appears
2. Log Out → Log In → enter badge ID + password
   - Wrong credentials → error shown
   - Correct credentials → goes to Driver Dashboard
3. Sign Up → choose "Police Station" → fill form → submit
   - Check Atlas → Collections → police_stations → station appears
4. As a driver: trigger SOS → alert appears in Atlas → alerts collection
5. Log in as police station → see ALL alerts from all drivers live

## Data Flow
- Drivers register with badge_id (unique) + password
- Police stations register with station_id (unique) + password  
- All SOS alerts go into the `alerts` collection
- ALL police stations see ALL alerts (no filtering by city)
- Alerts show driver name, badge, GPS coords, vehicle plate, phone
- Police can mark alerts as RESOLVED — disappears from active list
- Voice recordings are saved as file URIs in driver's profile document
