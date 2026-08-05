import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com' : 'http://localhost:8000';

export default function LiveMapScreen({ nav, location }) {
  const { user, role } = useAuth();
  const [drivers,   setDrivers]   = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cached,    setCached]    = useState(false);
  const [lastUpdate,setLastUpdate]= useState(null);
  const [isOnline,  setIsOnline]  = useState(true);
  const isDriver = role === 'driver';
  const mapRef   = useRef(null);

  useEffect(() => {
    checkOnline();
    loadData();
    const iv = setInterval(loadData, 15000);
    window.addEventListener?.('online',  () => setIsOnline(true));
    window.addEventListener?.('offline', () => setIsOnline(false));
    return () => {
      clearInterval(iv);
      window.removeEventListener?.('online',  () => setIsOnline(true));
      window.removeEventListener?.('offline', () => setIsOnline(false));
    };
  }, []);

  const checkOnline = () => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  };

  const loadData = async () => {
    try {
      const [driversRes, alertsRes] = await Promise.all([
        fetch(BASE_URL + '/api/drivers/live'),
        fetch(BASE_URL + '/api/alerts'),
      ]);
      const driversData = await driversRes.json();
      const alertsData  = await alertsRes.json();
      const d = driversData.drivers || [];
      const a = alertsData.alerts   || [];
      setDrivers(d);
      setAlerts(a.filter(x => x.status !== 'resolved'));
      setLastUpdate(new Date());
      setIsOnline(true);
      // Cache to localStorage for offline use
      try {
        localStorage.setItem('tsn_cached_drivers', JSON.stringify(d));
        localStorage.setItem('tsn_cached_alerts',  JSON.stringify(a));
        localStorage.setItem('tsn_cache_time',     Date.now().toString());
        setCached(true);
      } catch(e) {}
    } catch (e) {
      setIsOnline(false);
      // Load from cache
      try {
        const cd = localStorage.getItem('tsn_cached_drivers');
        const ca = localStorage.getItem('tsn_cached_alerts');
        const ct = localStorage.getItem('tsn_cache_time');
        if (cd) setDrivers(JSON.parse(cd));
        if (ca) setAlerts(JSON.parse(ca).filter(x => x.status !== 'resolved'));
        if (ct) setLastUpdate(new Date(parseInt(ct)));
        setCached(true);
      } catch(e2) {}
    } finally { setLoading(false); }
  };

  const fmt = ts => {
    if (!ts) return '';
    const d = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (d < 1) return 'Just now';
    if (d < 60) return d + 'm ago';
    return Math.floor(d/60) + 'h ago';
  };

  const openInMaps = (lat, lng, label) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&label=${encodeURIComponent(label)}`;
    if (typeof window !== 'undefined') window.open(url, '_blank');
  };

  const myLat = location?.latitude  || 3.848;
  const myLng = location?.longitude || 11.502;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>LIVE MAP</Text>
          <Text style={s.headerSub}>
            {isOnline ? '🟢 Live' : '🔴 Offline — showing cached data'}
            {lastUpdate ? '  ·  Updated ' + fmt(lastUpdate) : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={loadData} style={s.refreshBtn}>
          <MaterialIcons name="refresh" size={22} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Map iframe - uses Google Maps embed */}
      <View style={s.mapContainer}>
        {loading ? (
          <View style={s.mapLoading}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={{ color: '#888', marginTop: 12 }}>Loading map...</Text>
          </View>
        ) : (
          <iframe
            ref={mapRef}
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyB9iv8Zj-6kBVmHME1JQ3rrbWaRfQGjcGw&center=${myLat},${myLng}&zoom=13&maptype=roadmap`}
            allowFullScreen
          />
        )}

        {/* Alert pins overlay */}
        {alerts.length > 0 && (
          <View style={s.alertOverlay}>
            <MaterialIcons name="warning" size={14} color={RED} />
            <Text style={s.alertOverlayTxt}>{alerts.length} ACTIVE ALERT{alerts.length > 1 ? 'S' : ''}</Text>
          </View>
        )}

        {/* Offline badge */}
        {!isOnline && (
          <View style={s.offlineBadge}>
            <MaterialIcons name="wifi-off" size={14} color="#fff" />
            <Text style={s.offlineBadgeTxt}>OFFLINE — Cached Map</Text>
          </View>
        )}
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        {[
          [drivers.length, 'DRIVERS', BLUE,  'directions-car'],
          [alerts.length,  'ALERTS',  RED,   'warning'       ],
          [cached ? 1 : 0, 'CACHED',  GREEN, 'save'          ],
        ].map(([num, lbl, col, icon]) => (
          <View key={lbl} style={s.statItem}>
            <MaterialIcons name={icon} size={16} color={col} />
            <Text style={[s.statNum, { color: col }]}>{num}</Text>
            <Text style={s.statLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Driver + alert list */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {alerts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🚨 ACTIVE ALERTS</Text>
            {alerts.map(a => (
              <TouchableOpacity
                key={a._id || a.id}
                style={s.alertCard}
                onPress={() => a.location?.lat && openInMaps(a.location.lat, a.location.lng, a.driverName + ' SOS')}
              >
                <View style={[s.alertDot, { backgroundColor: RED }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.alertName}>{a.driverName} — {(a.alertType||'SOS').toUpperCase()}</Text>
                  <Text style={s.alertLoc}>{a.location?.address || 'Location unavailable'}</Text>
                  <Text style={s.alertTime}>{fmt(a.createdAt)}</Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={BLUE} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {drivers.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🚖 ACTIVE DRIVERS</Text>
            {drivers.map((d, i) => (
              <TouchableOpacity
                key={d.badgeId || i}
                style={s.driverCard}
                onPress={() => d.lat && openInMaps(d.lat, d.lng, d.badgeId)}
              >
                <View style={[s.driverDot, { backgroundColor: GREEN }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.driverName}>{d.badgeId}</Text>
                  <Text style={s.driverLoc}>
                    {d.lat ? parseFloat(d.lat).toFixed(4) + '° N, ' + parseFloat(d.lng).toFixed(4) + '° E' : 'No location'}
                  </Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={BLUE} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {drivers.length === 0 && alerts.length === 0 && (
          <View style={s.emptyBox}>
            <MaterialIcons name="map" size={52} color="#555" />
            <Text style={s.emptyTxt}>No active drivers or alerts</Text>
            <Text style={s.emptySub}>Map data will appear here when drivers are online</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* My location button */}
      {location && (
        <TouchableOpacity
          style={s.myLocBtn}
          onPress={() => openInMaps(myLat, myLng, 'My Location')}
        >
          <MaterialIcons name="my-location" size={22} color="#fff" />
          <Text style={s.myLocTxt}>MY LOCATION</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle:     { fontSize: 15, fontWeight: '900', color: '#111' },
  headerSub:       { fontSize: 10, color: '#888', marginTop: 1 },
  refreshBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  mapContainer:    { height: 300, backgroundColor: '#e0e0e0', position: 'relative' },
  mapLoading:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  alertOverlay:    { position: 'absolute', top: 10, left: 10, backgroundColor: RED, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertOverlayTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  offlineBadge:    { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#333', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statsBar:        { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statItem:        { flex: 1, alignItems: 'center', gap: 2 },
  statNum:         { fontSize: 20, fontWeight: '900' },
  statLbl:         { fontSize: 9, color: '#888', fontWeight: '600' },
  section:         { marginHorizontal: 14, marginTop: 12 },
  sectionTitle:    { fontSize: 11, fontWeight: '800', color: '#888', marginBottom: 8, letterSpacing: 0.5 },
  alertCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: RED, elevation: 1, gap: 10 },
  alertDot:        { width: 10, height: 10, borderRadius: 5 },
  alertName:       { fontSize: 13, fontWeight: '800', color: '#111' },
  alertLoc:        { fontSize: 11, color: '#666', marginTop: 2 },
  alertTime:       { fontSize: 10, color: '#aaa', marginTop: 2 },
  driverCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: GREEN, elevation: 1, gap: 10 },
  driverDot:       { width: 10, height: 10, borderRadius: 5 },
  driverName:      { fontSize: 13, fontWeight: '800', color: '#111' },
  driverLoc:       { fontSize: 11, color: '#666', marginTop: 2 },
  emptyBox:        { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTxt:        { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub:        { fontSize: 12, color: '#888', textAlign: 'center' },
  myLocBtn:        { position: 'absolute', bottom: 20, right: 20, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 8 },
  myLocTxt:        { fontSize: 13, fontWeight: '800', color: '#fff' },
});