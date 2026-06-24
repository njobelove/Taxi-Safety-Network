import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { getStats } from '../services/api';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function StatisticsScreen({ nav }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState('statistics');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getStats();
      setStats(data);
    } catch (e) {
      console.log('Stats error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const triggers = [
    { ico: '✱', icoBg: RED,       name: 'PANIC BUTTON (SOS)',    pct: 48, barW: '48%' },
    { ico: '📹', icoBg: '#1a237e', name: 'CITIZEN SURVEILLANCE', pct: 31, barW: '31%' },
    { ico: '📡', icoBg: '#e65100', name: 'NETWORK PINGS',        pct: 21, barW: '21%' },
  ];

  // ── Bottom nav items ────────────────────────────────────────────────────────
  const navItems = [
    { ico: '⊞',  lbl: 'DASHBOARD', to: 'driverDashboard' },
    { ico: '⚠',  lbl: 'ALERTS',    to: 'emergency'       },
    { ico: '📊', lbl: 'STATS',     to: 'statistics'      },
    { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('driverDashboard')} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}>
            <Text style={s.shieldIco}>🛡</Text>
          </View>
          <Text style={s.brand}>SENTINEL</Text>
        </View>
        <TouchableOpacity onPress={() => nav('profileSetup')} style={s.profileBtn}>
          <Text style={s.profileIco}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.intelTxt}>STRATEGIC INTELLIGENCE</Text>
          <Text style={s.pageTitle}>CRIME LOCATION{'\n'}STATISTICS</Text>
          <Text style={s.pageFr}>Statistiques sur la localisation de la criminalité</Text>
        </View>

        {/* Live stats from backend */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={s.loadingTxt}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={s.liveStatsRow}>
            <TouchableOpacity
              style={[s.liveStatBox, { backgroundColor: RED }]}
              onPress={() => nav('emergency')}
            >
              <Text style={s.liveStatNum}>{stats?.totalAlerts || 0}</Text>
              <Text style={s.liveStatLbl}>TOTAL{'\n'}ALERTS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.liveStatBox, { backgroundColor: '#ff9800' }]}
              onPress={() => nav('emergency')}
            >
              <Text style={s.liveStatNum}>{stats?.pendingAlerts || 0}</Text>
              <Text style={s.liveStatLbl}>PENDING{'\n'}ALERTS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.liveStatBox, { backgroundColor: '#4caf50' }]}
              onPress={fetchStats}
            >
              <Text style={s.liveStatNum}>{stats?.resolvedAlerts || 0}</Text>
              <Text style={s.liveStatLbl}>RESOLVED{'\n'}TODAY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.liveStatBox, { backgroundColor: BLUE }]}
              onPress={() => nav('driverDashboard')}
            >
              <Text style={s.liveStatNum}>{stats?.registeredDrivers || 0}</Text>
              <Text style={s.liveStatLbl}>DRIVERS{'\n'}ONLINE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter + Refresh */}
        <View style={s.filterRow}>
          <TouchableOpacity style={s.filterBtn}>
            <Text style={s.filterIco}>📅</Text>
            <Text style={s.filterTxt}>LAST 30 DAYS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.exportBtn} onPress={fetchStats}>
            <Text style={s.exportIco}>↻</Text>
            <Text style={s.exportTxt}>REFRESH DATA</Text>
          </TouchableOpacity>
        </View>

        {/* Heatmap */}
        <View style={s.heatCard}>
          <View style={s.heatLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: RED }]} />
              <Text style={s.legendTxt}>HIGH INTENSITY</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#ff9800' }]} />
              <Text style={s.legendTxt}>MODERATE</Text>
            </View>
          </View>
          <View style={s.mapArea}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE INCIDENT HEATMAP</Text>
            </View>
            <Text style={s.mapEmoji}>🗺</Text>
          </View>
        </View>

        {/* Response time */}
        <View style={s.card}>
          <Text style={s.cardTitle}>AVG. RESPONSE TIME</Text>
          <View style={s.responseRow}>
            <Text style={s.responseLabel}>CENTRALIZED (HQ)</Text>
            <Text style={s.responseVal}>{stats?.avgResponseTime || '14.2m'}</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: '70%', backgroundColor: BLUE }]} />
          </View>
          <View style={s.responseRow}>
            <Text style={s.responseLabel}>DECENTRALIZED (SUB-STATION)</Text>
            <Text style={[s.responseVal, { color: RED }]}>06.8m</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: '34%', backgroundColor: RED }]} />
          </View>
          <Text style={s.responseNote}>
            Decentralised response shows 52% efficiency gain over traditional dispatch models.
          </Text>
        </View>

        {/* Most used triggers */}
        <View style={s.card}>
          <Text style={s.cardTitle}>MOST USED TRIGGERS</Text>
          {triggers.map((t) => (
            <View key={t.name} style={s.triggerRow}>
              <View style={[s.triggerIcoBg, { backgroundColor: t.icoBg }]}>
                <Text style={s.triggerIco}>{t.ico}</Text>
              </View>
              <View style={s.triggerInfo}>
                <View style={s.triggerTopRow}>
                  <Text style={s.triggerName}>{t.name}</Text>
                  <Text style={s.triggerPct}>{t.pct}%</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: t.barW, backgroundColor: t.icoBg }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* City stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>INCIDENT BY CITY</Text>
          <Text style={s.cityName}>YAOUNDÉ CENTRAL</Text>
          <View style={s.cityRow}>
            <Text style={s.cityNum}>1,204</Text>
            <View style={s.cityChange}>
              <Text style={s.cityChangeTxt}>↑12% VS LY</Text>
            </View>
          </View>
          <View style={s.cityBar}>
            <View style={[s.cityBarFill, { width: '42%', backgroundColor: RED }]} />
          </View>
          <Text style={[s.cityName, { marginTop: 16 }]}>DOUALA LITTORAL</Text>
          <View style={s.cityRow}>
            <Text style={s.cityNum}>2,891</Text>
            <View style={[s.cityChange, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[s.cityChangeTxt, { color: '#2e7d32' }]}>STABLE</Text>
            </View>
          </View>
          <View style={s.cityBar}>
            <View style={[s.cityBarFill, { width: '65%', backgroundColor: BLUE }]} />
          </View>
        </View>

        {/* Quick navigation cards */}
        <View style={s.card}>
          <Text style={s.cardTitle}>QUICK NAVIGATION</Text>
          <View style={s.quickNavGrid}>
            <TouchableOpacity
              style={[s.quickNavBtn, { backgroundColor: RED }]}
              onPress={() => nav('emergency')}
            >
              <Text style={s.quickNavIco}>🚨</Text>
              <Text style={s.quickNavTxt}>REPORT{'\n'}ALERT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickNavBtn, { backgroundColor: BLUE }]}
              onPress={() => nav('driverDashboard')}
            >
              <Text style={s.quickNavIco}>⊞</Text>
              <Text style={s.quickNavTxt}>DRIVER{'\n'}DASHBOARD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickNavBtn, { backgroundColor: '#4caf50' }]}
              onPress={() => nav('profileSetup')}
            >
              <Text style={s.quickNavIco}>👤</Text>
              <Text style={s.quickNavTxt}>MY{'\n'}PROFILE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickNavBtn, { backgroundColor: '#ff9800' }]}
              onPress={fetchStats}
            >
              <Text style={s.quickNavIco}>↻</Text>
              <Text style={s.quickNavTxt}>REFRESH{'\n'}DATA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency level */}
        <View style={s.emergencyCard}>
          <Text style={s.emergencyLabel}>EMERGENCY LEVEL</Text>
          <Text style={s.emergencyVal}>ALPHA 1</Text>
          <Text style={s.emergencyFr}>CRITICAL PRIORITY</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav — ALL WORKING */}
      <View style={s.bottomNav}>
        {navItems.map(({ ico, lbl, to }) => {
          const isActive = active === to || (lbl === 'STATS');
          return (
            <TouchableOpacity
              key={lbl}
              style={isActive ? s.navActive : s.navItem}
              onPress={() => {
                setActive(to);
                nav(to);
              }}
            >
              <Text style={isActive ? s.navIcoA : s.navIco}>{ico}</Text>
              <Text style={isActive ? s.navTxtA : s.navTxt}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111' },
  backBtn:       { padding: 4 },
  backTxt:       { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
  shieldWrap:    { width: 28, height: 28, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  shieldIco:     { fontSize: 14, color: '#fff' },
  brand:         { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  profileBtn:    { padding: 4 },
  profileIco:    { fontSize: 22 },
  titleBlock:    { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  intelTxt:      { fontSize: 11, fontWeight: '700', color: BLUE, letterSpacing: 0.5, marginBottom: 6 },
  pageTitle:     { fontSize: 30, fontWeight: '900', color: '#111', lineHeight: 36 },
  pageFr:        { fontSize: 11, color: '#888', marginTop: 6, lineHeight: 16 },
  loadingBox:    { alignItems: 'center', padding: 30 },
  loadingTxt:    { color: '#888', marginTop: 10, fontSize: 13 },
  liveStatsRow:  { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 14 },
  liveStatBox:   { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  liveStatNum:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  liveStatLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  filterRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 14 },
  filterBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  filterIco:     { fontSize: 14, marginRight: 6 },
  filterTxt:     { fontSize: 12, fontWeight: '600', color: '#333' },
  exportBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  exportIco:     { fontSize: 14, color: '#fff', marginRight: 6 },
  exportTxt:     { fontSize: 11, fontWeight: '800', color: '#fff' },
  heatCard:      { marginHorizontal: 14, marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  heatLegend:    { flexDirection: 'row', gap: 16, backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 10 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendTxt:     { fontSize: 10, color: '#ccc', fontWeight: '600' },
  mapArea:       { height: 160, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  liveBadge:     { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 6 },
  liveTxt:       { fontSize: 10, color: '#fff', fontWeight: '700' },
  mapEmoji:      { fontSize: 60, opacity: 0.15 },
  card:          { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 18 },
  cardTitle:     { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.3, marginBottom: 14 },
  responseRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  responseLabel: { fontSize: 11, color: '#555', fontWeight: '600' },
  responseVal:   { fontSize: 18, fontWeight: '900', color: BLUE },
  barTrack:      { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 12 },
  barFill:       { height: 5, borderRadius: 3 },
  responseNote:  { fontSize: 10, color: '#888', fontStyle: 'italic', lineHeight: 15 },
  triggerRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  triggerIcoBg:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  triggerIco:    { fontSize: 18, color: '#fff' },
  triggerInfo:   { flex: 1 },
  triggerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  triggerName:   { fontSize: 12, fontWeight: '700', color: '#111' },
  triggerPct:    { fontSize: 12, fontWeight: '800', color: '#555' },
  cityName:      { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  cityRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 },
  cityNum:       { fontSize: 32, fontWeight: '900', color: '#111' },
  cityChange:    { backgroundColor: '#fde8e8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cityChangeTxt: { fontSize: 10, fontWeight: '700', color: RED },
  cityBar:       { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3 },
  cityBarFill:   { height: 5, borderRadius: 3 },
  quickNavGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickNavBtn:   { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center' },
  quickNavIco:   { fontSize: 28, marginBottom: 6 },
  quickNavTxt:   { fontSize: 11, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 16 },
  emergencyCard: { backgroundColor: RED, marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 20 },
  emergencyLabel:{ fontSize: 11, color: '#ffc9c9', fontWeight: '600', letterSpacing: 0.5 },
  emergencyVal:  { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 4 },
  emergencyFr:   { fontSize: 12, color: '#ffc9c9', marginTop: 2 },
  bottomNav:     { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10 },
  navActive:     { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:       { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:       { fontSize: 18, color: '#fff' },
  navTxtA:       { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 9, color: '#aaa', marginTop: 2 },
});
