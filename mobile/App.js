import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './services/AuthContext';

// Force Expo to include font files in the web bundle
const _MI  = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');
const _ION = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
const _FA5S = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf');
const _FA5R = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf');
const _FA5B = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf');
const _AD  = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf');
const _FT  = require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf');

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
import SubscriptionScreen  from './screens/SubscriptionScreen';

const BASE_URL = 'https://tsn-backend-53yj.onrender.com';

function Navigator() {
  const { user, role, loading } = useAuth();
  const [screen,      setScreen]      = useState('login');
  const [location,    setLocation]    = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // ── Load icon fonts ────────────────────────────────────────────────────────
  useEffect(() => {
    Font.loadAsync({
      MaterialIcons:        _MI,
      Ionicons:             _ION,
      FontAwesome5_Solid:   _FA5S,
      FontAwesome5_Regular: _FA5R,
      FontAwesome5_Brands:  _FA5B,
      AntDesign:            _AD,
      Feather:              _FT,
    })
    .then(() => setFontsLoaded(true))
    .catch(() => setFontsLoaded(true));
  }, []);

  // ── Register push notification token ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications();
  }, [user]);

  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === 'web') return; // Push not supported on web
      const { default: Notifications } = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync();
      if (token?.data) {
        await fetch(BASE_URL + '/api/push/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            userId: user?.badgeId || user?.stationId,
            token:  token.data,
            role,
          }),
        });
        console.log('✅ Push token registered');
      }
    } catch (e) { console.log('Push setup error:', e.message); }
  };

  // ── Navigate on auth change ────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (user && role === 'driver')      setScreen('driverDashboard');
    else if (user && role === 'police') setScreen('policeDashboard');
    else                                setScreen('login');
  }, [user, role, loading]);

  // ── GPS ───────────────────────────────────────────────────────────────────
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
    case 'subscription':    return <SubscriptionScreen    {...p} />;
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