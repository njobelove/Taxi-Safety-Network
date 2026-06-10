import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';

export default function DisactivationScreen({ navigation }) {
  const [elapsed] = useState('00:04:12');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SENTINEL</Text>
        <Text style={styles.network}>MTN 4G</Text>
      </View>

      <View style={styles.sosCard}>
        <Text style={styles.sosTitle}>🔴 LIVE SOS / SOS END</Text>
        <Text style={styles.elapsed}>{elapsed}</Text>
        <Text style={styles.camId}>CAM ID: 49-X21</Text>
        <Text style={styles.elapsedLabel}>ELAPSED / TEMPS ÉCOULÉ</Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.location}>Akwa, Rue Joffre</Text>
        <View style={styles.audioBadge}>
          <Text style={styles.audioText}>🎙️ AUDIO UPLINK ACTIVE</Text>
        </View>
        <Text style={styles.coords}>4.051° N, 9.7679° E</Text>
      </View>

      <View style={styles.respondersCard}>
        <Text style={styles.responderTitle}>NEARBY RESPONDERS</Text>
        <Text style={styles.responderFr}>INTERVENING</Text>
        <View style={styles.responderItem}>
          <Text style={styles.responderName}>🚔 RESPONDER #14</Text>
          <Text style={styles.responderType}>RAPID INTERVENTION FORCE</Text>
          <Text style={styles.responderDist}>200m • EST. 1M</Text>
        </View>
        <View style={styles.responderItem}>
          <Text style={styles.responderName}>🚑 MEDIC TEAM B</Text>
          <Text style={styles.responderType}>PUBLIC EMS</Text>
          <Text style={styles.responderDist}>850m • EST. 4M</Text>
        </View>
      </View>

      <View style={styles.contactsCard}>
        <Text style={styles.contactsTitle}>📞 CONTACTS NOTIFIED</Text>
        <Text style={styles.contactsText}>
          Your emergency contacts have received your live location and audio feed.
        </Text>
      </View>

      <Text style={styles.safeLabel}>ARE YOU SAFE?</Text>
      <Text style={styles.safeFr}>ÊTES-VOUS EN SÉCURITÉ?</Text>

      <TouchableOpacity
        style={styles.stopBtn}
        onLongPress={() => {
          Vibration.vibrate(500);
          navigation.navigate('DriverDashboard');
        }}
        delayLongPress={3000}
      >
        <Text style={styles.stopText}>✓ SAFE - STOP SOS</Text>
        <Text style={styles.stopSub}>
          Press and hold for 3 seconds to cancel emergency alert.
        </Text>
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  network: {
    color: '#4caf50',
    fontSize: 12,
    marginTop: 3,
  },
  sosCard: {
    backgroundColor: '#d32f2f',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  sosTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  elapsed: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  camId: {
    color: 'white',
    fontSize: 12,
  },
  elapsedLabel: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
  },
  locationCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  audioBadge: {
    backgroundColor: '#ff9800',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  audioText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  coords: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  respondersCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  responderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  responderFr: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
  },
  responderItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  responderName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  responderType: {
    fontSize: 11,
    color: '#666',
  },
  responderDist: {
    fontSize: 11,
    color: '#4caf50',
    marginTop: 3,
  },
  contactsCard: {
    backgroundColor: '#e8f5e9',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  contactsTitle: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  contactsText: {
    fontSize: 11,
    color: '#333',
    marginTop: 5,
  },
  safeLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2b3b',
    marginTop: 10,
  },
  safeFr: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  stopBtn: {
    backgroundColor: '#4caf50',
    margin: 16,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  stopText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopSub: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
  },
});