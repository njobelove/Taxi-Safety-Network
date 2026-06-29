import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  Animated, Linking, Alert, RefreshControl,
} from 'react-native';
import { getStats, updateDriverLocation, getAllAlerts } from '../services/api';
import { triggerSOS } from '../services/sosService';
import { voiceAlertService } from '../services/voiceAlertService';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const GOLD  = '#f5c518';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';

export default function DriverDashboard({ nav, location }) {
  const pulse      = useRef(new Animated.Value(1)).current;
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

  // ── Pulse animation ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Load data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => {
      clearInterval(interval);
      clearInterval(countRef.current);
      // Stop voice when leaving dashboard
      voiceAlertService.stop();
    };
  }, []);

  // ── Start voice alerts when active alerts load ─────────────────────────────
  useEffect(() => {
    if (activeAlerts.length > 0 && !voiceMuted) {
      // Small delay to ensure audio system ready
      setTimeout(() => {
        voiceAlertService.start(activeAlerts, setPlayingId);
      }, 300);
    } else if (activeAlerts.length === 0) {
      voiceAlertService.stop();
      setPlayingId(null);
    }
  }, [activeAlerts]);

  // ── Update GPS ─────────────────────────────────────────────────────────────
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

  const loadData = async () => {
    try {
      const [statsData, alertsData] = await Promise.all([
        getStats(),
        getAllAlerts(),
      ]);
      setStats(statsData);
      const active = (alertsData.alerts || []).filter(a => a.status !== 'resolved');
      setActiveAlerts(active);
    } catch (e) {}
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleMute = async () => {
    if (voiceMuted) {
      setVoiceMuted(false);
      await voiceAlertService.unmute(activeAlerts);
    } else {
      setVoiceMuted(true);
      await voiceAlertService.mute();
    }
  };

  // ── SOS hold 3 seconds ────────────────────────────────────────────────────
  const handlePressIn = () => {
    pressedRef.current = true;
    let count = 3;
    setSosCountdown(count);
    countRef.current = setInterval(() => {
      count--;
      if (!pressedRef.current) {
        clearInterval(countRef.current);
        setSosCountdown(null);
        return;
      }
      setSosCountdown(count);
      if (count <= 0) {
        clearInterval(countRef.current);
        setSosCountdown(null);
        handleInstantSOS();
      }
    }, 1000);
  };

  const handlePressOut = () => {
    pressedRef.current = false;
    if (countRef.current) {
      clearInterval(countRef.current);
      setSosCountdown(null);
    }
  };

  const handleInstantSOS = async () => {
    if (sosSending) return;
    setSosSending(true);
    await triggerSOS({ user, location, voiceUri, token, nav });
    setSosSending(false);
    loadData();
  };

  const handleTap = () => {
    if (!sosCountdown) nav('emergency');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    return Math.floor(diff / 60) + 'h ago';
  };

  const ALERT_COLORS = {
    robbery: RED, assault: '#e65100', accident: BLUE,
    medical: '#827717', theft: '#6a1b9a', sos: RED,
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <View>
            <Text style={s.appName}>TAXI SAFETY NETWORK</Text>
            <Text style={s.appSub}>{user?.badgeId || '—'}  ·  {user?.city || 'Yaoundé'}</Text>
          </View>
        </View>
        <View style={s.topRight}>
          {/* Voice mute button */}
          <TouchableOpacity style={s.muteBtn} onPress={toggleMute}>
            <Text style={s.muteBtnTxt}>{voiceMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
          <View style={s.mtnBadge}>
            <Text style={s.mtnTxt}>{user?.network || 'MTN'}</Text>
          </View>
        </View>
      </View>

      {/* Voice playing banner */}
      {playingId && !voiceMuted && (
        <View style={s.voiceBanner}>
          <View style={s.voiceDot} />
          <Text style={s.voiceBannerTxt}>
            🎙 Playing voice note from active alert —
            {activeAlerts.find(a => (a._id || a.id) === playingId)?.driverName || 'Driver'}
          </Text>
          <TouchableOpacity onPress={toggleMute}>
            <Text style={s.muteBannerTxt}>🔇 MUTE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Muted banner */}
      {voiceMuted && activeAlerts.length > 0 && (
        <TouchableOpacity style={s.mutedBanner} onPress={toggleMute}>
          <Text style={s.mutedBannerTxt}>
            🔇 Voice alerts muted — Tap to unmute
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={RED} />}
      >
        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            {[
              [stats.pendingAlerts    || 0, 'ACTIVE\nALERTS',  RED  ],
              [stats.resolvedAlerts   || 0, 'RESOLVED',        GREEN],
              [stats.registeredDrivers|| 0, 'DRIVERS\nONLINE', BLUE ],
            ].map(([num, lbl, col], i) => (
              <View key={i} style={[s.statMini, { backgroundColor: col }]}>
                <Text style={s.statNum}>{num}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Active alerts from ALL drivers */}
        {activeAlerts.length > 0 && (
          <View style={s.alertsSection}>
            <View style={s.alertsHeader}>
              <Text style={s.alertsTitle}>
                🚨 {activeAlerts.length} ACTIVE ALERT{activeAlerts.length > 1 ? 'S' : ''}
              </Text>
              <TouchableOpacity onPress={loadData}>
                <Text style={s.refreshTxt}>↻ REFRESH</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.alertsSub}>
              {voiceMuted
                ? '🔇 Voice muted — tap 🔊 to hear voice notes'
                : '🔊 Voice notes playing automatically for each alert'}
            </Text>
            {activeAlerts.map((alert) => {
              const alertId  = alert._id || alert.id;
              const col      = ALERT_COLORS[alert.alertType] || RED;
              const lat      = alert.location?.lat;
              const lng      = alert.location?.lng;
              const isActive = playingId === alertId;
              const hasVoice = !!localStorage.getItem('tsn_voice_' + alert.driverId);

              return (
                <TouchableOpacity
                  key={alertId}
                  style={[
                    s.alertMini,
                    { borderLeftColor: col },
                    isActive && s.alertMiniPlaying,
                  ]}
                  onPress={() => lat && Linking.openURL(
                    'https://maps.google.com?q=' + lat + ',' + lng
                  )}
                >
                  {isActive && (
                    <View style={s.playingRow}>
                      <View style={s.playingDot} />
                      <Text style={s.playingTxt}>🎙 PLAYING NOW</Text>
                    </View>
                  )}
                  <View style={s.alertMiniRow}>
                    <View style={[s.alertDot, { backgroundColor: col }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.alertType}>
                        {alert.alertType?.toUpperCase() || 'SOS'}  ·  {alert.driverName || '—'}
                      </Text>
                      <Text style={s.alertLocation}>
                        📍 {alert.location?.address ||
                          (lat ? parseFloat(lat).toFixed(3) + '° N' : 'No location')}
                      </Text>
                      <View style={s.alertFooter}>
                        <Text style={s.alertTime}>
                          🕐 {formatTime(alert.timestamp || alert.createdAt)}
                        </Text>
                        {hasVoice
                          ? <Text style={s.voiceTag}>🎙 Voice</Text>
                          : <Text style={s.noVoiceTag}>No voice</Text>
                        }
                      </View>
                    </View>
                    <Text style={{ fontSize: 18 }}>🗺</Text>
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
              <View style={s.livePing} />
              <Text style={s.locationTitle}>📍 LIVE LOCATION</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(
                  'https://www.google.com/maps?q=' + location.latitude + ',' + location.longitude + '&z=16'
                )}
                style={s.openMapsBtn}
              >
                <Text style={s.openMapsTxt}>Open Maps →</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.coordsTxt}>
              {location.latitude.toFixed(5)}° N,  {location.longitude.toFixed(5)}° E
            </Text>
          </View>
        )}

        {/* PANIC BUTTON */}
        <View style={s.panicSection}>
          <View style={s.instructBox}>
            <Text style={s.instructTitle}>
              {sosCountdown ? '🔴 HOLD... ' + sosCountdown : sosSending ? '📡 SENDING...' : '🔴 PANIC BUTTON'}
            </Text>
            <Text style={s.instructSub}>
              {sosCountdown
                ? 'Keep holding... SOS fires automatically'
                : 'HOLD 3s = Instant SOS  ·  TAP = Select type'}
            </Text>
          </View>

          <View style={s.panicOuter}>
            <Animated.View style={[s.diamond, {
              backgroundColor: sosCountdown ? RED : GOLD,
              transform: [{ rotate: '45deg' }, { scale: sosCountdown ? 1.05 : 1 }],
            }]}>
              <View style={s.diamondInner}>
                <TouchableOpacity
                  style={[s.panicBtn, (sosCountdown || sosSending) && { backgroundColor: '#8B0000' }]}
                  onPress={handleTap}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <View style={{ transform: [{ rotate: '-45deg' }], alignItems: 'center' }}>
                    {sosSending ? (
                      <><Text style={{ fontSize: 28 }}>📡</Text><Text style={s.panicTxt}>SENDING</Text></>
                    ) : sosCountdown ? (
                      <Text style={[s.panicTxt, { fontSize: 52, fontWeight: '900' }]}>{sosCountdown}</Text>
                    ) : (
                      <><Text style={{ fontSize: 32 }}>🚨</Text><Text style={s.panicTxt}>PANIC</Text><Text style={s.panicTxt}>SOS</Text></>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          <View style={[s.voiceStatus, { backgroundColor: voiceUri ? '#0a1f0a' : '#1a1a1a' }]}>
            <Text style={[s.voiceStatusTxt, { color: voiceUri ? GREEN : '#555' }]}>
              {voiceUri
                ? '🎙 Voice note ready — will broadcast on SOS'
                : '🎙 No voice note — add one in Profile'}
            </Text>
          </View>
        </View>

        {/* Quick tiles */}
        <View style={s.tilesCard}>
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => {
              if (location) {
                Alert.alert('Share Location', location.latitude.toFixed(5) + '° N\n' + location.longitude.toFixed(5) + '° E',
                  [
                    { text: '🗺 Open Maps', onPress: () => Linking.openURL('https://maps.google.com?q=' + location.latitude + ',' + location.longitude) },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }
            }}>
              <Text style={s.tileIco}>📍</Text>
              <Text style={s.tileTxt}>SHARE{'\n'}LOCATION</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => {
              Alert.alert('Emergency Services', 'Select:',
                [
                  { text: '👮 Police: 117',   onPress: () => Linking.openURL('tel:117') },
                  { text: '🚒 Fire: 118',     onPress: () => Linking.openURL('tel:118') },
                  { text: '🚑 Ambulance: 15', onPress: () => Linking.openURL('tel:15')  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}>
              <Text style={s.tileIco}>📞</Text>
              <Text style={s.tileTxt}>EMERGENCY{'\n'}CONTACTS</Text>
            </TouchableOpacity>
          </View>
          <View style={s.tileDivH} />
          <View style={s.tilesRow}>
            <TouchableOpacity style={s.tile} onPress={() => nav('liveMap')}>
              <Text style={s.tileIco}>🗺</Text>
              <Text style={s.tileTxt}>LIVE{'\n'}MAP</Text>
            </TouchableOpacity>
            <View style={s.tileDivV} />
            <TouchableOpacity style={s.tile} onPress={() => nav('chatBoard')}>
              <Text style={s.tileIco}>💬</Text>
              <Text style={s.tileTxt}>COMMUNITY{'\n'}CHAT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⊞</Text>
          <Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        {[
          { ico: '⚠',  lbl: 'ALERTS',  to: 'emergency'    },
          { ico: '💬', lbl: 'CHAT',     to: 'chatBoard'    },
          { ico: '👤', lbl: 'PROFILE',  to: 'profileSetup' },
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
  safe:            { flex: 1, backgroundColor: '#f5f5f5' },
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  topLeft:         { flexDirection: 'row', alignItems: 'center' },
  shieldWrap:      { width: 38, height: 38, borderRadius: 10, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  shieldIco:       { fontSize: 20, color: '#fff' },
  appName:         { fontSize: 12, fontWeight: '900', color: '#111' },
  appSub:          { fontSize: 10, color: '#888', marginTop: 1 },
  topRight:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muteBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  muteBtnTxt:      { fontSize: 18 },
  mtnBadge:        { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  mtnTxt:          { fontSize: 12, fontWeight: '900', color: '#111' },
  voiceBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a1f0a', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  voiceDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  voiceBannerTxt:  { flex: 1, fontSize: 11, fontWeight: '700', color: '#4caf50' },
  muteBannerTxt:   { fontSize: 11, color: '#aaa', fontWeight: '600' },
  mutedBanner:     { backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  mutedBannerTxt:  { fontSize: 12, color: '#888', fontWeight: '600' },
  statsRow:        { flexDirection: 'row', padding: 14, gap: 8 },
  statMini:        { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum:         { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLbl:         { fontSize: 8.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 3, fontWeight: '600' },
  alertsSection:   { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: RED },
  alertsHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertsTitle:     { fontSize: 13, fontWeight: '900', color: RED },
  refreshTxt:      { fontSize: 18, color: RED, fontWeight: '700' },
  alertsSub:       { fontSize: 10, color: '#888', marginBottom: 10 },
  alertMini:       { borderRadius: 10, backgroundColor: '#f9f9f9', padding: 10, marginBottom: 6, borderLeftWidth: 3 },
  alertMiniPlaying:{ borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#f0fff0' },
  playingRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  playingDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  playingTxt:      { fontSize: 11, fontWeight: '800', color: GREEN },
  alertMiniRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDot:        { width: 8, height: 8, borderRadius: 4 },
  alertType:       { fontSize: 12, fontWeight: '800', color: '#111', marginBottom: 2 },
  alertLocation:   { fontSize: 11, color: '#555', marginBottom: 2 },
  alertFooter:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertTime:       { fontSize: 10, color: '#888' },
  voiceTag:        { fontSize: 10, color: GREEN, fontWeight: '700' },
  noVoiceTag:      { fontSize: 10, color: '#aaa' },
  locationCard:    { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#1a2e1a', borderRadius: 14, padding: 14 },
  locationTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  livePing:        { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginRight: 8 },
  locationTitle:   { fontSize: 12, fontWeight: '800', color: GREEN, flex: 1 },
  openMapsBtn:     { backgroundColor: BLUE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  openMapsTxt:     { fontSize: 10, fontWeight: '700', color: '#fff' },
  coordsTxt:       { fontSize: 13, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  panicSection:    { alignItems: 'center', marginVertical: 12, paddingHorizontal: 16 },
  instructBox:     { width: '100%', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  instructTitle:   { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 6 },
  instructSub:     { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 17 },
  panicOuter:      { marginBottom: 14 },
  diamond:         { width: 200, height: 200, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  diamondInner:    { width: 165, height: 165, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  panicBtn:        { width: 148, height: 148, backgroundColor: RED, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 10 },
  panicTxt:        { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  voiceStatus:     { width: '100%', borderRadius: 10, padding: 10, alignItems: 'center' },
  voiceStatusTxt:  { fontSize: 12, fontWeight: '600' },
  tilesCard:       { marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  tilesRow:        { flexDirection: 'row' },
  tile:            { flex: 1, padding: 16, alignItems: 'center' },
  tileIco:         { fontSize: 24, marginBottom: 6 },
  tileTxt:         { fontSize: 11, fontWeight: '800', color: '#111', textAlign: 'center', lineHeight: 16 },
  tileDivV:        { width: 1, backgroundColor: '#eee', marginVertical: 10 },
  tileDivH:        { height: 1, backgroundColor: '#eee' },
  bottomNav:       { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:       { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:         { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:         { fontSize: 18, color: '#fff' },
  navTxtA:         { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:          { fontSize: 18, color: '#aaa' },
  navTxt:          { fontSize: 9, color: '#aaa', marginTop: 2 },
});