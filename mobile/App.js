import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './services/AuthContext';

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

  // ── Load icon fonts before rendering anything ──────────────────────────────
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
          'Ionicons':      require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
          'FontAwesome5_Solid':   require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Pro_Solid.ttf'),
          'FontAwesome5_Regular': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Pro_Regular.ttf'),
          'FontAwesome5_Brands':  require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Pro_Brands.ttf'),
        });
      } catch (e) {
        // Try simpler approach
        try {
          await Font.loadAsync({
            'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
            'Ionicons':      require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
          });
        } catch (e2) {
          console.log('Font load error:', e2.message);
        }
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // ── Navigate when auth changes ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (user && role === 'driver') {
      setScreen('driverDashboard');
    } else if (user && role === 'police') {
      setScreen('policeDashboard');
    } else {
      setScreen('login');
    }
  }, [user, role, loading]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(pos.coords);
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
          (p) => setLocation(p.coords)
        );
      } catch (e) {
        console.log('Location error:', e.message);
      }
    })();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#d32f2f' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡</Text>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, fontWeight: '700', fontSize: 16 }}>
          TSN Loading...
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