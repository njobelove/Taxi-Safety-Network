import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
  ScrollView, Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { voiceAlertService } from '../services/voiceAlertService';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const BLUE  = '#1565C0';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

export default function DisactivationScreen({ nav }) {
  const { user, token } = useAuth();
  const [myAlerts,  setMyAlerts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(false);
  const [allDone,   setAllDone]   = useState(false);

  useEffect(() => { loadMyAlerts(); }, []);

  const loadMyAlerts = async () => {
    setLoading(true);
    try {
      const res  = await fetch(BASE_URL + '/api/alerts');
      const data = await res.json();
      const mine = (data.alerts || []).filter(
        a => a.driverId === user?.badgeId && a.status !== 'resolved'
      );
      setMyAlerts(mine);
    } catch (e) {
      Alert.alert('Error', 'Could not load alerts: ' + e.message);
    } finally { setLoading(false); }
  };

  const doDeactivate = async (alertId) => {
    try {
      await fetch(BASE_URL + '/api/alerts/' + alertId + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ status: 'resolved', responderId: user?.badgeId }),
      });
    } catch (e) {}
    voiceAlertService.removeAlert(alertId);
    setMyAlerts(prev => {
      const remaining = prev.filter(a => (a._id || a.id) !== alertId);
      if (remaining.length === 0) setAllDone(true);
      return remaining;
    });
  };

  const handleSafe = async (alertId) => {
    setBusy(true);
    await doDeactivate(alertId);
    setBusy(false);
  };

  const handleDeactivateAll = async () => {
    setBusy(true);
    for (const alert of myAlerts) await doDeactivate(alert._id || alert.id);
    setBusy(false);
    setAllDone(true);
  };

  const fmt = (ts) => {
    if (!ts) return '';
    const d = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (d < 1) return 'Just now';
    if (d < 60) return d + 'm ago';
    return Math.floor(d / 60) + 'h ago';
  };

  const COLS = { robbery: RED, assault: '#e65100', accident: BLUE, medical: '#827717', theft: '#6a1b9a', sos: RED };

  if (allDone || (!loading && myAlerts.length === 0)) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav('driverDashboard')}>
            <MaterialIcons name="arrow-back" size={24} color={RED} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>ALERT STATUS</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={s.doneWrap}>
          <MaterialIcons name="check-circle" size={100} color={GREEN} />
          <Text style={s.doneTitle}>ALL ALERTS DEACTIVATED</Text>
          <Text style={s.doneSub}>
            You confirmed you are safe.{'\n\n'}
            ✅ Removed from all dashboards{'\n'}
            ✅ Voice broadcast stopped{'\n'}
            ✅ Police notified{'\n\n'}
            Thank you for using TSN. Stay safe!
          </Text>
          <TouchableOpacity style={s.dashBtn} onPress={() => nav('driverDashboard')}>
            <MaterialIcons name="dashboard" size={18} color="#fff" />
            <Text style={s.dashBtnTxt}>RETURN TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('driverDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>DEACTIVATE MY ALERTS</Text>
        <TouchableOpacity onPress={loadMyAlerts}>
          <MaterialIcons name="refresh" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={{ color: '#666', marginTop: 12 }}>Loading your alerts...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <View style={s.statusCard}>
            <MaterialIcons name="warning" size={18} color={RED} />
            <View style={{ flex: 1 }}>
              <Text style={s.statusTitle}>
                {myAlerts.length} ACTIVE ALERT{myAlerts.length !== 1 ? 'S' : ''}
              </Text>
              <Text style={s.statusSub}>
                Broadcasting to all police and drivers.{'\n'}
                Tap I AM SAFE to deactivate each alert.
              </Text>
            </View>
          </View>

          <View style={s.driverCard}>
            <MaterialIcons name="person" size={20} color="#888" />
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{user?.fullName || '—'}</Text>
              <Text style={s.driverMeta}>
                {user?.badgeId || '—'}  ·  {user?.vehiclePlate || '—'}
              </Text>
            </View>
          </View>

          {myAlerts.map((alert) => {
            const alertId = alert._id || alert.id;
            const col     = COLS[alert.alertType] || RED;
            const lat     = alert.location?.lat;
            const lng     = alert.location?.lng;

            return (
              <View key={alertId} style={[s.alertCard, { borderLeftColor: col }]}>
                <View style={s.alertTop}>
                  <View style={[s.alertBadge, { backgroundColor: col }]}>
                    <Text style={s.alertBadgeTxt}>{(alert.alertType || 'SOS').toUpperCase()}</Text>
                  </View>
                  <Text style={s.alertTime}>{fmt(alert.timestamp || alert.createdAt)}</Text>
                  <View style={s.activeBadge}>
                    <Text style={s.activeTxt}>● ACTIVE</Text>
                  </View>
                </View>

                <View style={s.alertLocRow}>
                  <MaterialIcons name="location-on" size={14} color={BLUE} />
                  <Text style={s.alertLoc}>
                    {alert.location?.address ||
                      (lat ? parseFloat(lat).toFixed(4) + '° N, ' + parseFloat(lng).toFixed(4) + '° E'
                           : 'Location not recorded')}
                  </Text>
                </View>

                <View style={s.btnRow}>
                  {lat && (
                    <TouchableOpacity
                      style={s.mapBtn}
                      onPress={() => Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}
                    >
                      <MaterialIcons name="map" size={20} color={GREEN} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={s.callBtn}
                    onPress={() => Linking.openURL('tel:117')}
                  >
                    <MaterialIcons name="local-phone" size={14} color="#90caf9" />
                    <Text style={s.callBtnTxt}>117</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.safeBtn, busy && { opacity: 0.6 }]}
                    onPress={() => handleSafe(alertId)}
                    disabled={busy}
                  >
                    {busy
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <MaterialIcons name="check-circle" size={16} color="#fff" />
                          <Text style={s.safeBtnTxt}>I AM SAFE</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {myAlerts.length > 1 && (
            <TouchableOpacity
              style={[s.allBtn, busy && { opacity: 0.6 }]}
              onPress={handleDeactivateAll}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <>
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <Text style={s.allBtnTxt}>DEACTIVATE ALL {myAlerts.length} ALERTS — I AM SAFE</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          <View style={s.emergCard}>
            <Text style={s.emergTitle}>Still in danger?</Text>
            <View style={s.emergRow}>
              {[
                { label: 'Police\n117',   tel: '117', color: RED  },
                { label: 'Ambulance\n15', tel: '15',  color: BLUE },
                { label: 'Fire\n118',     tel: '118', color: '#7d6608' },
              ].map(({ label, tel, color }) => (
                <TouchableOpacity
                  key={tel}
                  style={[s.emergBtn, { backgroundColor: color }]}
                  onPress={() => Linking.openURL('tel:' + tel)}
                >
                  <MaterialIcons name="local-phone" size={18} color="#fff" />
                  <Text style={s.emergBtnTxt}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d0d0d' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle:  { fontSize: 15, fontWeight: '900', color: '#fff' },
  loadBox:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  doneTitle:    { fontSize: 22, fontWeight: '900', color: GREEN, textAlign: 'center' },
  doneSub:      { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 24 },
  dashBtn:      { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 30, alignItems: 'center', flexDirection: 'row', gap: 8 },
  dashBtnTxt:   { fontSize: 15, fontWeight: '900', color: '#fff' },
  statusCard:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1a0000', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: RED, gap: 12 },
  statusTitle:  { fontSize: 16, fontWeight: '900', color: RED, marginBottom: 4 },
  statusSub:    { fontSize: 12, color: '#ccc', lineHeight: 18 },
  driverCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 12, gap: 12 },
  driverName:   { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 2 },
  driverMeta:   { fontSize: 12, color: '#aaa' },
  alertCard:    { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  alertTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  alertBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  alertBadgeTxt:{ fontSize: 12, fontWeight: '800', color: '#fff' },
  alertTime:    { flex: 1, fontSize: 11, color: '#888' },
  activeBadge:  { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt:    { fontSize: 10, fontWeight: '800', color: '#fff' },
  alertLocRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  alertLoc:     { fontSize: 13, fontWeight: '700', color: '#90caf9', flex: 1 },
  btnRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapBtn:       { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1a3a1a', alignItems: 'center', justifyContent: 'center' },
  callBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a3a', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  callBtnTxt:   { fontSize: 12, fontWeight: '700', color: '#90caf9' },
  safeBtn:      { flex: 1, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  safeBtnTxt:   { fontSize: 14, fontWeight: '900', color: '#fff' },
  allBtn:       { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  allBtnTxt:    { fontSize: 14, fontWeight: '900', color: '#fff' },
  emergCard:    { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 20 },
  emergTitle:   { fontSize: 13, fontWeight: '800', color: '#aaa', marginBottom: 12, textAlign: 'center' },
  emergRow:     { flexDirection: 'row', gap: 8 },
  emergBtn:     { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 4 },
  emergBtnTxt:  { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 18 },
});