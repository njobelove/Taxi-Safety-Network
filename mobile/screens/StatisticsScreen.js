import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function StatisticsScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SENTINEL</Text>
        <Text style={styles.headerSub}>Secure Uplink Active</Text>
      </View>

      <View style={styles.intelCard}>
        <Text style={styles.intelTitle}>🎯 STRATEGIC INTELLIGENCE</Text>
        <Text style={styles.intelSub}>Command Center View</Text>
      </View>

      <View style={styles.crimeCard}>
        <Text style={styles.crimeTitle}>CRIME LOCATION STATISTICS</Text>
        <Text style={styles.crimeFr}>Statistiques sur la localisation de la criminalité</Text>
        <View style={styles.actionRow}>
          <Text style={styles.last30}>📊 LAST 30 DAYS</Text>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportText}>📄 EXPORT REPORT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heatmapCard}>
        <Text style={styles.heatmapTitle}>🌡️ LIVE INCIDENT HEATMAP</Text>
        <View style={styles.heatmapRow}>
          <View style={styles.highIntensity}>
            <Text style={styles.intensityText}>🔴 HIGH INTENSITY</Text>
          </View>
          <View style={styles.moderateIntensity}>
            <Text style={styles.intensityText}>🟡 MODERATE</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>14.2m</Text>
          <Text style={styles.statLabel}>AVG. RESPONSE TIME</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>06.8m</Text>
          <Text style={styles.statLabel}>CENTRALIZED (HQ)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>1,204 ↑12%</Text>
          <Text style={styles.statLabel}>YAOUNDÉ CENTRAL</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>2,891</Text>
          <Text style={styles.statLabel}>DOUALA LITTORAL</Text>
        </View>
      </View>

      <View style={styles.triggersCard}>
        <Text style={styles.triggersTitle}>🎯 MOST USED TRIGGERS</Text>
        <View style={styles.triggerItem}>
          <Text style={styles.triggerName}>PANIC BUTTON (SOS)</Text>
          <Text style={styles.triggerPercent}>48%</Text>
        </View>
        <View style={styles.triggerItem}>
          <Text style={styles.triggerName}>CITIZEN SURVEILLANCE</Text>
          <Text style={styles.triggerPercent}>31%</Text>
        </View>
        <View style={styles.triggerItem}>
          <Text style={styles.triggerName}>NETWORK PINGS</Text>
          <Text style={styles.triggerPercent}>21%</Text>
        </View>
      </View>

      <View style={styles.activeFooter}>
        <Text style={styles.activeNumber}>458</Text>
        <Text style={styles.activeLabel}>ACTIVE RESPONDERS</Text>
        <Text style={styles.activeSub}>ON PATROL NOW</Text>
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
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: 'white',
    fontSize: 12,
  },
  intelCard: {
    backgroundColor: '#1e4a6b',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  intelTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  intelSub: {
    color: '#ffd700',
    fontSize: 11,
  },
  crimeCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  crimeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  crimeFr: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  last30: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  exportBtn: {
    backgroundColor: '#0b2b3b',
    padding: 8,
    borderRadius: 8,
  },
  exportText: {
    color: 'white',
    fontSize: 11,
  },
  heatmapCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
  },
  heatmapTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  highIntensity: {
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  moderateIntensity: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  intensityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2b3b',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  triggersCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
  },
  triggersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  triggerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  triggerName: {
    fontSize: 13,
  },
  triggerPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  activeFooter: {
    backgroundColor: '#0b2b3b',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  activeNumber: {
    color: '#ffd700',
    fontSize: 36,
    fontWeight: 'bold',
  },
  activeLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeSub: {
    color: '#4caf50',
    fontSize: 11,
  },
});