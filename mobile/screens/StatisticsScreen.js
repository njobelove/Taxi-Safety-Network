import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

export default function StatisticsScreen({ nav }) {
  const { role } = useAuth();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isDriver = role === 'driver';

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res  = await fetch(BASE_URL + '/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) { console.log('Stats error:', e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const StatCard = ({ icon, label, value, color, sub }) => (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.statValue, { color }]}>{value ?? '—'}</Text>
        <Text style={s.statLabel}>{label}</Text>
        {sub && <Text style={s.statSub}>{sub}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
          <MaterialIcons name="bar-chart" size={22} color="#111" />
          <Text style={s.headerTitle}>TSN STATISTICS</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadStats(); }}>
          <MaterialIcons name="refresh" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={{ color: '#888', marginTop: 12 }}>Loading statistics...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={RED} />}
        >
          <View style={s.heroCard}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
            <Text style={s.heroTitle}>TSN LIVE DASHBOARD</Text>
            <Text style={s.heroSub}>Real-time safety statistics for Cameroon</Text>
          </View>

          <Text style={s.sectionTitle}>ALERT STATISTICS</Text>
          <StatCard icon="notifications-active" label="Active Alerts Right Now"  value={stats?.pendingAlerts}    color={RED}   sub="Requiring immediate response" />
          <StatCard icon="check-circle"         label="Total Resolved Alerts"    value={stats?.resolvedAlerts}   color={GREEN} sub="Successfully handled" />
          <StatCard icon="history"              label="Total Alerts Ever"        value={stats?.totalAlerts}      color={BLUE}  sub="All time" />

          <Text style={s.sectionTitle}>NETWORK STATISTICS</Text>
          <StatCard icon="directions-car"   label="Registered Drivers"    value={stats?.registeredDrivers}  color={BLUE}  sub="Active TSN members" />
          <StatCard icon="local-police"     label="Police Stations"       value={stats?.registeredStations} color={RED}   sub="Connected to TSN" />
          <StatCard icon="chat"             label="Community Messages"    value={stats?.chatMessages}        color="#8B4513" sub="Group chat activity" />

          <Text style={s.sectionTitle}>ALERT TYPES</Text>
          {stats?.alertsByType && Object.entries(stats.alertsByType).map(([type, count]) => (
            <StatCard
              key={type}
              icon={type === 'robbery' ? 'warning' : type === 'accident' ? 'car-crash' : type === 'medical' ? 'medical-services' : type === 'theft' ? 'security' : 'sos'}
              label={type.toUpperCase()}
              value={count}
              color={type === 'robbery' || type === 'sos' ? RED : type === 'accident' ? BLUE : GREEN}
            />
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <View style={s.nav}>
        {(isDriver ? [
          { icon: 'dashboard', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { icon: 'warning',   lbl: 'ALERTS',    to: 'emergency'       },
          { icon: 'bar-chart', lbl: 'STATS',      to: 'statistics'      },
          { icon: 'person',    lbl: 'PROFILE',    to: 'profileSetup'    },
        ] : [
          { icon: 'dashboard',   lbl: 'DASHBOARD', to: 'policeDashboard' },
          { icon: 'map',         lbl: 'LIVE MAP',  to: 'liveMap'         },
          { icon: 'bar-chart',   lbl: 'STATS',      to: 'statistics'      },
          { icon: 'person',      lbl: 'PROFILE',    to: 'profileSetup'    },
        ]).map(({ icon, lbl, to }) => (
          <TouchableOpacity key={lbl} style={lbl === 'STATS' ? s.navActive : s.navItem} onPress={() => nav(to)}>
            <MaterialIcons name={icon} size={22} color={lbl === 'STATS' ? '#fff' : '#aaa'} />
            <Text style={lbl === 'STATS' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
  loadBox:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard:    { backgroundColor: RED, margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  heroTitle:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  heroSub:     { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  sectionTitle:{ fontSize: 11, fontWeight: '800', color: '#888', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, letterSpacing: 0.8 },
  statCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 16, borderLeftWidth: 4, gap: 14, elevation: 1 },
  statIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue:   { fontSize: 28, fontWeight: '900' },
  statLabel:   { fontSize: 13, fontWeight: '700', color: '#333', marginTop: 2 },
  statSub:     { fontSize: 11, color: '#888', marginTop: 2 },
  nav:         { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:   { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:     { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navTxtA:     { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navTxt:      { fontSize: 9, color: '#aaa', marginTop: 2 },
});