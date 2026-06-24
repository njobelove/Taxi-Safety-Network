import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  Animated, Vibration, Alert,
} from 'react-native';
import { getStats, updateDriverLocation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';

export default function DriverDashboard({ nav, location }) {
  const pulse      = useRef(new Animated.Value(1)).current;
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
    loadStats();
  }, []);

  useEffect(() => {
    if (location && user) {
      updateDriverLocation(
        user?.badgeId || 'TX-YDE-001',
        location.latitude,
        location.longitude,
        location.speed || 0
      ).catch(() => {});
    }
  }, [location]);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {}
  };

  const handleSOSPress = () => {
    Vibration.vibrate([0, 200, 100, 200]);
    nav('emergency');
  };

  const handleSOSLongPress = () => {
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    Alert.alert(
      '🚨 SOS ACTIVATED',
      'Emergency alert is being sent to Central Command!\n\nYour location and ID are being transmitted.',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'CONFIRM SOS', style: 'destructive', onPress: () => nav('disactivation') }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <View>
            <Text style={s.appName}>TAXI SAFETY{'\n'}NETWORK</Text>
            <Text style={s.appFr}>RÉSEAU DE SÉCURITÉ{'\n'}DES TAXIS</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <View style={s.mtnBadge}>
            <Text style={s.mtnTxt}>{user?.network || 'MTN'}{'\n'}CM</Text>
            <Text style={s.mtnArrow}>▶</Text>
          </View>
          <Text style={s.connTxt}>CONNECTED</Text>
          <Text style={{ fontSize: 16, marginTop: 2 }}>📶</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Driver identity card */}
        <View style={s.idRow}>
          <View style={s.idCard}>
            <Text style={s.idLabel}>DRIVER IDENTITY /{'\n'}IDENTITÉ DU CHAUFFEUR</Text>
            <Text style={s.idNum}>{user?.badgeId || 'TX-YDE-001'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>📍</Text>
              <Text style={s.distTxt}>{user?.city || 'Yaoundé'} District</Text>
            </View>
          </View>
          <View style={s.dutyCard}>
            <View style={s.dutyShield}><Text style={{ fontSize: 18, color: '#fff' }}>✔</Text></View>
            <Text style={s.dutyTxt}>ACTIVE{'\n'}DUTY</Text>
            <Text style={s.dutyFr}>EN{'\n'}SERVICE</Text>
          </View>
        </View>

        {/* Live stats */}
        {stats && (
          <View style={s.statsRow}>
            <View style={[s.statMini, { backgroundColor: RED }]}>
              <Text style={s.statMiniNum}>{stats.pendingAlerts || 0}</Text>
              <Text style={s.statMiniLbl}>ACTIVE{'\n'}ALERTS</Text>
            </View>
            <View style={[s.statMini, { backgroundColor: BLUE }]}>
              <Text style={s.statMiniNum}>{stats.resolvedAlerts || 0}</Text>
              <Text style={s.statMiniLbl}>RESOLVED{'\n'}TODAY</Text>
            </View>
            <View style={[s.statMini, { backgroundColor: '#4caf50' }]}>
              <Text style={s.statMiniNum}>{stats.registeredDrivers || 0}</Text>
              <Text style={s.statMiniLbl}>DRIVERS{'\n'}ONLINE</Text>
            </View>
          </View>
        )}

        {/* PANIC BUTTON */}
        <View style={s.panicOuter}>
          <View style={s.diamondGold}>
            <View style={s.diamondInner}>
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <TouchableOpacity
                  style={s.panicBtn}
                  onPress={handleSOSPress}
                  onLongPress={handleSOSLongPress}
                  delayLongPress={3000}
                  activeOpacity={0.88}
                >
                  <Text style={s.panicIco}>📍</Text>
                  <Text style={s.panicTxt}>PANIC</Text>
                  <Text style={s.panicTxt}>BOUTON</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
          <Text style={s.panicHint}>TAP FOR EMERGENCY MENU{'\n'}HOLD 3s FOR INSTANT SOS</Text>
          <Text style={s.panicHintFr}>APPUYER POUR MENU / MAINTENIR 3S POUR SOS</Text>
        </View>

        {/* Quick tiles */}
        <View style={s.tilesCard}>
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => {
              if (location) {
                Alert.alert('Location Shared',
                  `📍 ${location.latitude.toFixed(6)}° N\n${location.longitude.toFixed(6)}° E\n\nLocation sent to Central Command!`
                );
              } else {
                Alert.alert('Location', 'Getting your location...');
              }
            }}>
              <Text style={s.tileIco}>📍</Text>
              <Text style={s.tileTxt}>SHARE{'\n'}LOCATION</Text>
              <Text style={s.tileFr}>PARTAGER{'\n'}POSITION</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => {
              Alert.alert(
                'Emergency Contacts',
                '📞 Police: 117\n📞 Fire: 118\n📞 Ambulance: 15\n📞 TSN Command: +237 6XX XXX XXX',
                [{ text: 'OK' }]
              );
            }}>
              <Text style={s.tileIco}>👤</Text>
              <Text style={s.tileTxt}>EMERGENCY{'\n'}CONTACTS</Text>
              <Text style={s.tileFr}>CONTACTS{'\n'}D'URGENCE</Text>
            </TouchableOpacity>
          </View>
          <View style={s.tileDivH} />
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => nav('statistics')}>
              <View style={s.orgBadge}><Text style={s.orgTxt}>📊</Text></View>
              <Text style={s.tileTxt}>VIEW{'\n'}STATISTICS</Text>
              <Text style={s.tileFr}>STATISTIQUES</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => nav('emergency')}>
              <Text style={s.tileIco}>🚦</Text>
              <Text style={s.tileTxt}>REPORT{'\n'}INCIDENT</Text>
              <Text style={[s.tileFr, { color: RED }]}>SIGNALER INCIDENT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync bar */}
        <View style={s.syncBar}>
          <View style={s.syncDot} />
          <Text style={s.syncTxt}>
            LAST SYNC  {new Date().toLocaleTimeString()}  •  {user?.city || 'Yaoundé'}
          </Text>
          <Text style={{ fontSize: 18 }}>🗺</Text>
        </View>

        {/* Live GPS */}
        {location && (
          <View style={s.gpsCard}>
            <Text style={s.gpsTitle}>📍 LIVE GPS — REAL TIME</Text>
            <Text style={s.gpsCoords}>
              {location.latitude.toFixed(6)}° N,{'  '}
              {location.longitude.toFixed(6)}° E
            </Text>
            <Text style={s.gpsAccuracy}>
              Accuracy: ±{Math.round(location.accuracy || 10)}m  •  SIGNAL: OPTIMAL
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⊞</Text>
          <Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        {[
          { ico: '⚠',  lbl: 'ALERTS',     to: 'emergency'   },
          { ico: '📊', lbl: 'STATS',       to: 'statistics'  },
          { ico: '👤', lbl: 'PROFILE',     to: 'profileSetup'},
        ].map(({ ico, lbl, to }) => (
          <TouchableOpacity key={lbl} style={s.navItem} onPress={() => nav(to)}>
            <Text style={s.navIco}>{ico}</Text>
            <Text style={s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f5f5f5' },
  topBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  topLeft:     { flexDirection: 'row', alignItems: 'center' },
  shieldWrap:  { width: 38, height: 38, borderRadius: 10, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  shieldIco:   { fontSize: 20, color: '#fff' },
  appName:     { fontSize: 13, fontWeight: '900', color: '#111', lineHeight: 16 },
  appFr:       { fontSize: 9, color: '#888', lineHeight: 12, marginTop: 2 },
  topRight:    { alignItems: 'center' },
  mtnBadge:    { flexDirection: 'row', backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  mtnTxt:      { fontSize: 13, fontWeight: '900', color: '#111', lineHeight: 15 },
  mtnArrow:    { fontSize: 10, color: '#333', marginLeft: 4 },
  connTxt:     { fontSize: 9, color: '#555', marginTop: 3, fontWeight: '600' },
  idRow:       { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 6, gap: 12 },
  idCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  idLabel:     { fontSize: 10, fontWeight: '700', color: '#555', lineHeight: 14 },
  idNum:       { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 6 },
  distTxt:     { fontSize: 13, fontWeight: '600', color: BLUE },
  dutyCard:    { width: 100, backgroundColor: '#e8f0fe', borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center' },
  dutyShield:  { width: 32, height: 32, borderRadius: 8, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dutyTxt:     { fontSize: 13, fontWeight: '900', color: BLUE, textAlign: 'center', lineHeight: 16 },
  dutyFr:      { fontSize: 10, color: '#5c7aaa', textAlign: 'center', lineHeight: 14, marginTop: 2 },
  statsRow:    { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  statMini:    { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statMiniNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statMiniLbl: { fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  panicOuter:  { alignItems: 'center', marginVertical: 8 },
  diamondGold: { width: 220, height: 220, backgroundColor: GOLD, transform: [{ rotate: '45deg' }], borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  diamondInner:{ width: 180, height: 180, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  panicBtn:    { width: 160, height: 160, backgroundColor: RED, borderRadius: 5, alignItems: 'center', justifyContent: 'center', shadowColor: RED, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  panicIco:    { fontSize: 36, transform: [{ rotate: '-45deg' }], marginBottom: 4 },
  panicTxt:    { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 26, transform: [{ rotate: '-45deg' }] },
  panicHint:   { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#333', marginTop: 14, lineHeight: 16 },
  panicHintFr: { textAlign: 'center', fontSize: 10, color: '#888', marginTop: 2 },
  tilesCard:   { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  tilesRow:    { flexDirection: 'row' },
  tile:        { flex: 1, padding: 14, alignItems: 'flex-start' },
  tileIco:     { fontSize: 20, marginBottom: 4 },
  tileTxt:     { fontSize: 12, fontWeight: '800', color: '#111', lineHeight: 16 },
  tileFr:      { fontSize: 10, color: '#888', marginTop: 2, lineHeight: 13 },
  tileDivV:    { width: 1, backgroundColor: '#eee', marginVertical: 10 },
  tileDivH:    { height: 1, backgroundColor: '#eee' },
  orgBadge:    { backgroundColor: '#ffe0b2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  orgTxt:      { fontSize: 11, fontWeight: '900', color: '#bf360c' },
  syncBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8 },
  syncDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, marginRight: 8 },
  syncTxt:     { flex: 1, fontSize: 11, color: '#555' },
  gpsCard:     { marginHorizontal: 16, backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14, marginBottom: 8 },
  gpsTitle:    { fontSize: 12, fontWeight: '800', color: '#2e7d32', marginBottom: 6 },
  gpsCoords:   { fontSize: 14, fontFamily: 'monospace', color: '#111', fontWeight: '700' },
  gpsAccuracy: { fontSize: 11, color: '#555', marginTop: 4 },
  bottomNav:   { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:   { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:     { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:     { fontSize: 18, color: '#fff' },
  navTxtA:     { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:      { fontSize: 18, color: '#aaa' },
  navTxt:      { fontSize: 9, color: '#aaa', marginTop: 2 },
});
