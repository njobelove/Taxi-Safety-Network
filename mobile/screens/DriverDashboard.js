import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import * as Location from 'expo-location';

export default function DriverDashboard({ navigation }) {
  const [location, setLocation] = useState(null);
  const [signalQuality] = useState('OPTIMAL');

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);
    }
  };

  const handlePanic = () => {
    Vibration.vibrate(500);
    Alert.alert(
      '🚨 EMERGENCY SOS',
      'Hold for 3 seconds to trigger SOS alert',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: () => navigation.navigate('Emergency'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.headerSub}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
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
        onLongPress={handlePanic}
        delayLongPress={3000}
      >
        <Text style={styles.panicText}>⚠️ PANIC BUTTON</Text>
        <Text style={styles.panicSub}>HOLD FOR 3 SECONDS TO ALERT</Text>
        <Text style={styles.panicSubFr}>MAINTENEZ 3S POUR ALERTER</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📍 GPS STATUS</Text>
        <Text style={styles.infoText}>
          {location
            ? `${location.latitude.toFixed(6)}° N, ${location.longitude.toFixed(6)}° E`
            : 'Waiting for GPS...'}
        </Text>
        <Text style={styles.signalText}>SIGNAL QUALITY: {signalQuality}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>SHARE LOCATION</Text>
          <Text style={styles.actionBtnFr}>PARTAGER POSITION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>EMERGENCY CONTACTS</Text>
          <Text style={styles.actionBtnFr}>CONTACTS D'URGENCE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trafficCard}>
        <Text style={styles.trafficLabel}>TRAFFIC ALERT</Text>
        <Text style={styles.trafficValue}>NSAM: HEAVY</Text>
        <Text style={styles.syncText}>
          LAST SYNC / DERNIÈRE SYNC: Mvog-Mbi - {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0b2b3b',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSub: {
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
  panicSubFr: {
    color: 'white',
    fontSize: 11,
  },
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
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtnFr: {
    color: '#ffd700',
    fontSize: 10,
    marginTop: 3,
  },
  trafficCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
});