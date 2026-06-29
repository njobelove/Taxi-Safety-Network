import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  Animated, Linking, Alert, RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getStats, updateDriverLocation, getAllAlerts } from '../services/api';
import { triggerSOS } from '../services/sosService';
import { voiceAlertService } from '../services/voiceAlertService';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const GOLD  = '#f5c518';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';

export default function DriverDashboard({ nav, location }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const { user, token, voiceUri } = useAuth();
  const [stats,        setStats]        = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosSending,   setSosSending]   = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [playingId,    setPlayingId]    = useState(null);
  const [voiceMuted,   setVoiceMuted]   = useState(false);
  const countRef   = useRef(null);
  const pressedRef = useRef(false);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
    loadData();
    const iv = setInterval(loadData, 15000);
    return () => { clearInterval(iv); clearInterval(countRef.current); voiceAlertService.stop(); };
  }, []);

  useEffect(() => {
    if (activeAlerts.length > 0 && !voiceMuted) {
      setTimeout(() => voiceAlertService.start(activeAlerts, setPlayingId), 300);
    } else if (activeAlerts.length === 0) {
      voiceAlertService.stop(); setPlayingId(null);
    }
  }, [activeAlerts]);

  useEffect(() => {
    if (location && user) {
      updateDriverLocation(user?.badgeId || 'TX-YDE-001', location.latitude, location.longitude, location.speed || 0).catch(() => {});
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [statsData, alertsData] = await Promise.all([getStats(), getAllAlerts()]);
      setStats(statsData);
      setActiveAlerts((alertsData.alerts || []).filter(a => a.status !== 'resolved'));
    } catch (e) {}
    setRefreshing(false);
  };

  const toggleMute = async () => {
    if (voiceMuted) { setVoiceMuted(false); await voiceAlertService.unmute(activeAlerts); }
    else { setVoiceMuted(true); await voiceAlertService.mute(); }
  };

  const handlePressIn = () => {
    pressedRef.current = true;
    let count = 3;
    setSosCountdown(count);
    countRef.current = setInterval(() => {
      count--;
      if (!pressedRef.current) { clearInterval(countRef.current); setSosCountdown(null); return; }
      setSosCountdown(count);
      if (count <= 0) { clearInterval(countRef.current); setSosCountdown(null); handleInstantSOS(); }
    }, 1000);
  };

  const handlePressOut = () => {
    pressedRef.current = false;
    if (countRef.current) { clearInterval(countRef.current); setSosCountdown(null); }
  };

  const handleInstantSOS = async () => {
    if (sosSending) return;
    setSosSending(true);
    await triggerSOS({ user, location, voiceUri, token, nav });
    setSosSending(false);
    loadData();
  };

  const fmt = (ts) => {
    if (!ts) return '';
    const d = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (d < 1) return 'Just now';
    if (d < 60) return d + 'm ago';
    return Math.floor(d / 60) + 'h ago';
  };

  const ALERT_COLORS = { robbery: RED, assault: '#e65100', accident: BLUE, medical: '#827717', theft: '#6a1b9a', sos: RED };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <View style={s.shieldWrap}>
            <Ionicons name="shield-checkmark" size={22} color="#fff" />
          </View>
          <View>
            <Text style={s.appName}>TAXI SAFETY NETWORK</Text>
            <Text style={s.appSub}>{user?.badgeId || '—'}  ·  {user?.city || 'Yaoundé'}</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <TouchableOpacity style={s.muteBtn} onPress={toggleMute}>
            <MaterialIcons name={voiceMuted ? 'volume-off' : 'volume-up'} size={22} color={voiceMuted ? '#888' : GREEN} />
          </TouchableOpacity>
          <View style={s.networkBadge}>
            <Text style={s.networkTxt}>{user?.network || 'MTN'}</Text>
          </View>
        </View>
      </View>

      {/* Voice banner */}
      {playingId && !voiceMuted && (
        <View style={s.voiceBanner}>
          <MaterialIcons name="graphic-eq" size={16} color={GREEN} />
          <Text style={s.voiceBannerTxt}>
            Playing: {activeAlerts.find(a => (a._id||a.id) === playingId)?.driverName || 'Driver'}
          </Text>
          <TouchableOpacity onPress={toggleMute}>
            <MaterialIcons name="volume-off" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>
      )}
      {voiceMuted && activeAlerts.length > 0 && (
        <TouchableOpacity style={s.mutedBanner} onPress={toggleMute}>
          <MaterialIcons name="volume-off" size={16} color="#888" />
          <Text style={s.mutedBannerTxt}>Voice alerts muted — Tap to unmute</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={RED} />}>

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            {[
              [stats.pendingAlerts || 0,     'ACTIVE\nALERTS',  RED,   'notifications-active'],
              [stats.resolvedAlerts || 0,    'RESOLVED',        GREEN, 'check-circle'        ],
              [stats.registeredDrivers || 0, 'DRIVERS\nONLINE', BLUE,  'directions-car'      ],
            ].map(([num, lbl, col, icon], i) => (
              <View key={i} style={[s.statMini, { backgroundColor: col }]}>
                <MaterialIcons name={icon} size={18} color="rgba(255,255,255,0.8)" />
                <Text style={s.statNum}>{num}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Active alerts */}
        {activeAlerts.length > 0 && (
          <View style={s.alertsSection}>
            <View style={s.alertsHeader}>
              <MaterialIcons name="warning" size={18} color={RED} />
              <Text style={s.alertsTitle}>{activeAlerts.length} ACTIVE ALERT{activeAlerts.length > 1 ? 'S' : ''}</Text>
              <TouchableOpacity onPress={loadData}>
                <MaterialIcons name="refresh" size={22} color={RED} />
              </TouchableOpacity>
            </View>
            {activeAlerts.slice(0, 3).map((alert) => {
              const alertId  = alert._id || alert.id;
              const col      = ALERT_COLORS[alert.alertType] || RED;
              const lat      = alert.location?.lat;
              const lng      = alert.location?.lng;
              const isPlaying = playingId === alertId;
              return (
                <TouchableOpacity
                  key={alertId}
                  style={[s.alertMini, { borderLeftColor: col }, isPlaying && s.alertMiniPlaying]}
                  onPress={() => lat && Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}
                >
                  {isPlaying && (
                    <View style={s.playingRow}>
                      <MaterialIcons name="graphic-eq" size={14} color={GREEN} />
                      <Text style={s.playingTxt}>PLAYING NOW</Text>
                    </View>
                  )}
                  <View style={s.alertMiniRow}>
                    <View style={[s.alertDot, { backgroundColor: col }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.alertType}>{(alert.alertType || 'SOS').toUpperCase()}  ·  {alert.driverName || '—'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="location-on" size={12} color="#555" />
                        <Text style={s.alertLocation}>{alert.location?.address || (lat ? parseFloat(lat).toFixed(3) + '° N' : 'No location')}</Text>
                      </View>
                      <View style={s.alertFooter}>
                        <MaterialIcons name="access-time" size={11} color="#888" />
                        <Text style={s.alertTime}>{fmt(alert.timestamp || alert.createdAt)}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="map" size={22} color={BLUE} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* GPS */}
        {location && (
          <View style={s.locationCard}>
            <View style={s.locationTop}>
              <MaterialIcons name="gps-fixed" size={14} color={GREEN} />
              <Text style={s.locationTitle}>LIVE LOCATION</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://www.google.com/maps?q=' + location.latitude + ',' + location.longitude)}
                style={s.openMapsBtn}
              >
                <MaterialIcons name="open-in-new" size={12} color="#fff" />
                <Text style={s.openMapsTxt}>Maps</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.coordsTxt}>{location.latitude.toFixed(5)}° N,  {location.longitude.toFixed(5)}° E</Text>
          </View>
        )}

        {/* PANIC BUTTON */}
        <View style={s.panicSection}>
          <View style={s.instructBox}>
            <Text style={s.instructTitle}>
              {sosCountdown ? 'HOLD... ' + sosCountdown : sosSending ? 'SENDING...' : 'PANIC BUTTON'}
            </Text>
            <Text style={s.instructSub}>HOLD 3s = Instant SOS  ·  TAP = Select type</Text>
          </View>

          <Animated.View style={[s.diamond, {
            backgroundColor: sosCountdown ? RED : GOLD,
            transform: [{ rotate: '45deg' }, { scale: sosCountdown ? 1.05 : 1 }],
          }]}>
            <View style={s.diamondInner}>
              <TouchableOpacity
                style={[s.panicBtn, (sosCountdown || sosSending) && { backgroundColor: '#8B0000' }]}
                onPress={() => { if (!sosCountdown) nav('emergency'); }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
              >
                <View style={{ transform: [{ rotate: '-45deg' }], alignItems: 'center' }}>
                  {sosSending ? (
                    <><MaterialIcons name="wifi-tethering" size={36} color="#fff" /><Text style={s.panicTxt}>SENDING</Text></>
                  ) : sosCountdown ? (
                    <Text style={[s.panicTxt, { fontSize: 52, fontWeight: '900' }]}>{sosCountdown}</Text>
                  ) : (
                    <><MaterialIcons name="sos" size={40} color="#fff" /><Text style={s.panicTxt}>PANIC</Text></>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={[s.voiceStatus, { backgroundColor: voiceUri ? '#0a1f0a' : '#1a1a1a' }]}>
            <MaterialIcons name={voiceUri ? 'mic' : 'mic-off'} size={16} color={voiceUri ? GREEN : '#555'} />
            <Text style={[s.voiceStatusTxt, { color: voiceUri ? GREEN : '#555' }]}>
              {voiceUri ? 'Voice note ready — will broadcast on SOS' : 'No voice note — add one in Profile'}
            </Text>
          </View>
        </View>

        {/* Quick tiles */}
        <View style={s.tilesCard}>
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => {
              if (location) {
                Alert.alert('Share Location', location.latitude.toFixed(5) + '° N\n' + location.longitude.toFixed(5) + '° E',
                  [{ text: 'Open Maps', onPress: () => Linking.openURL('https://maps.google.com?q=' + location.latitude + ',' + location.longitude) },
                   { text: 'Cancel', style: 'cancel' }]
                );
              }
            }}>
              <MaterialIcons name="location-on" size={28} color={BLUE} />
              <Text style={s.tileTxt}>SHARE{'\n'}LOCATION</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => {
              Alert.alert('Emergency Services', 'Select:',
                [{ text: 'Police: 117',   onPress: () => Linking.openURL('tel:117') },
                 { text: 'Fire: 118',     onPress: () => Linking.openURL('tel:118') },
                 { text: 'Ambulance: 15', onPress: () => Linking.openURL('tel:15')  },
                 { text: 'Cancel', style: 'cancel' }]
              );
            }}>
              <MaterialIcons name="local-phone" size={28} color={RED} />
              <Text style={s.tileTxt}>EMERGENCY{'\n'}CONTACTS</Text>
            </TouchableOpacity>
          </View>
          <View style={s.tileDivH} />
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => nav('liveMap')}>
              <MaterialIcons name="map" size={28} color={GREEN} />
              <Text style={s.tileTxt}>LIVE{'\n'}MAP</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => nav('chatBoard')}>
              <MaterialIcons name="chat" size={28} color="#8B4513" />
              <Text style={s.tileTxt}>COMMUNITY{'\n'}CHAT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <MaterialIcons name="dashboard" size={22} color="#fff" />
          <Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        {[
          { icon: 'warning',  lbl: 'ALERTS',  to: 'emergency'    },
          { icon: 'chat',     lbl: 'CHAT',     to: 'chatBoard'    },
          { icon: 'person',   lbl: 'PROFILE',  to: 'profileSetup' },
        ].map(({ icon, lbl, to }) => (
          <TouchableOpacity key={lbl} style={s.navItem} onPress={() => nav(to)}>
            <MaterialIcons name={icon} size={22} color="#aaa" />
            <Text style={s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f5f5f5' },
  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  topLeft:          { flexDirection: 'row', alignItems: 'center' },
  shieldWrap:       { width: 40, height: 40, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  appName:          { fontSize: 12, fontWeight: '900', color: '#111' },
  appSub:           { fontSize: 10, color: '#888', marginTop: 1 },
  topRight:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muteBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  networkBadge:     { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  networkTxt:       { fontSize: 12, fontWeight: '900', color: '#111' },
  voiceBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a1f0a', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  voiceBannerTxt:   { flex: 1, fontSize: 11, fontWeight: '700', color: '#4caf50' },
  mutedBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  mutedBannerTxt:   { fontSize: 12, color: '#888', fontWeight: '600' },
  statsRow:         { flexDirection: 'row', padding: 14, gap: 8 },
  statMini:         { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  statNum:          { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLbl:          { fontSize: 8.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  alertsSection:    { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: RED },
  alertsHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  alertsTitle:      { fontSize: 13, fontWeight: '900', color: RED, flex: 1 },
  alertMini:        { borderRadius: 10, backgroundColor: '#f9f9f9', padding: 10, marginBottom: 6, borderLeftWidth: 3 },
  alertMiniPlaying: { borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#f0fff0' },
  playingRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  playingTxt:       { fontSize: 11, fontWeight: '800', color: GREEN },
  alertMiniRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDot:         { width: 8, height: 8, borderRadius: 4 },
  alertType:        { fontSize: 12, fontWeight: '800', color: '#111', marginBottom: 4 },
  alertLocation:    { fontSize: 11, color: '#555', flex: 1 },
  alertFooter:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  alertTime:        { fontSize: 10, color: '#888' },
  locationCard:     { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#1a2e1a', borderRadius: 14, padding: 14 },
  locationTop:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  locationTitle:    { fontSize: 12, fontWeight: '800', color: GREEN, flex: 1 },
  openMapsBtn:      { backgroundColor: BLUE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  openMapsTxt:      { fontSize: 10, fontWeight: '700', color: '#fff' },
  coordsTxt:        { fontSize: 13, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  panicSection:     { alignItems: 'center', marginVertical: 12, paddingHorizontal: 16 },
  instructBox:      { width: '100%', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  instructTitle:    { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 6 },
  instructSub:      { fontSize: 11, color: '#888', textAlign: 'center' },
  diamond:          { width: 200, height: 200, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  diamondInner:     { width: 165, height: 165, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  panicBtn:         { width: 148, height: 148, backgroundColor: RED, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 10 },
  panicTxt:         { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  voiceStatus:      { width: '100%', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceStatusTxt:   { fontSize: 12, fontWeight: '600', flex: 1 },
  tilesCard:        { marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  tilesRow:         { flexDirection: 'row' },
  tile:             { flex: 1, padding: 16, alignItems: 'center', gap: 6 },
  tileTxt:          { fontSize: 11, fontWeight: '800', color: '#111', textAlign: 'center', lineHeight: 16 },
  tileDivV:         { width: 1, backgroundColor: '#eee', marginVertical: 10 },
  tileDivH:         { height: 1, backgroundColor: '#eee' },
  bottomNav:        { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:        { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:          { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navTxtA:          { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navTxt:           { fontSize: 9, color: '#aaa', marginTop: 2 },
});