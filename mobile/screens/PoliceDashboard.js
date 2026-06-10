import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function PoliceDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TAXI SAFETY NETWORK</Text>
        <Text style={styles.headerSub}>YAOUNDÉ DISTRICT COMMAND</Text>
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
      <Text style={styles.sectionFr}>
        CHRONOLOGICAL ORDER / ORDRE CHRONOLOGIQUE
      </Text>

      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => navigation.navigate('AlertDetails')}
      >
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
        <Text style={[styles.alertTitle, { borderLeftColor: '#ff9800' }]}>
          🚑 MEDICAL NEED
        </Text>
        <Text style={styles.alertTime}>01:58 PM • RESPONDING</Text>
        <Text style={styles.alertDesc}>Station Mobile - Douala Road</Text>
        <Text style={styles.alertDriver}>ID: DL-4412 • Orange Network</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={[styles.alertTitle, { borderLeftColor: '#4caf50' }]}>
          🔧 ENGINE FAILURE
        </Text>
        <Text style={styles.alertTime}>01:30 PM • RESOLVED</Text>
        <Text style={styles.alertDesc}>Mokolo Market Perimeter</Text>
        <Text style={styles.alertDriver}>DRIVER: SAMUEL ETO'O FIL</Text>
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
    </ScrollView>
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
    marginTop: 3,
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0b2b3b',
    padding: 12,
    marginTop: 20,
    marginBottom: 30,
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