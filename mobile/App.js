/**
 * Taxi Safety Network — App.js
 * Navigation hub + GPS tracking.
 * All screens live in /screens/
 */

import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

import { AuthProvider } from './services/AuthContext';

import LoginScreen          from './screens/LoginScreen';
import SignupScreen         from './screens/SignupScreen';
import DriverDashboard      from './screens/DriverDashboard';
import EmergencyScreen      from './screens/EmergencyScreen';
import DisactivationScreen  from './screens/DisactivationScreen';
import ConfirmationScreen   from './screens/ConfirmationScreen';
import PoliceDashboard      from './screens/PoliceDashboard';
import AlertDetailsScreen   from './screens/AlertDetailsScreen';
import ProfileSetupScreen   from './screens/ProfileSetupScreen';
import StatisticsScreen     from './screens/StatisticsScreen';

function Navigator() {
  const [screen,   setScreen]   = useState('login');
  const [location, setLocation] = useState(null);

  // ── Real-time GPS ────────────────────────────────────────────────────────────
  useEffect(() => {
    let subscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Location access is needed to send accurate emergency alerts.');
        return;
      }
      // Fast first fix
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(pos.coords);
      // Continuous updates every 3 s / 5 m
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (p) => setLocation(p.coords)
      );
    })();
    return () => { if (subscription) subscription.remove(); };
  }, []);

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
