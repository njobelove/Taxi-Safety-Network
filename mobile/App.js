/**
 * Taxi Safety Network — App.js
 * Navigation hub only. All screen logic lives in /screens/
 */

import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

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

export default function App() {
  const [screen, setScreen]     = useState('login');
  const [location, setLocation] = useState(null);

  // ── Real-time GPS ─────────────────────────────────────────────────────────
  useEffect(() => {
    let subscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Location access is needed to send emergency alerts with your GPS position.'
        );
        return;
      }

      // Fast initial fix
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(pos.coords);

      // Continuous updates every 3 seconds or 5 metres moved
      subscription = await Location.watchPositionAsync(
        {
          accuracy:         Location.Accuracy.High,
          timeInterval:     3000,
          distanceInterval: 5,
        },
        (pos) => setLocation(pos.coords)
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // Shared props every screen receives
  const screenProps = { nav: setScreen, location };

  switch (screen) {
    case 'login':           return <LoginScreen         {...screenProps} />;
    case 'signup':          return <SignupScreen         {...screenProps} />;
    case 'driverDashboard': return <DriverDashboard      {...screenProps} />;
    case 'emergency':       return <EmergencyScreen      {...screenProps} />;
    case 'disactivation':   return <DisactivationScreen  {...screenProps} />;
    case 'confirmation':    return <ConfirmationScreen   {...screenProps} />;
    case 'policeDashboard': return <PoliceDashboard      {...screenProps} />;
    case 'alertDetails':    return <AlertDetailsScreen   {...screenProps} />;
    case 'profileSetup':    return <ProfileSetupScreen   {...screenProps} />;
    case 'statistics':      return <StatisticsScreen     {...screenProps} />;
    default:                return <LoginScreen          {...screenProps} />;
  }
}
