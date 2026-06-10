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
  ScrollView,
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

  // ========== LOGIN SCREEN ==========
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

        <Text style={styles.label}>BADGE NUMBER</Text>
        <Text style={styles.labelFr}>N° DE BADGE</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>TX-YDE-001</Text>
        </View>

        <Text style={styles.label}>ACTIVE NETWORK</Text>
        <Text style={styles.labelFr}>RÉSEAU ACTIF</Text>
        <View style={styles.networkRow}>
          <TouchableOpacity style={styles.networkBtn}><Text style={styles.networkBtnText}>MTN</Text></TouchableOpacity>
          <TouchableOpacity style={styles.networkBtn}><Text style={styles.networkBtnText}>ORANGE</Text></TouchableOpacity>
          <TouchableOpacity style={styles.networkBtn}><Text style={styles.networkBtnText}>CAMTEL</Text></TouchableOpacity>
        </View>

        <Text style={styles.label}>PASSWORD</Text>
        <Text style={styles.labelFr}>MOT DE PASSE</Text>
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
        <Text style={styles.versionText}>SYSTEM VERSION 4.2.0-ALPHA</Text>
      </View>
    </View>
  );

  // ========== DRIVER DASHBOARD ==========
  const DriverDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.dashboardSub}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
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
        <Text style={styles.panicFr}>MAINTENEZ 3S POUR ALERTER</Text>
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
          <Text style={styles.actionFr}>PARTAGER POSITION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>EMERGENCY CONTACTS</Text>
          <Text style={styles.actionFr}>CONTACTS D'URGENCE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trafficCard}>
        <Text style={styles.trafficLabel}>TRAFFIC ALERT</Text>
        <Text style={styles.trafficValue}>NSAM: HEAVY</Text>
        <Text style={styles.syncText}>LAST SYNC: Mvog-Mbi - {new Date().toLocaleTimeString()}</Text>
      </View>
    </ScrollView>
  );

  // ========== POLICE DASHBOARD ==========
  const PoliceDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>YAOUNDÉ DISTRICT COMMAND</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE SIGNAL: ACTIVE</Text>
        </View>
        <Text style={styles.sector}>CURRENT SECTOR: Bastos / Mvan Junction</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>14</Text>
          <Text style={styles.statLabel}>ACTIVE ALERTS</Text>
          <Text style={styles.statNew}>+2 New</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>08</Text>
          <Text style={styles.statLabel}>RESPONDERS</Text>
          <Text style={styles.statNew}>In Field</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ACTIVE INCIDENT LOGS</Text>
      <Text style={styles.sectionFr}>CHRONOLOGICAL ORDER / ORDRE CHRONOLOGIQUE</Text>

      <TouchableOpacity style={styles.alertCard} onPress={() => setCurrentScreen('alertDetails')}>
        <Text style={styles.alertTitle}>🚨 CRITICAL ALERT</Text>
        <Text style={styles.alertTime}>02:14 PM • PENDING</Text>
        <Text style={styles.alertDesc}>SOS Trigger: Route de Mvolyé</Text>
        <Text style={styles.alertDriver}>Driver: Jean-Paul Nguemo (TX-9928)</Text>
        <Text style={styles.alertNetwork}>MTN Network</Text>
        <View style={styles.unitBadge}>
          <Text style={styles.unitText}>Patrol Unit P-09 EN ROUTE</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.alertCard}>
        <Text style={[styles.alertTitle, { borderLeftColor: '#ff9800' }]}>🚑 MEDICAL NEED</Text>
        <Text style={styles.alertTime}>01:58 PM • RESPONDING</Text>
        <Text style={styles.alertDesc}>Station Mobile - Douala Road</Text>
        <Text style={styles.alertDriver}>ID: DL-4412 • Orange Network</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={[styles.alertTitle, { borderLeftColor: '#4caf50' }]}>🔧 ENGINE FAILURE</Text>
        <Text style={styles.alertTime}>01:30 PM • RESOLVED</Text>
        <Text style={styles.alertDesc}>Mokolo Market Perimeter</Text>
        <Text style={styles.alertDriver}>DRIVER: SAMUEL ETO'O FIL</Text>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('login')}>
        <Text style={styles.backText}>← BACK TO LOGIN</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ========== EMERGENCY SCREEN ==========
  const EmergencyScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      <View style={styles.header}>
        <Text style={styles.title}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.subtitle}>YAOUNDÉ COMMAND</Text>
        <Text style={styles.networkText}>MTN 4G</Text>
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
        <Text style={styles.emergencyFr}>ALERTE D'URGENCE</Text>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>⚠️ OFFLINE FALLBACK ACTIVE</Text>
          <Text style={styles.offlineSub}>PROTOCOL: SMS/USSD PRIORITY</Text>
        </View>
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

      <Text style={styles.disclaimer}>
        Your location and driver ID will be shared with Central Command immediately.
        {'\n'}Votre localisation sera partagée instantanément.
      </Text>

      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('driverDashboard')}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
    </View>
  );

  // ========== ALERT DETAILS SCREEN ==========
  const AlertDetailsScreen = () => (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b2b3b" />
      
      <View style={styles.header}>
        <Text style={styles.title}>ALERT DETAIL</Text>
        <Text style={styles.subtitle}>DÉTAILS DE L'ALERTE</Text>
      </View>

      <View style={styles.criticalCard}>
        <Text style={styles.criticalTitle}>🚨 CRITICAL ALERT - IN PROGRESS</Text>
        <Text style={styles.criticalFr}>ALERTE CRITIQUE - EN COURS D'EXÉCUTION</Text>
        <Text style={styles.elapsedLabel}>ELAPSED TIME / TEMPS ÉCOULÉ</Text>
        <Text style={styles.elapsedValue}>00:08:42</Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 BASTOS / MVAN JUNCTION</Text>
        <Text style={styles.gpsLabel}>GPS SIGNAL: OPTIMAL / SIGNAL</Text>
        <Text style={styles.coords}>3.8485° N, 11.5621° E</Text>
      </View>

      <View style={styles.incidentCard}>
        <Text style={styles.incidentLabel}>INCIDENT TYPE / TYPE D'INCIDENT</Text>
        <Text style={styles.incidentValue}>SOS TRIGGER / THEFT</Text>
        <Text style={styles.incidentLabel}>Trigger Time / Heure</Text>
        <Text style={styles.incidentValue}>02:14 PM</Text>
        <Text style={styles.incidentLabel}>Network / Réseau</Text>
        <Text style={styles.incidentValue}>MTN</Text>
      </View>

      <View style={styles.driverInfoCard}>
        <Text style={styles.driverLabel}>DRIVER / CHAUFFEUR</Text>
        <Text style={styles.driverName}>Jean-Paul Nguemo</Text>
        <Text style={styles.driverId}>ID: TX-9928</Text>
        <Text style={styles.vehicle}>VEHICLE / VÉHICULE</Text>
        <Text style={styles.vehicleValue}>Yellow Toyota Corolla • CE 482-XY</Text>
      </View>

      <View style={styles.responseCard}>
        <Text style={styles.responseTitle}>RESPONSE STATUS / ÉTAT DE LA RÉPONSE</Text>
        <Text style={styles.unitText}>🚔 Patrol Unit P-09 En Route</Text>
        <Text style={styles.unitFr}>Unité de Patrouille P-09 en chemin</Text>
        <Text style={styles.eta}>ETA / HEURE D'ARRIVÉE: 3 MINS</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionSmallBtn}>
          <Text style={styles.actionSmallText}>🎙️ VOICE COMM</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSmallBtn}>
          <Text style={styles.actionSmallText}>➕ DEPLOY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionSmallBtn, styles.resolveBtn]}>
          <Text style={styles.resolveBtnText}>✓ RESOLVED</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('policeDashboard')}>
        <Text style={styles.backText}>← BACK TO DASHBOARD</Text>
      </TouchableOpacity>
    </ScrollView>
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

