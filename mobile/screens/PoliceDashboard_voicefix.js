// This is the key fix for voice notes disappearing
// The problem: when alerts reload every 15 seconds, voiceAlertService.start() 
// is called again which restarts the queue and interrupts playback
// Fix: only restart if alerts actually changed

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
  RefreshControl, Alert, Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GOLD  = '#f5c518';
const GREEN = '#2e7d32';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const ALERT_CONFIG = {
  robbery:  { ico: '⚠',  label: 'ROBBERY',  color: RED,      bg: '#fde8e8' },
  assault:  { ico: '🚨', label: 'ASSAULT',   color: '#e65100',bg: '#fff3e0' },
  accident: { ico: '🚓', label: 'ACCIDENT',  color: BLUE,     bg: '#e8f0fe' },
  medical:  { ico: '➕', label: 'MEDICAL',   color: '#827717',bg: '#f5f5dc' },
  theft:    { ico: '🔒', label: 'THEFT',     color: '#6a1b9a',bg: '#f3e5f5' },
  sos:      { ico: '🚨', label: 'SOS',       color: RED,      bg: '#fde8e8' },
};

export default function PoliceDashboard({ nav }) {
  const { user, token } = useAuth();
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolving,  setResolving]  = useState(null);
  const [playingId,  setPlayingId]  = useState(null);
  const [muted,      setMuted]      = useState(false);

  // Audio refs
  const soundRef    = useRef(null);
  const queueRef    = useRef([]);
  const loopingRef  = useRef(false);
  const mutedRef    = useRef(false);
  const resolvedRef = useRef(new Set());
  const alertIdsRef = useRef(''); // track if alerts changed

  useEffect(() => {
    loadAlerts();
    const iv = setInterval(loadAlerts, 15000);
    return () => {
      clearInterval(iv);
      loopingRef.current = false;
      stopSound();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const res  = await fetch(BASE_URL + '/api/alerts');
      const data = await res.json();
      const active = (data.alerts || []).filter(
        a => a.status !== 'resolved' && !resolvedRef.current.has(a._id || a.id)
      );
      setAlerts(active);

      // Only restart voice queue if alerts actually changed
      const newIds = active.map(a => a._id || a.id).join(',');
      if (newIds !== alertIdsRef.current && active.length > 0 && !mutedRef.current) {
        alertIdsRef.current = newIds;
        buildAndPlay(active);
      }
    } catch (e) {
      console.log('Load alerts error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getVoiceUri = (driverId) => {
    try {
      const uri = localStorage.getItem('tsn_voice_' + driverId);
      if (!uri || uri.startsWith('blob:')) return null;
      return uri;
    } catch (e) { return null; }
  };

  const buildAndPlay = async (activeAlerts) => {
    const queue = activeAlerts
      .map(a => ({
        alertId:    a._id || a.id,
        driverId:   a.driverId,
        driverName: a.driverName || 'Unknown',
        alertType:  a.alertType  || 'SOS',
        voiceUri:   getVoiceUri(a.driverId),
      }))
      .filter(q => !!q.voiceUri);

    if (queue.length === 0) return;
    queueRef.current  = queue;
    loopingRef.current = true;
    await stopSound();
    playNext(0);
  };

  const playNext = async (idx) => {
    if (!loopingRef.current || mutedRef.current) return;
    const queue = queueRef.current.filter(
      q => !resolvedRef.current.has(q.alertId)
    );
    if (queue.length === 0) { setPlayingId(null); return; }
    const i    = idx % queue.length;
    const item = queue[i];

    try {
      setPlayingId(item.alertId);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.voiceUri }, { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish || status.error) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          setPlayingId(null);
          if (loopingRef.current && !mutedRef.current) {
            setTimeout(() => playNext(i + 1), 500);
          }
        }
      });
    } catch (e) {
      console.log('Voice error:', e.message);
      soundRef.current = null;
      setPlayingId(null);
      if (loopingRef.current && !mutedRef.current) {
        setTimeout(() => playNext(i + 1), 500);
      }
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
    setPlayingId(null);
  };

  const toggleMute = async () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) {
      loopingRef.current = false;
      await stopSound();
    } else {
      loopingRef.current = true;
      if (alerts.length > 0) buildAndPlay(alerts);
    }
  };

  const handleResolve = async (alertId) => {
    Alert.alert(
      'Resolve Alert',
      'Mark this alert as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✓ RESOLVE',
          onPress: async () => {
            setResolving(alertId);
            try {
              await fetch(BASE_URL + '/api/alerts/' + alertId + '/status', {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
                body: JSON.stringify({ status: 'resolved' }),
              });
            } catch (e) {}
            resolvedRef.current.add(alertId);
            setAlerts(prev => prev.filter(a => (a._id || a.id) !== alertId));
            queueRef.current = queueRef.current.filter(q => q.alertId !== alertId);
            setResolving(null);
          }
        }
      ]
    );
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    return Math.floor(diff / 60) + 'h ' + (diff % 60) + 'm ago';
  };

  const voiceAlerts = alerts.filter(a => !!getVoiceUri(a.driverId)).length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}><Text style={{ fontSize: 17, color: '#fff' }}>🛡</Text></View>
          <View>
            <Text style={s.headerTitle}>TSN POLICE COMMAND</Text>
            <Text style={s.headerSub}>{user?.stationName || 'DISTRICT COMMAND'}</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {alerts.length > 0 && (
            <View style={s.alertCount}>
              <Text style={s.alertCountTxt}>{alerts.length}</Text>
            </View>
          )}
          <TouchableOpacity style={s.muteBtn} onPress={toggleMute}>
            <Text style={s.muteBtnTxt}>{muted ? '🔇' : '🔊'}</Text>
            <Text style={s.muteLbl}>{muted ? 'MUTED' : 'LIVE'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice banner */}
      {!muted && alerts.length > 0 && (
        <View style={[s.voiceBanner, { backgroundColor: playingId ? '#0a1f0a' : '#111' }]}>
          <View style={[s.voiceDot, { backgroundColor: playingId ? GREEN : '#555' }]} />
          <Text style={s.voiceBannerTxt}>
            {playingId
              ? '🎙 Playing: ' + (alerts.find(a => (a._id || a.id) === playingId)?.driverName || 'Driver')
              : voiceAlerts > 0
              ? '🎙 ' + voiceAlerts + ' voice note' + (voiceAlerts > 1 ? 's' : '') + ' queued...'
              : '🔇 No voice notes — drivers need to record in Profile'}
          </Text>
          <TouchableOpacity onPress={toggleMute} style={s.muteBannerBtn}>
            <Text style={{ fontSize: 11, color: '#aaa', fontWeight: '700' }}>🔇 MUTE</Text>
          </TouchableOpacity>
        </View>
      )}

      {muted && (
        <TouchableOpacity style={s.mutedBanner} onPress={toggleMute}>
          <Text style={{ fontSize: 12, color: '#888', fontWeight: '600' }}>
            🔇 Voice alerts muted — Tap to unmute
          </Text>
        </TouchableOpacity>
      )}

      {/* Station bar */}
      <View style={s.stationBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.stationId}>{user?.stationId || '—'}</Text>
          <Text style={s.stationSub}>{user?.district || '—'} · {user?.city || '—'}</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL('tel:' + user?.emergencyLine)}>
          <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>
            📞 {user?.emergencyLine || '—'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsBar}>
        {[
          [alerts.length,                                     'ACTIVE',   RED  ],
          [alerts.filter(a=>a.alertType==='robbery').length,  'ROBBERY',  RED  ],
          [alerts.filter(a=>a.alertType==='accident').length, 'ACCIDENT', GOLD ],
          [voiceAlerts,                                       'W/VOICE',  GREEN],
        ].map(([num, lbl, col], i) => (
          <React.Fragment key={lbl}>
            {i > 0 && <View style={s.statDiv} />}
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: col }]}>{num}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlerts(); }} tintColor={RED} />}
      >
        <View style={s.listHeader}>
          <Text style={s.listTitle}>🚨 ACTIVE ALERTS ({alerts.length})</Text>
          <TouchableOpacity onPress={() => { setRefreshing(true); loadAlerts(); }}>
            <Text style={s.refreshBtn}>↻ REFRESH</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.listSub}>Voice notes loop until resolved · Pull down to refresh</Text>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={RED} />
          </View>
        ) : alerts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#333' }}>No active alerts</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Pull down to refresh</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const cfg     = ALERT_CONFIG[alert.alertType] || ALERT_CONFIG.sos;
            const alertId = alert._id || alert.id;
            const lat     = alert.location?.lat;
            const lng     = alert.location?.lng;
            const isPlay  = playingId === alertId;
            const hasVoice = !!getVoiceUri(alert.driverId);

            return (
              <View key={alertId} style={[s.alertCard, { borderLeftColor: cfg.color }, isPlay && s.alertPlaying]}>
                {isPlay && (
                  <View style={s.playingBar}>
                    <View style={s.playingDot} />
                    <Text style={s.playingTxt}>🎙 VOICE NOTE PLAYING NOW</Text>
                  </View>
                )}
                <View style={s.alertTop}>
                  <View style={[s.alertTag, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.alertTagTxt, { color: cfg.color }]}>{cfg.ico} {cfg.label}</Text>
                  </View>
                  <Text style={s.alertTime}>{formatTime(alert.timestamp || alert.createdAt)}</Text>
                  <View style={s.activeBadge}><Text style={s.activeTxt}>● ACTIVE</Text></View>
                </View>

                <TouchableOpacity onPress={() => lat && Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}>
                  <Text style={s.alertLoc}>
                    📍 {alert.location?.address || (lat ? parseFloat(lat).toFixed(4) + '° N' : 'No location')}
                    {lat ? '  →  tap map' : ''}
                  </Text>
                </TouchableOpacity>

                <View style={s.driverRow}>
                  <View style={s.driverAv}><Text style={{ fontSize: 20 }}>👤</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.driverName}>{alert.driverName || '—'}</Text>
                    <Text style={s.driverMeta}>
                      🪪 {alert.driverId || '—'}
                      {alert.vehiclePlate ? '  🚗 ' + alert.vehiclePlate : ''}
                    </Text>
                  </View>
                  {alert.phoneNumber && (
                    <TouchableOpacity
                      style={s.callBtn}
                      onPress={() => Linking.openURL('tel:' + alert.phoneNumber)}
                    >
                      <Text style={{ fontSize: 20 }}>📞</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[s.voiceRow, { backgroundColor: hasVoice ? '#e8f5e9' : '#f5f5f5' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: hasVoice ? GREEN : '#888' }}>
                    {hasVoice
                      ? (isPlay ? '🔊 Voice note playing now...' : '🎙 Voice note queued — will play shortly')
                      : '🔇 No voice note recorded by this driver'}
                  </Text>
                </View>

                <View style={s.actionRow}>
                  <TouchableOpacity style={s.viewBtn} onPress={() => nav('alertDetails')}>
                    <Text style={s.viewBtnTxt}>👁 DETAILS</Text>
                  </TouchableOpacity>
                  {lat && (
                    <TouchableOpacity
                      style={s.mapsBtn}
                      onPress={() => Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}
                    >
                      <Text style={s.mapsBtnTxt}>🗺 MAP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={s.resolveBtn}
                    onPress={() => handleResolve(alertId)}
                    disabled={resolving === alertId}
                  >
                    {resolving === alertId
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.resolveBtnTxt}>✓ RESOLVE</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⊞</Text><Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        {[
          { ico: '🗺',  lbl: 'LIVE MAP', to: 'liveMap'      },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'    },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup' },
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
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shieldWrap:    { width: 34, height: 34, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:   { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:     { fontSize: 10, color: '#888', marginTop: 1 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertCount:    { backgroundColor: RED, borderRadius: 12, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  alertCountTxt: { fontSize: 13, fontWeight: '900', color: '#fff' },
  muteBtn:       { alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  muteBtnTxt:    { fontSize: 18 },
  muteLbl:       { fontSize: 8, fontWeight: '800', color: '#555', marginTop: 1 },
  voiceBanner:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  voiceDot:      { width: 10, height: 10, borderRadius: 5 },
  voiceBannerTxt:{ flex: 1, fontSize: 12, fontWeight: '700', color: '#fff' },
  muteBannerBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  mutedBanner:   { backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  stationBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 10 },
  stationId:     { fontSize: 15, fontWeight: '900', color: GOLD },
  stationSub:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  statsBar:      { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statItem:      { flex: 1, alignItems: 'center' },
  statNum:       { fontSize: 22, fontWeight: '900' },
  statLbl:       { fontSize: 9, color: '#888', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  statDiv:       { width: 1, backgroundColor: '#eee', marginVertical: 4 },
  listHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  listTitle:     { fontSize: 14, fontWeight: '900', color: '#111' },
  refreshBtn:    { fontSize: 12, color: RED, fontWeight: '700' },
  listSub:       { fontSize: 10, color: '#888', paddingHorizontal: 14, marginBottom: 10 },
  emptyBox:      { backgroundColor: '#fff', margin: 14, borderRadius: 16, padding: 40, alignItems: 'center' },
  alertCard:     { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 2 },
  alertPlaying:  { borderWidth: 2, borderColor: GREEN, borderLeftWidth: 4 },
  playingBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, padding: 8, marginBottom: 10, gap: 8 },
  playingDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  playingTxt:    { fontSize: 12, fontWeight: '800', color: GREEN },
  alertTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap' },
  alertTag:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  alertTagTxt:   { fontSize: 11, fontWeight: '700' },
  alertTime:     { fontSize: 11, color: '#666', flex: 1 },
  activeBadge:   { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt:     { fontSize: 10, fontWeight: '800', color: '#fff' },
  alertLoc:      { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 10 },
  driverRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 10 },
  driverAv:      { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  driverName:    { fontSize: 14, fontWeight: '800', color: '#111' },
  driverMeta:    { fontSize: 11, color: '#666', marginTop: 2 },
  callBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  voiceRow:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  actionRow:     { flexDirection: 'row', gap: 8 },
  viewBtn:       { flex: 1, backgroundColor: BLUE, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  viewBtnTxt:    { fontSize: 11, fontWeight: '800', color: '#fff' },
  mapsBtn:       { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  mapsBtnTxt:    { fontSize: 11, fontWeight: '800', color: '#fff' },
  resolveBtn:    { flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  resolveBtnTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  bottomNav:     { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:     { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:       { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:       { fontSize: 18, color: '#fff' },
  navTxtA:       { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 9, color: '#aaa', marginTop: 2 },
});
