import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function AlertDetailsScreen({ navigation }) {
  const [elapsed] = useState('00:08:42');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ALERT DETAIL</Text>
        <Text style={styles.headerFr}>DÉTAILS DE L'ALERTE</Text>
      </View>

      <View style={styles.criticalCard}>
        <Text style={styles.criticalTitle}>🚨 CRITICAL ALERT - IN PROGRESS</Text>
        <Text style={styles.criticalFr}>ALERTE CRITIQUE - EN COURS D'EXÉCUTION</Text>
        <Text style={styles.elapsedLabel}>ELAPSED TIME / TEMPS ÉCOULÉ</Text>
        <Text style={styles.elapsedValue}>{elapsed}</Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 BASTOS / MVAN JUNCTION</Text>
        <Text style={styles.gpsLabel}>GPS SIGNAL: OPTIMAL / SIGNAL</Text>
        <Text style={styles.coords}>3.8485° N, 11.5621° E</Text>
      </View>

      <View style={styles.incidentCard}>
        <Text style={styles.sectionLabel}>INCIDENT TYPE / TYPE D'INCIDENT</Text>
        <Text style={styles.incidentValue}>SOS TRIGGER / THEFT</Text>
        <Text style={styles.sectionLabel}>Trigger Time / Heure</Text>
        <Text style={styles.incidentValue}>02:14 PM</Text>
        <Text style={styles.sectionLabel}>Network / Réseau</Text>
        <Text style={styles.incidentValue}>MTN</Text>
      </View>

      <View style={styles.driverCard}>
        <Text style={styles.sectionLabel}>DRIVER / CHAUFFEUR</Text>
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>🎙️ VOICE COMM</Text>
          <Text style={styles.actionFr}>Com. Vocale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>➕ DEPLOY</Text>
          <Text style={styles.actionFr}>Renforts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]}>
          <Text style={styles.resolveText}>✓ MARK RESOLVED</Text>
          <Text style={styles.resolveFr}>Marquer Résolu</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerFr: {
    color: '#ffd700',
    fontSize: 12,
  },
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
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  incidentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  driverCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
    marginBottom: 30,
  },
  actionBtn: {
    backgroundColor: '#0b2b3b',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionFr: {
    color: '#ffd700',
    fontSize: 9,
    marginTop: 2,
  },
  resolveBtn: {
    backgroundColor: '#4caf50',
  },
  resolveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resolveFr: {
    color: 'white',
    fontSize: 8,
    marginTop: 2,
  },
});