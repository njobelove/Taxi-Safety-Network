import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Linking, ScrollView,
} from 'react-native';
import { getLiveDrivers, updateLiveLocation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

export default function LiveMapScreen({ nav, location }) {
  const { user, role } = useAuth();
  const [drivers,     setDrivers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sharing,     setSharing]     = useState(false);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const intervalRef = useRef(null);
  const shareRef    = useRef(null);

  useEffect(() => {
    loadDrivers();
    // Refresh driver list every 10 seconds
    intervalRef.current = setInterval(loadDrivers, 10000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(shareRef.current);
    };
  }, []);

  // Auto-share location when enabled
  useEffect(() => {
    if (sharing && location) {
      shareLiveLocation();
      shareRef.current = setInterval(() => {
        if (location) shareLiveLocation();
      }, 5000);
    } else {
      clearInterval(shareRef.current);
    }
    return () => clearInterval(shareRef.current);
  }, [sharing, location]);

  const loadDrivers = async () => {
    try {
      const data = await getLiveDrivers();
      setDrivers(data.drivers || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.log('Load drivers error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const shareLiveLocation = async () => {
    if (!location || !user) return;
    try {
      await updateLiveLocation({
        driverId:     user?.badgeId || user?.stationId || 'unknown',
        driverName:   user?.fullName || user?.stationName || 'Unknown',
        lat:          location.latitude,
        lng:          location.longitude,
        speed:        location.speed || 0,
        heading:      location.heading || 0,
        vehiclePlate: user?.vehiclePlate || '',
        network:      user?.network || 'MTN',
      });
    } catch (e) {
      console.log('Share location error:', e.message);
    }
  };

  const toggleSharing = () => {
    if (!sharing) {
      setSharing(true);
      Alert.alert('📍 Location Sharing ON', 'Your live location is now visible to all TSN drivers and police stations.');
    } else {
      setSharing(false);
      Alert.alert('📍 Location Sharing OFF', 'Your location is no longer being shared.');
    }
  };

  const openGoogleMaps = (lat, lng, name) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=16`;
    Linking.openURL(url);
  };

  const openAllDriversMap = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location access first.');
      return;
    }
    // Build Google Maps URL with all drivers as waypoints
    const myLat = location.latitude;
    const myLng = location.longitude;
    const url = `https://www.google.com/maps/@${myLat},${myLng},14z`;
    Linking.openURL(url);
  };

  const activeDrivers = drivers.filter(d => d.active !== false);
  const myId = user?.badgeId || user?.stationId;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(role === 'police' ? 'policeDashboard' : 'driverDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>🗺 Live Driver Map</Text>
          <Text style={s.headerSub}>{activeDrivers.length} drivers online · Updated {lastUpdate || '—'}</Text>
        </View>
        <TouchableOpacity onPress={loadDrivers}>
          <Text style={s.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Share toggle */}
      <TouchableOpacity
        style={[s.shareBanner, { backgroundColor: sharing ? GREEN : '#333' }]}
        onPress={toggleSharing}
      >
        <View style={[s.shareDot, { backgroundColor: sharing ? '#4caf50' : '#888' }]} />
        <Text style={s.shareTxt}>
          {sharing
            ? '📍 YOUR LOCATION IS BEING SHARED LIVE — Tap to stop'
            : '📍 TAP TO SHARE YOUR LIVE LOCATION with all TSN drivers'}
        </Text>
      </TouchableOpacity>

      {/* My location */}
      {location && (
        <View style={s.myLocationCard}>
          <View style={s.myLocationLeft}>
            <Text style={s.myLocationTitle}>📍 MY CURRENT LOCATION</Text>
            <Text style={s.myLocationCoords}>
              {location.latitude.toFixed(5)}° N,  {location.longitude.toFixed(5)}° E
            </Text>
            <Text style={s.myLocationAccuracy}>
              Accuracy: ±{Math.round(location.accuracy || 10)}m
              {sharing ? '  ·  🟢 SHARING LIVE' : '  ·  ⚫ NOT SHARING'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.openMapsBtn}
            onPress={() => openGoogleMaps(location.latitude, location.longitude, 'My Location')}
          >
            <Text style={s.openMapsTxt}>🗺</Text>
            <Text style={s.openMapsLabel}>Open{'\n'}Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Google Maps embed link */}
      <TouchableOpacity style={s.fullMapBtn} onPress={openAllDriversMap}>
        <Text style={s.fullMapBtnTxt}>🗺 OPEN FULL LIVE MAP IN GOOGLE MAPS →</Text>
      </TouchableOpacity>

      {/* Driver list */}
      <ScrollView style={s.driverList} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>
          🚖 LIVE DRIVERS ({activeDrivers.length})
        </Text>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={s.loadingTxt}>Loading live drivers...</Text>
          </View>
        ) : activeDrivers.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIco}>🚖</Text>
            <Text style={s.emptyTxt}>No drivers sharing location</Text>
            <Text style={s.emptySub}>Enable location sharing above to appear on the map</Text>
          </View>
        ) : (
          activeDrivers.map((driver) => {
            const isMe = driver.driverId === myId;
            const dist = location
              ? getDistance(location.latitude, location.longitude, driver.lat, driver.lng)
              : null;

            return (
              <View key={driver.driverId} style={[s.driverCard, isMe && s.driverCardMe]}>
                {/* Status dot */}
                <View style={[s.driverStatusDot, { backgroundColor: isMe ? GOLD : GREEN }]} />

                <View style={s.driverInfo}>
                  <View style={s.driverTopRow}>
                    <Text style={s.driverName}>
                      {isMe ? '👤 YOU — ' : '🚖 '}{driver.driverName}
                    </Text>
                    {isMe && <View style={s.meBadge}><Text style={s.meBadgeTxt}>ME</Text></View>}
                  </View>
                  <Text style={s.driverId}>Badge: {driver.driverId}</Text>
                  {driver.vehiclePlate && (
                    <Text style={s.driverPlate}>🚗 {driver.vehiclePlate}</Text>
                  )}
                  <Text style={s.driverCoords}>
                    📍 {driver.lat?.toFixed(4)}° N, {driver.lng?.toFixed(4)}° E
                  </Text>
                  {dist !== null && (
                    <Text style={s.driverDist}>
                      📏 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} away
                    </Text>
                  )}
                  <Text style={s.driverTime}>
                    🕐 Last seen: {new Date(driver.lastSeen).toLocaleTimeString()}
                    {driver.speed > 0 ? `  ·  🏎 ${Math.round(driver.speed)}km/h` : ''}
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={s.driverActions}>
                  <TouchableOpacity
                    style={s.mapPin}
                    onPress={() => openGoogleMaps(driver.lat, driver.lng, driver.driverName)}
                  >
                    <Text style={s.mapPinIco}>🗺</Text>
                    <Text style={s.mapPinTxt}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        {(role === 'driver' ? [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'emergency'       },
          { ico: '🗺', lbl: 'MAP',       to: 'liveMap'         },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
        ] : [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'policeDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'policeDashboard' },
          { ico: '🗺', lbl: 'MAP',       to: 'liveMap'         },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
        ]).map(({ ico, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'MAP' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <Text style={lbl === 'MAP' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'MAP' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Calculate distance between two GPS points in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  back:            { fontSize: 22, color: RED, fontWeight: '600', marginRight: 12 },
  headerMid:       { flex: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 10, color: '#888', marginTop: 1 },
  refreshBtn:      { fontSize: 24, color: GREEN, fontWeight: '700' },
  shareBanner:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  shareDot:        { width: 10, height: 10, borderRadius: 5 },
  shareTxt:        { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff', lineHeight: 17 },
  myLocationCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', margin: 12, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#222' },
  myLocationLeft:  { flex: 1 },
  myLocationTitle: { fontSize: 11, fontWeight: '800', color: GREEN, letterSpacing: 0.5, marginBottom: 4 },
  myLocationCoords:{ fontSize: 13, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  myLocationAccuracy:{ fontSize: 10, color: '#888', marginTop: 4 },
  openMapsBtn:     { backgroundColor: BLUE, borderRadius: 12, padding: 12, alignItems: 'center', marginLeft: 12 },
  openMapsTxt:     { fontSize: 22 },
  openMapsLabel:   { fontSize: 9, color: '#fff', fontWeight: '700', textAlign: 'center', marginTop: 2 },
  fullMapBtn:      { backgroundColor: BLUE, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  fullMapBtnTxt:   { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  driverList:      { flex: 1, paddingHorizontal: 12 },
  sectionTitle:    { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  loadingBox:      { alignItems: 'center', paddingVertical: 40 },
  loadingTxt:      { color: '#888', marginTop: 12 },
  emptyBox:        { alignItems: 'center', paddingVertical: 50 },
  emptyIco:        { fontSize: 48, marginBottom: 12 },
  emptyTxt:        { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub:        { fontSize: 12, color: '#444', marginTop: 6, textAlign: 'center' },
  driverCard:      { backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#222' },
  driverCardMe:    { borderColor: GOLD, backgroundColor: '#1a1500' },
  driverStatusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  driverInfo:      { flex: 1 },
  driverTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  driverName:      { fontSize: 14, fontWeight: '800', color: '#fff' },
  meBadge:         { backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  meBadgeTxt:      { fontSize: 9, fontWeight: '900', color: '#111' },
  driverId:        { fontSize: 11, color: '#888', marginBottom: 2 },
  driverPlate:     { fontSize: 11, color: '#aaa', marginBottom: 2 },
  driverCoords:    { fontSize: 11, color: '#4caf50', fontFamily: 'monospace', marginBottom: 2 },
  driverDist:      { fontSize: 11, color: BLUE, fontWeight: '700', marginBottom: 2 },
  driverTime:      { fontSize: 10, color: '#666' },
  driverActions:   { marginLeft: 10 },
  mapPin:          { backgroundColor: BLUE, borderRadius: 10, padding: 10, alignItems: 'center' },
  mapPinIco:       { fontSize: 20 },
  mapPinTxt:       { fontSize: 9, color: '#fff', fontWeight: '700', marginTop: 2 },
  bottomNav:       { flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222', paddingVertical: 10 },
  navActive:       { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:         { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:         { fontSize: 18, color: '#fff' },
  navTxtA:         { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:          { fontSize: 18, color: '#666' },
  navTxt:          { fontSize: 9, color: '#666', marginTop: 2 },
});
