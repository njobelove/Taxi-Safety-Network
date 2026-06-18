import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { getAllActiveAlerts, resolveAlert } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';

const ALERT_CONFIG = {
  theft:    { label: 'THEFT / AGRESSION',  color: RED,       bg: '#fde8e8', ico: '🔴' },
  accident: { label: 'ACCIDENT',            color: BLUE,      bg: '#e8f0fe', ico: '🚗' },
  medical:  { label: 'MEDICAL',             color: '#827717', bg: '#f9f6e0', ico: '🏥' },
  voice:    { label: 'VOICE TRIGGER',       color: '#6a1b9a', bg: '#f3e5f5', ico: '🎙' },
};

export default function PoliceDashboard({ nav }) {
  const { user } = useAuth();
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolving, setResolving]  = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAllActiveAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleResolve = async (alertId) => {
    setResolving(alertId);
    try {
      await resolveAlert(alertId, user?.station_id);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (e) {
      console.error('Resolve failed:', e);
    } finally {
      setResolving(null);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-CM', { day: '2-digit', month: 'short' });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={s.shieldWrap}><Text style={{ fontSize: 17, color: '#fff' }}>🛡</Text></View>
          <View>
            <Text style={s.headerTitle}>TAXI SAFETY NETWORK</Text>
            <Text style={s.headerSub}>{user?.station_name || 'DISTRICT COMMAND'}</Text>
          </View>
        </View>
        <View style={s.bellWrap}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          {alerts.length > 0 && <View style={s.bellDot}><Text style={s.bellCount}>{alerts.length}</Text></View>}
        </View>
        <Text style={{ fontSize: 20, marginLeft: 8 }}>📶</Text>
      </View>

      {/* Station info bar */}
      <View style={s.stationBar}>
        <View style={s.stationInfo}>
          <Text style={s.stationId}>{user?.station_id || '—'}</Text>
          <Text style={s.stationDistrict}>{user?.district || '—'}  •  {user?.city || '—'}</Text>
        </View>
        <View style={s.emergencyNumbers}>
          <Text style={s.emergencyLabel}>EMERGENCY LINES</Text>
          <Text style={s.emergencyNum}>📞 {user?.emergency_line || '—'}</Text>
          {user?.secondary_line ? <Text style={s.emergencyNum}>📞 {user.secondary_line}</Text> : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={RED} />}
      >
        {/* Map area */}
        <View style={s.mapArea}>
          <View style={s.liveSignalBadge}>
            <View style={s.liveYellow} />
            <Text style={s.liveSignalTxt}>LIVE SIGNAL: ACTIVE  •  Auto-refresh 15s</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 80, opacity: 0.2 }}>🗺</Text>
          </View>
          <View style={s.sectorRow}>
            <View>
              <Text style={s.sectorLabel}>MONITORING AREA</Text>
              <Text style={s.sectorName}>{user?.district || 'All Sectors'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={s.zoomBtn}><Text style={s.zoomTxt}>+</Text></View>
              <View style={s.zoomBtn}><Text style={s.zoomTxt}>−</Text></View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statLeft}>
            <Text style={s.statLabel}>ACTIVE ALERTS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={s.statNum}>{loading ? '—' : String(alerts.length).padStart(2, '0')}</Text>
              {alerts.length > 0 && <View style={s.newBadge}><Text style={s.newTxt}>LIVE</Text></View>}
            </View>
          </View>
          <View style={s.statRight}>
            <Text style={[s.statLabel, { color: '#fff' }]}>STATION ID</Text>
            <Text style={[s.statNum, { color: '#fff', fontSize: 22, marginTop: 6 }]}>
              {user?.station_id || '—'}
            </Text>
          </View>
        </View>

        {/* Alert list */}
        <View style={s.logsSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={s.logsTitle}>ACTIVE INCIDENT LOGS</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={{ fontSize: 12, color: RED, fontWeight: '700' }}>↻  REFRESH</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.logsFr}>All alerts from all taxi drivers across Cameroon</Text>

          {loading ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <ActivityIndicator size="large" color={RED} />
              <Text style={{ color: '#888', marginTop: 12 }}>Loading alerts...</Text>
            </View>
          ) : alerts.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={s.emptyTxt}>No active alerts</Text>
              <Text style={s.emptyFr}>Aucune alerte active — Pull down to refresh</Text>
            </View>
          ) : (
            alerts.map((alert) => {
              const cfg = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.theft;
              return (
                <View key={alert._id} style={[s.incCard, { borderLeftColor: cfg.color }]}>

                  {/* Top row */}
                  <View style={s.incTop}>
                    <View style={[s.incTagWrap, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.incTag, { color: cfg.color }]}>{cfg.ico}  {cfg.label}</Text>
                    </View>
                    <Text style={s.incTime}>{formatTime(alert.created_at)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: RED }]}>
                      <Text style={s.statusTxt}>ACTIVE</Text>
                    </View>
                  </View>

                  {/* Alert date */}
                  <Text style={s.incDate}>{formatDate(alert.created_at)}</Text>

                  {/* Location */}
                  {alert.address ? (
                    <Text style={s.incTitle}>📍 {alert.address}</Text>
                  ) : alert.latitude ? (
                    <Text style={s.incTitle}>
                      📍 {alert.latitude.toFixed(4)}° N, {alert.longitude.toFixed(4)}° E
                    </Text>
                  ) : (
                    <Text style={s.incTitle}>📍 Location not available</Text>
                  )}

                  {/* Driver info */}
                  <View style={s.incMetaRow}>
                    <Text style={s.incMeta}>🪪 {alert.badge_id || '—'}</Text>
                    <Text style={s.incMeta}>  📡 {alert.network || 'MTN'}</Text>
                  </View>

                  {/* Trigger method */}
                  {alert.trigger_method && (
                    <View style={s.triggerBadge}>
                      <Text style={s.triggerTxt}>
                        {alert.trigger_method === 'voice'    ? '🎙 Voice trigger' :
                         alert.trigger_method === 'hardware' ? '🔧 Hardware button' : '👆 Manual SOS'}
                      </Text>
                    </View>
                  )}

                  {/* Driver row */}
                  <View style={s.driverRow}>
                    <View style={s.driverAvatar}><Text style={{ fontSize: 20 }}>👤</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.driverLabel}>DRIVER / CHAUFFEUR</Text>
                      <Text style={s.driverName}>{alert.driver_name || '—'}</Text>
                      {alert.vehicle_plate && <Text style={s.driverMeta}>🚖 {alert.vehicle_plate}</Text>}
                      {alert.driver_phone  && <Text style={s.driverMeta}>📞 {alert.driver_phone}</Text>}
                    </View>
                    <TouchableOpacity
                      style={s.callBtn}
                      onPress={() => {/* dial alert.driver_phone */}}
                    >
                      <Text style={{ fontSize: 18 }}>📞</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action buttons */}
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={s.viewBtn}
                      onPress={() => nav('alertDetails')}
                    >
                      <Text style={s.viewBtnTxt}>VIEW DETAILS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.resolveBtn}
                      onPress={() => handleResolve(alert._id)}
                      disabled={resolving === alert._id}
                    >
                      {resolving === alert._id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={s.resolveBtnTxt}>✓ RESOLVED</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⊞</Text><Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        {[
          { ico: '⚠',  lbl: 'ALERTS',    to: 'policeDashboard' },
          { ico: '👥', lbl: 'CONTACTS',   to: 'contacts'         },
          { ico: '👤', lbl: 'PROFILE',    to: 'profileSetup'     },
        ].map(({ ico, lbl, to }) => (
          <TouchableOpacity key={lbl} style={s.navItem} onPress={() => nav(to)}>
            <Text style={s.navIco}>{ico}</Text><Text style={s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  shieldWrap:     { width: 34, height: 34, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:    { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:      { fontSize: 10, color: '#888', marginTop: 1 },
  bellWrap:       { position: 'relative' },
  bellDot:        { position: 'absolute', top: -6, right: -6, backgroundColor: RED, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellCount:      { fontSize: 10, color: '#fff', fontWeight: '900' },
  stationBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 10 },
  stationInfo:    { flex: 1 },
  stationId:      { fontSize: 15, fontWeight: '900', color: GOLD },
  stationDistrict:{ fontSize: 11, color: '#aaa', marginTop: 2 },
  emergencyNumbers:{ alignItems: 'flex-end' },
  emergencyLabel: { fontSize: 9, color: '#aaa', fontWeight: '600', letterSpacing: 0.5 },
  emergencyNum:   { fontSize: 11, color: '#fff', fontWeight: '700', marginTop: 2 },
  mapArea:        { backgroundColor: '#b8cfae', height: 200, position: 'relative' },
  liveSignalBadge:{ position: 'absolute', top: 14, left: 14, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  liveYellow:     { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, marginRight: 6 },
  liveSignalTxt:  { fontSize: 11, fontWeight: '700', color: '#333' },
  sectorRow:      { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 14 },
  sectorLabel:    { fontSize: 10, color: '#fff', fontWeight: '600', opacity: 0.8 },
  sectorName:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  zoomBtn:        { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  zoomTxt:        { fontSize: 20, fontWeight: '300', color: '#333' },
  statsRow:       { flexDirection: 'row', margin: 14, gap: 12 },
  statLeft:       { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statRight:      { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16 },
  statLabel:      { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  statNum:        { fontSize: 42, fontWeight: '900', color: RED },
  newBadge:       { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 10 },
  newTxt:         { fontSize: 10, fontWeight: '700', color: '#fff' },
  logsSection:    { paddingHorizontal: 14, paddingBottom: 14 },
  logsTitle:      { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },
  logsFr:         { fontSize: 10, color: '#888', marginBottom: 14 },
  emptyCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  emptyTxt:       { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12 },
  emptyFr:        { fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' },
  incCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  incTop:         { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 },
  incTagWrap:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  incTag:         { fontSize: 11, fontWeight: '700' },
  incTime:        { fontSize: 11, color: '#666', flex: 1 },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:      { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  incDate:        { fontSize: 10, color: '#aaa', marginBottom: 4 },
  incTitle:       { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 6 },
  incMetaRow:     { flexDirection: 'row', marginBottom: 6 },
  incMeta:        { fontSize: 11, color: '#666' },
  triggerBadge:   { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  triggerTxt:     { fontSize: 11, color: '#555', fontWeight: '600' },
  driverRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 10 },
  driverAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  driverLabel:    { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 0.3 },
  driverName:     { fontSize: 14, fontWeight: '800', color: '#111' },
  driverMeta:     { fontSize: 11, color: '#666', marginTop: 2 },
  callBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  actionRow:      { flexDirection: 'row', gap: 10 },
  viewBtn:        { flex: 1, backgroundColor: BLUE, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  viewBtnTxt:     { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  resolveBtn:     { flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  resolveBtnTxt:  { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  bottomNav:      { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:      { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:        { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:        { fontSize: 18, color: '#fff' },
  navTxtA:        { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:         { fontSize: 18, color: '#aaa' },
  navTxt:         { fontSize: 9, color: '#aaa', marginTop: 2 },
});
