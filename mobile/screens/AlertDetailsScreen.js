import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, Linking } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

export default function AlertDetailsScreen({ nav, alertId }) {
  const { user, token, role } = useAuth();
  const [alerts,    setAlerts]    = useState([]);
  const [resolving, setResolving] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const res  = await fetch(BASE_URL + '/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleResolve = async (id) => {
    Alert.alert('Resolve Alert', 'Mark this alert as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'RESOLVE',
        onPress: async () => {
          setResolving(id);
          try {
            await fetch(BASE_URL + '/api/alerts/' + id + '/status', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
              body: JSON.stringify({ status: 'resolved', responderId: user?.badgeId || user?.stationId }),
            });
            setAlerts(prev => prev.filter(a => (a._id || a.id) !== id));
          } catch (e) { Alert.alert('Error', 'Could not resolve alert'); }
          finally { setResolving(null); }
        }
      }
    ]);
  };

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const COLORS = { robbery: RED, assault: '#e65100', accident: BLUE, medical: '#827717', theft: '#6a1b9a', sos: RED };
  const ICONS  = { robbery: 'warning', assault: 'personal-injury', accident: 'car-crash', medical: 'medical-services', theft: 'security', sos: 'sos' };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(role === 'police' ? 'policeDashboard' : 'driverDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
          <MaterialIcons name="warning" size={22} color={RED} />
          <Text style={s.headerTitle}>ALERT DETAILS</Text>
        </View>
        <TouchableOpacity onPress={loadAlerts}>
          <MaterialIcons name="refresh" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadBox}><ActivityIndicator size="large" color={RED} /></View>
      ) : alerts.length === 0 ? (
        <View style={s.emptyBox}>
          <MaterialIcons name="check-circle" size={64} color={GREEN} />
          <Text style={s.emptyTxt}>No active alerts</Text>
          <Text style={s.emptySub}>All alerts have been resolved</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.map(alert => {
            const id  = alert._id || alert.id;
            const col = COLORS[alert.alertType] || RED;
            const ico = ICONS[alert.alertType]  || 'warning';
            const lat = alert.location?.lat;
            const lng = alert.location?.lng;

            return (
              <View key={id} style={[s.card, { borderLeftColor: col }]}>
                <View style={s.cardTop}>
                  <View style={[s.typeBadge, { backgroundColor: col }]}>
                    <MaterialIcons name={ico} size={16} color="#fff" />
                    <Text style={s.typeTxt}>{(alert.alertType || 'SOS').toUpperCase()}</Text>
                  </View>
                  <View style={s.activeBadge}>
                    <Text style={s.activeTxt}>● ACTIVE</Text>
                  </View>
                  <Text style={s.cardTime}>{fmt(alert.timestamp || alert.createdAt)}</Text>
                </View>

                <TouchableOpacity onPress={() => lat && Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}>
                  <View style={s.locRow}>
                    <MaterialIcons name="location-on" size={16} color={BLUE} />
                    <Text style={s.locTxt}>
                      {alert.location?.address || (lat ? parseFloat(lat).toFixed(4) + '° N, ' + parseFloat(lng).toFixed(4) + '° E' : 'No location')}
                      {lat ? '  → tap to open' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={s.driverBox}>
                  <MaterialIcons name="person" size={16} color="#888" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.driverName}>{alert.driverName || '—'}</Text>
                    <Text style={s.driverMeta}>
                      {alert.driverId || '—'}{alert.vehiclePlate ? '  ·  ' + alert.vehiclePlate : ''}{alert.network ? '  ·  ' + alert.network : ''}
                    </Text>
                  </View>
                  {alert.phoneNumber && (
                    <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL('tel:' + alert.phoneNumber)}>
                      <MaterialIcons name="phone" size={18} color={GREEN} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={s.actions}>
                  {lat && (
                    <TouchableOpacity style={s.mapBtn} onPress={() => Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}>
                      <MaterialIcons name="map" size={16} color="#fff" />
                      <Text style={s.mapBtnTxt}>MAP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.callPoliceBtn} onPress={() => Linking.openURL('tel:117')}>
                    <MaterialIcons name="local-phone" size={16} color="#fff" />
                    <Text style={s.callPoliceTxt}>117</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.resolveBtn, resolving === id && { opacity: 0.6 }]}
                    onPress={() => handleResolve(id)}
                    disabled={resolving === id}
                  >
                    {resolving === id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><MaterialIcons name="check-circle" size={16} color="#fff" /><Text style={s.resolveTxt}>RESOLVE</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
  loadBox:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTxt:    { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySub:    { fontSize: 13, color: '#888' },
  card:        { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 12, borderRadius: 14, padding: 16, borderLeftWidth: 4, elevation: 2 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  typeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeTxt:     { fontSize: 11, fontWeight: '800', color: '#fff' },
  activeBadge: { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt:   { fontSize: 10, fontWeight: '800', color: '#fff' },
  cardTime:    { fontSize: 11, color: '#888', flex: 1, textAlign: 'right' },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locTxt:      { fontSize: 13, fontWeight: '700', color: BLUE, flex: 1 },
  driverBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 12 },
  driverName:  { fontSize: 14, fontWeight: '800', color: '#111' },
  driverMeta:  { fontSize: 11, color: '#666', marginTop: 2 },
  callBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  actions:     { flexDirection: 'row', gap: 8 },
  mapBtn:      { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapBtnTxt:   { fontSize: 12, fontWeight: '800', color: '#fff' },
  callPoliceBtn:{ backgroundColor: BLUE, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
  callPoliceTxt:{ fontSize: 12, fontWeight: '800', color: '#fff' },
  resolveBtn:  { flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  resolveTxt:  { fontSize: 12, fontWeight: '800', color: '#fff' },
});