import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

// Main App Component
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermissionGranted(true);
      getCurrentLocation();
    } else {
      Alert.alert('Permission Denied', 'Cannot access location');
    }
  };

  const getCurrentLocation = async () => {
    const position = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  };

  // Login Screen
  const LoginScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      <View style={styles.header}>
        <Text style={styles.title}>🚕 TAXI SAFETY NETWORK</Text>
        <Text style={styles.subtitle}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
        <View style={styles.certBadge}>
          <Text style={styles.certText}>DGSN CERTIFIED</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Driver Authentication</Text>
        <Text style={styles.sectionSub}>Veuillez vous identifier pour continuer</Text>

        <Text style={styles.label}>BADGE NUMBER / N° DE BADGE</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>TX-YDE-001</Text>
        </View>

        <Text style={styles.label}>PASSWORD / MOT DE PASSE</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>••••••••</Text>
        </View>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => setCurrentScreen('driverDashboard')}>
          <Text style={styles.loginBtnText}>INITIALIZE SESSION →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.policeBtn}
          onPress={() => setCurrentScreen('policeDashboard')}>
          <Text style={styles.policeBtnText}>👮 POLICE ACCESS</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>DGSN CERTIFIED • END-TO-END ENCRYPTION</Text>
      </View>
    </View>
  );

  // Driver Dashboard
  const DriverDashboard = () => (
    <View style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>TAXI SAFETY NETWORK</Text>
        <View style={styles.connectedBadge}>
          <Text style={styles.connectedText}>MTN • CM CONNECTED</Text>
        </View>
      </View>

      <View style={styles.driverCard}>
        <Text style={styles.driverId}>TX-YDE-001</Text>
        <Text style={styles.district}>Yaoundé District</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>ACTIVE DUTY • EN SERVICE</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.panicButton}
        onPress={() => Alert.alert('🚨 SOS', 'Emergency alert triggered!', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Alert', onPress: () => setCurrentScreen('emergency') }
        ])}>
        <Text style={styles.panicText}>⚠️ PANIC BUTTON</Text>
        <Text style={styles.panicSub}>HOLD FOR 3 SECONDS TO ALERT</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📍 GPS STATUS</Text>
        <Text style={styles.infoText}>
          {location
            ? `${location.latitude.toFixed(6)}° N, ${location.longitude.toFixed(6)}° E`
            : 'Waiting for GPS...'}
        </Text>
        <Text style={styles.signalText}>SIGNAL QUALITY: OPTIMAL</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>SHARE LOCATION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>EMERGENCY CONTACTS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Police Dashboard
  const PoliceDashboard = () => (
    <View style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>YAOUNDÉ DISTRICT COMMAND</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE SIGNAL: ACTIVE</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>14</Text>
          <Text style={styles.statLabel}>ACTIVE ALERTS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>08</Text>
          <Text style={styles.statLabel}>RESPONDERS</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.alertCard} onPress={() => setCurrentScreen('alertDetails')}>
        <Text style={styles.alertTitle}>🚨 CRITICAL ALERT</Text>
        <Text style={styles.alertTime}>02:14 PM • PENDING</Text>
        <Text style={styles.alertDesc}>Bastos / Mvan Junction</Text>
        <Text style={styles.alertDriver}>Driver: Jean-Paul Nguemo (TX-9928)</Text>
      </TouchableOpacity>
    </View>
  );

  // Emergency Screen
  const EmergencyScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      <View style={styles.header}>
        <Text style={styles.title}>EMERGENCY ALERT</Text>
        <Text style={styles.subtitle}>ALERTE D'URGENCE</Text>
      </View>

      <TouchableOpacity style={styles.optionCard} onPress={() => setCurrentScreen('alertDetails')}>
        <Text style={styles.optionTitle}>🔴 THEFT / AGRESSION</Text>
        <Text style={styles.optionDesc}>Vol, braquage, ou menace physique.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionCard} onPress={() => setCurrentScreen('alertDetails')}>
        <Text style={styles.optionTitle}>🚗 ACCIDENT</Text>
        <Text style={styles.optionDesc}>Collision ou dommage véhicule.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionCard} onPress={() => setCurrentScreen('alertDetails')}>
        <Text style={styles.optionTitle}>🏥 MEDICAL HELP</Text>
        <Text style={styles.optionDesc}>Blessure ou urgence de santé.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('driverDashboard')}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
    </View>
  );

  // Alert Details Screen
  const AlertDetailsScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.header}>
        <Text style={styles.title}>ALERT DETAIL</Text>
        <Text style={styles.subtitle}>DÉTAILS DE L'ALERTE</Text>
      </View>

      <View style={styles.criticalCard}>
        <Text style={styles.criticalTitle}>🚨 CRITICAL ALERT - IN PROGRESS</Text>
        <Text style={styles.elapsedValue}>00:08:42</Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 BASTOS / MVAN JUNCTION</Text>
        <Text style={styles.coords}>3.8485° N, 11.5621° E</Text>
      </View>

      <View style={styles.incidentCard}>
        <Text style={styles.incidentValue}>SOS TRIGGER / THEFT</Text>
        <Text style={styles.driverName}>Driver: Jean-Paul Nguemo (TX-9928)</Text>
      </View>

      <View style={styles.responseCard}>
        <Text style={styles.unitText}>🚔 Patrol Unit P-09 En Route</Text>
        <Text style={styles.eta}>ETA: 3 MINS</Text>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('policeDashboard')}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
    </View>
  );

  // Render logic
  switch (currentScreen) {
    case 'login':
      return <LoginScreen />;
    case 'driverDashboard':
      return <DriverDashboard />;
    case 'policeDashboard':
      return <PoliceDashboard />;
    case 'emergency':
      return <EmergencyScreen />;
    case 'alertDetails':
      return <AlertDetailsScreen />;
    default:
      return <LoginScreen />;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { backgroundColor: '#0b2b3b', padding: 30, paddingTop: 50, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#ffd700', fontSize: 14, marginTop: 5 },
  certBadge: { marginTop: 10, backgroundColor: '#1e4a6b', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  certText: { color: '#4caf50', fontSize: 11, fontWeight: 'bold' },
  formContainer: { padding: 20, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0b2b3b', textAlign: 'center', marginTop: 20 },
  sectionSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 15 },
  inputContainer: { backgroundColor: 'white', borderRadius: 10, padding: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  inputText: { fontSize: 16, color: '#333' },
  loginBtn: { backgroundColor: '#0b2b3b', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  policeBtn: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  policeBtnText: { color: '#ffd700', fontSize: 14, fontWeight: 'bold' },
  footerText: { textAlign: 'center', fontSize: 10, color: '#999', marginTop: 30 },
  dashboardContainer: { flex: 1, backgroundColor: '#f5f7fa' },
  dashboardHeader: { backgroundColor: '#0b2b3b', padding: 20, paddingTop: 40, alignItems: 'center' },
  dashboardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  connectedBadge: { marginTop: 8, backgroundColor: '#1e4a6b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  connectedText: { color: '#4caf50', fontSize: 11, fontWeight: 'bold' },
  liveBadge: { marginTop: 8, backgroundColor: '#d32f2f', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  liveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  driverCard: { backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 16, alignItems: 'center', elevation: 3 },
  driverId: { fontSize: 20, fontWeight: 'bold', color: '#0b2b3b' },
  district: { fontSize: 14, color: '#666', marginTop: 4 },
  activeBadge: { marginTop: 10, backgroundColor: '#4caf50', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  activeText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  panicButton: { backgroundColor: '#d32f2f', margin: 16, padding: 30, borderRadius: 20, alignItems: 'center', elevation: 8 },
  panicText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  panicSub: { color: 'white', fontSize: 11, marginTop: 8 },
  infoCard: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
  infoTitle: { fontWeight: 'bold', color: '#0b2b3b', marginBottom: 10 },
  infoText: { fontSize: 12, fontFamily: 'monospace', color: '#333' },
  signalText: { marginTop: 10, color: '#4caf50', fontWeight: 'bold', fontSize: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16 },
  actionBtn: { backgroundColor: '#0b2b3b', padding: 12, borderRadius: 12, flex: 0.48, alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 16 },
  statCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', flex: 0.45, elevation: 2 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#0b2b3b' },
  statLabel: { fontSize: 12, color: '#666' },
  alertCard: { backgroundColor: 'white', marginHorizontal: 16, marginVertical: 8, padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#d32f2f' },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
  alertTime: { fontSize: 11, color: '#666', marginTop: 3 },
  alertDesc: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  alertDriver: { fontSize: 12, color: '#666', marginTop: 3 },
  optionCard: { backgroundColor: 'white', marginHorizontal: 16, marginVertical: 8, padding: 18, borderRadius: 12, elevation: 2 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0b2b3b' },
  optionDesc: { fontSize: 13, color: '#666', marginTop: 5 },
  backBtn: { backgroundColor: '#0b2b3b', margin: 16, padding: 12, borderRadius: 10, alignItems: 'center' },
  backText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  criticalCard: { backgroundColor: '#d32f2f', margin: 16, padding: 20, borderRadius: 12, alignItems: 'center' },
  criticalTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  elapsedValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  locationCard: { backgroundColor: 'white', margin: 16, marginTop: 0, padding: 15, borderRadius: 12 },
  locationTitle: { fontSize: 16, fontWeight: 'bold', color: '#0b2b3b' },
  coords: { fontSize: 14, fontFamily: 'monospace', marginTop: 5 },
  incidentCard: { backgroundColor: 'white', margin: 16, marginTop: 0, padding: 15, borderRadius: 12 },
  incidentValue: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#0b2b3b', marginTop: 8 },
  responseCard: { backgroundColor: '#e8f5e9', margin: 16, marginTop: 0, padding: 15, borderRadius: 12 },
  unitText: { fontSize: 16, fontWeight: 'bold' },
  eta: { fontSize: 14, fontWeight: 'bold', color: '#ff9800', marginTop: 5 },
});

export default App;
