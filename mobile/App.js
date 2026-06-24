import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
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

function Navigator() {
  const { user, role, loading } = useAuth();
  const [screen,   setScreen]   = useState('login');
  const [location, setLocation] = useState(null);

  // ── Navigate when auth state changes ─────────────────────────────────────
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

  // ── GPS tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
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

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#f5f5f5' }}>
        <ActivityIndicator size="large" color="#d32f2f" />
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
