import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
  RefreshControl, Linking, Alert,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const ALERT_CONFIG = {
  robbery:  { ico: '⚠',  label: 'ROBBERY',  color: RED      },
  assault:  { ico: '🚨', label: 'ASSAULT',   color: '#e65100'},
  accident: { ico: '🚓', label: 'ACCIDENT',  color: BLUE     },
  medical:  { ico: '➕', label: 'MEDICAL',   color: '#827717'},
  theft:    { ico: '🔒', label: 'THEFT',     color: '#6a1b9a'},
  sos:      { ico: '🆘', label: 'SOS',       color: RED      },
};

export default function HistoryScreen({ nav }) {
  const { user, role } = useAuth();
  const [allAlerts,  setAllAlerts]  = useState([]);
  const [myAlerts,   setMyAlerts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('all'); // 'all' | 'mine' | 'resolved'

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Load all alerts including resolved
      const res  = await fetch(BASE_URL + '/api/alerts/history');
      const data = await res.json();
      const all  = data.alerts || [];
      setAllAlerts(all);
      setMyAlerts(all.filter(a => a.driverId === user?.badgeId));
    } catch (e) {
      // Fallback: load active alerts if no history endpoint
      try {
        const res  = await fetch(BASE_URL + '/api/alerts');
        const data = await res.json();
        const all  = data.alerts || [];
        setAllAlerts(all);
        setMyAlerts(all.filter(a => a.driverId === user?.badgeId));
      } catch (e2) {
        console.log('Load history error:', e2.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fmt = (ts) => {
    if (!ts) return '—';
    const d    = new Date(ts);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 60)   return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff/60) + 'h ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
           '  ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayed = tab === 'mine'
    ? myAlerts
    : tab === 'resolved'
    ? allAlerts.filter(a => a.status === 'resolved')
    : allAlerts;

  const isDriver = role === 'driver';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📋 ALERT HISTORY</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadHistory(); }}>
          <Text style={{ fontSize: 20, color: GREEN }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Stats summary */}
      <View style={s.statsRow}>
        {[
          [allAlerts.length,                              'TOTAL\nALERTS',    BLUE ],
          [allAlerts.filter(a=>a.status==='pending').length,  'ACTIVE',       RED  ],
          [allAlerts.filter(a=>a.status==='resolved').length, 'RESOLVED',     GREEN],
          [myAlerts.length,                               'MY\nALERTS',      GOLD ],
        ].map(([num, lbl, col], i) => (
          <View key={i} style={[s.stat, { borderBottomColor: col }]}>
            <Text style={[s.statNum, { color: col }]}>{num}</Text>
            <Text style={s.statLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { key: 'all',      label: 'All (' + allAlerts.length + ')'    },
          { key: 'mine',     label: 'Mine (' + myAlerts.length + ')'    },
          { key: 'resolved', label: 'Resolved (' + allAlerts.filter(a=>a.status==='resolved').length + ')' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, tab === key && s.tabOn]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabTxt, tab === key && s.tabTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={{ color: '#888', marginTop: 12 }}>Loading history...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor={RED} />}
        >
          {displayed.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={s.emptyTxt}>No alerts found</Text>
              <Text style={s.emptySub}>
                {tab === 'mine' ? 'You have not triggered any alerts yet' : 'No alerts in this category'}
              </Text>
            </View>
          ) : (
            displayed.map((alert) => {
              const alertId  = alert._id || alert.id;
              const cfg      = ALERT_CONFIG[alert.alertType] || ALERT_CONFIG.sos;
              const lat      = alert.location?.lat;
              const lng      = alert.location?.lng;
              const resolved = alert.status === 'resolved';
              const isMe     = alert.driverId === user?.badgeId;

              return (
                <View key={alertId} style={[s.alertCard, { borderLeftColor: cfg.color }, resolved && s.resolvedCard]}>

                  {/* Header */}
                  <View style={s.alertHeader}>
                    <View style={[s.typeBadge, { backgroundColor: cfg.color }]}>
                      <Text style={s.typeBadgeTxt}>{cfg.ico} {cfg.label}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: resolved ? GREEN : RED }]}>
                      <Text style={s.statusTxt}>{resolved ? '✓ RESOLVED' : '● ACTIVE'}</Text>
                    </View>
                    {isMe && (
                      <View style={s.meBadge}>
                        <Text style={s.meTxt}>MY ALERT</Text>
                      </View>
                    )}
                  </View>

                  {/* Time */}
                  <Text style={s.alertTime}>🕐 {fmt(alert.timestamp || alert.createdAt)}</Text>
                  {resolved && alert.resolvedAt && (
                    <Text style={s.resolvedTime}>✅ Resolved: {fmt(alert.resolvedAt)}</Text>
                  )}

                  {/* Location */}
                  <TouchableOpacity
                    onPress={() => lat && Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}
                  >
                    <Text style={s.alertLoc}>
                      📍 {alert.location?.address ||
                        (lat ? parseFloat(lat).toFixed(4) + '° N, ' + parseFloat(lng).toFixed(4) + '° E'
                             : 'Location not recorded')}
                      {lat ? '  →  tap to open' : ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Driver info */}
                  <View style={s.driverRow}>
                    <Text style={s.driverInfo}>
                      👤 {alert.driverName || '—'}  ·  🪪 {alert.driverId || '—'}
                      {alert.vehiclePlate ? '  ·  🚗 ' + alert.vehiclePlate : ''}
                    </Text>
                  </View>

                  {/* Trigger method */}
                  <Text style={s.triggerTxt}>
                    Triggered: {alert.triggerMethod || 'manual'}
                    {alert.hasVoiceNote ? '  ·  🎙 Voice note' : ''}
                  </Text>
                </View>
              );
            })
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={s.nav}>
        {(isDriver ? [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'emergency'       },
          { ico: '📋', lbl: 'HISTORY',   to: 'history'         },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
        ] : [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'policeDashboard' },
          { ico: '🗺',  lbl: 'LIVE MAP', to: 'liveMap'         },
          { ico: '📋', lbl: 'HISTORY',   to: 'history'         },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
        ]).map(({ ico, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'HISTORY' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <Text style={lbl === 'HISTORY' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'HISTORY' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back:         { fontSize: 22, color: RED, fontWeight: '600' },
  headerTitle:  { fontSize: 15, fontWeight: '900', color: '#111' },
  statsRow:     { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  stat:         { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 3 },
  statNum:      { fontSize: 22, fontWeight: '900' },
  statLbl:      { fontSize: 9, color: '#888', textAlign: 'center', marginTop: 3, fontWeight: '600' },
  tabs:         { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingBottom: 8, paddingTop: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab:          { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  tabOn:        { backgroundColor: RED },
  tabTxt:       { fontSize: 11, fontWeight: '700', color: '#666' },
  tabTxtOn:     { color: '#fff' },
  loadBox:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyBox:     { alignItems: 'center', paddingVertical: 60 },
  emptyTxt:     { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub:     { fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' },
  alertCard:    { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, borderRadius: 14, padding: 14, borderLeftWidth: 4, elevation: 1 },
  resolvedCard: { opacity: 0.8 },
  alertHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  typeBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusTxt:    { fontSize: 10, fontWeight: '800', color: '#fff' },
  meBadge:      { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  meTxt:        { fontSize: 10, fontWeight: '800', color: '#111' },
  alertTime:    { fontSize: 12, color: '#555', marginBottom: 4, fontWeight: '600' },
  resolvedTime: { fontSize: 11, color: GREEN, marginBottom: 4 },
  alertLoc:     { fontSize: 13, fontWeight: '700', color: BLUE, marginBottom: 8 },
  driverRow:    { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8, marginBottom: 6 },
  driverInfo:   { fontSize: 12, color: '#333', fontWeight: '600' },
  triggerTxt:   { fontSize: 10, color: '#aaa' },
  nav:          { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:    { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:      { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:      { fontSize: 18, color: '#fff' },
  navTxtA:      { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:       { fontSize: 18, color: '#aaa' },
  navTxt:       { fontSize: 9, color: '#aaa', marginTop: 2 },
});