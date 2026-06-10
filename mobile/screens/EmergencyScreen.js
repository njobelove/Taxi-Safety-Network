import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function EmergencyScreen({ navigation }) {
  const handleAlert = (type) => {
    Alert.alert(
      '🚨 ALERT SENT',
      `${type} alert has been sent to Central Command`,
      [{ text: 'OK', onPress: () => navigation.navigate('AlertDetails') }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.headerSub}>YAOUNDÉ COMMAND</Text>
        <Text style={styles.network}>MTN 4G</Text>
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
        <Text style={styles.emergencyFr}>ALERTE D'URGENCE</Text>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>⚠️ OFFLINE FALLBACK ACTIVE</Text>
          <Text style={styles.offlineSub}>PROTOCOL: SMS/USSD PRIORITY</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleAlert('THEFT / AGRESSION')}
      >
        <Text style={styles.optionTitle}>🔴 THEFT / AGRESSION</Text>
        <Text style={styles.optionDesc}>Vol, braquage, ou menace physique.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleAlert('ACCIDENT')}
      >
        <Text style={styles.optionTitle}>🚗 REPORT INCIDENT / ACCIDENT</Text>
        <Text style={styles.optionDesc}>Collision ou dommage véhicule.</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleAlert('MEDICAL')}
      >
        <Text style={styles.optionTitle}>🏥 MEDICAL HELP / MÉDICALE</Text>
        <Text style={styles.optionDesc}>Blessure ou urgence de santé.</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your location and driver ID will be shared with Central Command immediately.
        {'\n'}Votre localisation sera partagée instantanément.
      </Text>

      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={() => handleAlert('SOS')}
      >
        <Text style={styles.confirmText}>CONFIRM ALERT</Text>
        <Text style={styles.confirmFr}>CONFIRMER L'ALERTE</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#ffd700',
    fontSize: 14,
    marginTop: 3,
  },
  network: {
    color: '#4caf50',
    fontSize: 12,
    marginTop: 5,
  },
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
    fontSize: 18,
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
  confirmBtn: {
    backgroundColor: '#0b2b3b',
    margin: 16,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmFr: {
    color: '#ffd700',
    fontSize: 12,
    marginTop: 3,
  },
});