// ========== STYLES ==========
const styles = StyleSheet.create({
  // Common
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0b2b3b',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ffd700',
    fontSize: 14,
    marginTop: 5,
  },
  certBadge: {
    marginTop: 10,
    backgroundColor: '#1e4a6b',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  certText: {
    color: '#4caf50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2b3b',
    textAlign: 'center',
    marginTop: 20,
  },
  sectionSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  labelFr: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  networkBtn: {
    backgroundColor: '#1e4a6b',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  networkBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loginBtn: {
    backgroundColor: '#0b2b3b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  policeBtn: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  policeBtnText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
    marginTop: 30,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    marginTop: 5,
  },
  
  // Dashboard Header
  dashboardHeader: {
    backgroundColor: '#0b2b3b',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  dashboardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dashboardSub: {
    color: '#ffd700',
    fontSize: 11,
    marginTop: 3,
  },
  connectedBadge: {
    marginTop: 8,
    backgroundColor: '#1e4a6b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  connectedText: {
    color: '#4caf50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  liveBadge: {
    marginTop: 8,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sector: {
    color: '#4caf50',
    fontSize: 12,
    marginTop: 8,
  },
  
  // Driver Card
  driverCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  driverId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  district: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activeBadge: {
    marginTop: 10,
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  
  // Panic Button
  panicButton: {
    backgroundColor: '#d32f2f',
    margin: 16,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  panicText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  panicSub: {
    color: 'white',
    fontSize: 11,
    marginTop: 8,
  },
  panicFr: {
    color: 'white',
    fontSize: 11,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#0b2b3b',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  signalText: {
    marginTop: 10,
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  
  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  actionBtn: {
    backgroundColor: '#0b2b3b',
    padding: 12,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionFr: {
    color: '#ffd700',
    fontSize: 10,
    marginTop: 3,
  },
  
  // Traffic Card
  trafficCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  trafficLabel: {
    fontSize: 12,
    color: '#666',
  },
  trafficValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 3,
  },
  syncText: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statNew: {
    fontSize: 10,
    color: '#ff9800',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2b3b',
    marginHorizontal: 16,
    marginTop: 10,
  },
  sectionFr: {
    fontSize: 11,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  
  // Alert Card
  alertCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  alertTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  alertDesc: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  alertDriver: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  alertNetwork: {
    fontSize: 11,
    color: '#4caf50',
    marginTop: 3,
  },
  unitBadge: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  
  // Emergency Screen
  emergencyCard: {
    backgroundColor: '#fff3e0',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
  },
  emergencyFr: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  offlineBadge: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  offlineSub: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#666',
    margin: 16,
    marginTop: 20,
  },
  networkText: {
    color: '#4caf50',
    fontSize: 12,
    marginTop: 5,
  },
  
  // Alert Details
  criticalCard: {
    backgroundColor: '#d32f2f',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  criticalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  criticalFr: {
    color: 'white',
    fontSize: 12,
    marginTop: 3,
  },
  elapsedLabel: {
    color: 'white',
    fontSize: 11,
    marginTop: 10,
  },
  elapsedValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  gpsLabel: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 5,
  },
  coords: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 3,
  },
  incidentCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  incidentLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  incidentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  driverInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  driverLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  driverId: {
    fontSize: 14,
    color: '#666',
  },
  vehicle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 8,
  },
  vehicleValue: {
    fontSize: 14,
    marginTop: 3,
  },
  responseCard: {
    backgroundColor: '#e8f5e9',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  unitFr: {
    fontSize: 12,
    color: '#666',
  },
  eta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
    marginTop: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  actionSmallBtn: {
    backgroundColor: '#0b2b3b',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  actionSmallText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resolveBtn: {
    backgroundColor: '#4caf50',
  },
  resolveBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: '#0b2b3b',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;