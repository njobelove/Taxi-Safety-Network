import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function ConfirmationScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.headerSub}>SENTINEL CAMEROON</Text>
      </View>

      <View style={styles.locationBadge}>
        <Text style={styles.locationText}>📍 BASTOS DISTRICT</Text>
        <Text style={styles.networkRow}>
          <Text style={styles.mtn}>MTN ACTIVE</Text>
          <Text style={styles.orange}> • ORANGE STANDBY</Text>
        </Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>🚨 ACTIVE SOS ALERT</Text>
        <Text style={styles.alertFr}>Alerte SOS Active</Text>
        <Text style={styles.address}>🔴 Rue de Bastos, Near Embassy Yaoundé, Cameroon</Text>
      </View>

      <TouchableOpacity style={styles.confirmBtn}>
        <Text style={styles.confirmText}>CONFIRM RESPONSE</Text>
      </TouchableOpacity>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>CREDIBILITY SCORE</Text>
        <Text style={styles.scoreLabelFr}>Score de Crédibilité</Text>
        <Text style={styles.scoreValue}>98</Text>
        <View style={styles.eliteBadge}>
          <Text style={styles.eliteText}>🏆 ELITE RESPONDER STATUS</Text>
        </View>
      </View>

      <View style={styles.activeAlerts}>
        <Text style={styles.activeTitle}>ACTIVE ALERTS</Text>
        <Text style={styles.activeFr}>Alertes Actives dans le Rayon</Text>
        <View style={styles.alertItem}>
          <Text style={styles.alertName}>🔴 PASSENGER DISTRESS</Text>
          <Text style={styles.alertDist}>Bastos • 0.8km away</Text>
        </View>
        <View style={styles.alertItem}>
          <Text style={styles.alertName}>🚗 ACCIDENT REPORT</Text>
          <Text style={styles.alertDist}>Mvan • 4.2km away</Text>
        </View>
        <View style={styles.alertItem}>
          <Text style={styles.alertName}>🚦 TRAFFIC DISRUPTION</Text>
          <Text style={styles.alertDist}>Omnisport • 2.5km away</Text>
        </View>
      </View>

      <View style={styles.commandBar}>
        <Text style={styles.commandText}>🎮 CENTRAL COMMAND</Text>
        <Text style={styles.commandSub}>ACTIVE DISPATCHER</Text>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>DASHBOARD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>ALERTS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>CONTACTS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>PROFILE</Text>
        </TouchableOpacity>
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
    fontSize: 12,
  },
  locationBadge: {
    backgroundColor: '#1e4a6b',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationText: {
    color: 'white',
    fontWeight: 'bold',
  },
  networkRow: {
    marginTop: 5,
  },
  mtn: {
    color: '#4caf50',
    fontSize: 11,
  },
  orange: {
    color: '#ff9800',
    fontSize: 11,
  },
  alertCard: {
    backgroundColor: '#fff3e0',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  alertFr: {
    fontSize: 12,
    color: '#d32f2f',
  },
  address: {
    marginTop: 10,
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: '#0b2b3b',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreLabelFr: {
    fontSize: 11,
    color: '#999',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  eliteBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 5,
  },
  eliteText: {
    fontWeight: 'bold',
    color: '#0b2b3b',
    fontSize: 11,
  },
  activeAlerts: {
    backgroundColor: 'white',
    margin: 16,
    padding: 15,
    borderRadius: 12,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  activeFr: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
  },
  alertItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  alertDist: {
    fontSize: 11,
    color: '#666',
  },
  commandBar: {
    backgroundColor: '#0b2b3b',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  commandText: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  commandSub: {
    color: 'white',
    fontSize: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0b2b3b',
    padding: 12,
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});