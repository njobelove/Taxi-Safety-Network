import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './services/AuthContext';

// Import font files directly — this forces Expo to include them in the export
const MaterialIconsFont       = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');
const IoniconsFont            = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
const FontAwesome5SolidFont   = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf');
const FontAwesome5RegularFont = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf');
const FontAwesome5BrandsFont  = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf');
const AntDesignFont           = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf');
const FeatherFont             = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf');

import LoginScreen         from './screens/LoginScreen';
import SignupScreen        from './screens/SignupScreen';
import DriverDashboard     from './screens/DriverDashboard';
import EmergencyScreen     from './screens/EmergencyScreen';
import DisactivationScreen from './screens/DisactivationScreen';
import ConfirmationScreen  from './screens/ConfirmationScreen';
import PoliceDashboard     from './screens/PoliceDashboard';
import AlertDetailsScreen  from './screens/AlertDetailsScreen';
import ProfileSetupScreen  from './screens/ProfileSetupScreen';
import StatisticsScreen    from './screens/StatisticsScreen';
import ChatBoardScreen     from './screens/ChatBoardScreen';
import LiveMapScreen       from './screens/LiveMapScreen';
import HistoryScreen       from './screens/HistoryScreen';
import SettingsScreen      from './screens/SettingsScreen';

function Navigator() {
  const { user, role, loading } = useAuth();
  const [screen,      setScreen]      = useState('login');
  const [location,    setLocation]    = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      MaterialIcons:          MaterialIconsFont,
      Ionicons:               IoniconsFont,
      FontAwesome5_Solid:     FontAwesome5SolidFont,
      FontAwesome5_Regular:   FontAwesome5RegularFont,
      FontAwesome5_Brands:    FontAwesome5BrandsFont,
      AntDesign:              AntDesignFont,
      Feather:                FeatherFont,
    })
    .then(() => {
      console.log('Fonts loaded successfully');
      setFontsLoaded(true);
    })
    .catch(e => {
      console.log('Font error:', e.message);
      setFontsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && role === 'driver')      setScreen('driverDashboard');
    else if (user && role === 'police') setScreen('policeDashboard');
    else                                setScreen('login');
  }, [user, role, loading]);

  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(pos.coords);
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
          (p) => setLocation(p.coords)
        );
      } catch (e) { console.log('Location error:', e.message); }
    })();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#d32f2f' }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🛡</Text>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontWeight: '700', fontSize: 14 }}>
          TAXI SAFETY NETWORK
        </Text>
      </View>
    );
  }

  const p = { nav: setScreen, location };

  switch (screen) {
    case 'login':           return <LoginScreen          {...p} />;
    case 'signup':          return <SignupScreen          {...p} />;
    case 'driverDashboard': return <DriverDashboard       {...p} />;
    case 'emergency':       return <EmergencyScreen       {...p} />;
    case 'disactivation':   return <DisactivationScreen   {...p} />;
    case 'confirmation':    return <ConfirmationScreen    {...p} />;
    case 'policeDashboard': return <PoliceDashboard       {...p} />;
    case 'alertDetails':    return <AlertDetailsScreen    {...p} />;
    case 'profileSetup':    return <ProfileSetupScreen    {...p} />;
    case 'statistics':      return <StatisticsScreen      {...p} />;
    case 'chatBoard':       return <ChatBoardScreen       {...p} />;
    case 'liveMap':         return <LiveMapScreen         {...p} />;
    case 'history':         return <HistoryScreen         {...p} />;
    case 'settings':        return <SettingsScreen        {...p} />;
    default:                return <LoginScreen           {...p} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}