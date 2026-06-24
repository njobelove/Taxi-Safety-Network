import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
  RefreshControl, Alert, Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import { getAllAlerts, updateAlertStatus } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GOLD  = '#f5c518';
const GREEN = '#2e7d32';

const ALERT_CONFIG = {
  robbery:  { ico: '⚠',  label: 'ROBBERY',  color: RED,      bg: '#fde8e8' },
  assault:  { ico: '🚨', label: 'ASSAULT',   color: '#e65100',bg: '#fff3e0' },
  accident: { ico: '🚓', label: 'ACCIDENT',  color: BLUE,     bg: '#e8f0fe' },
  medical:  { ico: '➕', label: 'MEDICAL',   color: '#827717',bg: '#f5f5dc' },
  theft:    { ico: '🔒', label: 'THEFT',     color: '#6a1b9a',bg: '#f3e5f5' },
};

export default function PoliceDashboard({ nav }) {
  const { user, token }    = useAuth();
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolving,  setResolving]  = useState(null);
  const [playingId,  setPlayingId]  = useState(null); // which alert is playing
  const [voiceMuted, setVoiceMuted] = useState(false);

  // ── Audio refs ─────────────────────────────────────────────────────────────
  const soundRef      = useRef(null);
  const playQueueRef  = useRef([]); // queue of alerts with voice notes
  const currentIdxRef = useRef(0);
  const loopingRef    = useRef(true);
  const resolvedRef   = useRef(new Set()); // track resolved alert IDs

  // ── Load alerts on mount + auto-refresh ────────────────────────────────────
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => {
      clearInterval(interval);
      stopAllVoice();
    };
  }, []);

  // ── Start voice loop whenever alerts change ────────────────────────────────
  useEffect(() => {
    if (alerts.length > 0 && !voiceMuted) {
      buildQueueAndPlay();
    } else {
      stopAllVoice();
    }
  }, [alerts, voiceMuted]);

  const loadAlerts = async () => {
    try {
      const data = await getAllAlerts();
      const active = (data.alerts || []).filter(
        a => a.status !== 'resolved' && !resolvedRef.current.has(a._id || a.id)
      );
      setAlerts(active);
    } catch (e) {
      console.log('Load alerts error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Build voice queue from alerts that have voice notes ────────────────────
  const buildQueueAndPlay = async () => {
    // Get voice notes saved in localStorage for each driver
    const queue = alerts
      .filter(a => {
        const driverId = a.driverId;
        const voiceKey = `tsn_voice_${driverId}`;
        const voiceUri = localStorage.getItem(voiceKey);
        return !!voiceUri;
      })
      .map(a => ({
        alertId:    a._id || a.id,
        driverId:   a.driverId,
        driverName: a.driverName,
        alertType:  a.alertType,
        voiceUri:   localStorage.getItem(`tsn_voice_${a.driverId}`),
      }));

    playQueueRef.current  = queue;
    currentIdxRef.current = 0;
    loopingRef.current    = true;

    if (queue.length > 0) {
      await stopAllVoice();
      playNextInQueue();
    }
  };

  // ── Play next voice note in queue, then loop ───────────────────────────────
  const playNextInQueue = async () => {
    if (!loopingRef.current) return;
    const queue = playQueueRef.current;
    if (queue.length === 0) return;

    // Remove resolved alerts from queue
    const activeQueue = queue.filter(
      q => !resolvedRef.current.has(q.alertId)
    );
    playQueueRef.current = activeQueue;
    if (activeQueue.length === 0) {
      setPlayingId(null);
      return;
    }

    // Loop index
    if (currentIdxRef.current >= activeQueue.length) {
      currentIdxRef.current = 0;
    }

    const item = activeQueue[currentIdxRef.current];
    currentIdxRef.current++;

    try {
      setPlayingId(item.alertId);

      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      // Stop previous sound
      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch (e) {}
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.voiceUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;

      // When this voice note ends, play next one
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          // Small pause between voice notes then play next
          if (loopingRef.current) {
            setTimeout(() => playNextInQueue(), 2000);
          }
        }
      });

    } catch (e) {
      console.log('Voice play error:', e.message);
      // Try next one
      setTimeout(() => playNextInQueue(), 2000);
    }
  };

  const stopAllVoice = async () => {
    loopingRef.current = false;
    setPlayingId(null);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  const toggleMute = async () => {
    if (voiceMuted) {
      setVoiceMuted(false);
      loopingRef.current = true;
      buildQueueAndPlay();
    } else {
      setVoiceMuted(true);
      await stopAllVoice();
    }
  };

  // ── Resolve alert — removes it from queue + stops its voice ───────────────
  const handleResolve = async (alertId) => {
    Alert.alert(
      'Resolve Alert',
      'Mark this alert as resolved? The voice note will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✓ RESOLVE',
          style: 'destructive',
          onPress: async () => {
            try {
              setResolving(alertId);
              await updateAlertStatus(alertId, 'resolved', null, token);

              // Add to resolved set so voice stops
              resolvedRef.current.add(alertId);

              // Remove from alerts list
              setAlerts(prev => prev.filter(a => (a._id || a.id) !== alertId));

              Alert.alert('✅ Resolved', 'Alert resolved. Voice note stopped.');
            } catch (e) {
              Alert.alert('Error', 'Could not resolve alert.');
            } finally {
              setResolving(null);
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff/60)}h ${diff%60}m ago`;
  };

  const openMaps = (lat, lng) => {
    if (!lat || !lng) return;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}&z=16`);
  };

  // Count alerts with voice notes
  const voiceAlerts = alerts.filter(a =>
    !!localStorage.getItem(`tsn_voice_${a.driverId}`)
  ).length;

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}>
            <Text style={{ fontSize: 17, color: '#fff' }}>🛡</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>TSN POLICE COMMAND</Text>
            <Text style={s.headerSub}>
              {user?.stationName || 'DISTRICT COMMAND'}
            </Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {alerts.length > 0 && (
            <View style={s.alertCountBadge}>
              <Text style={s.alertCountTxt}>{alerts.length}</Text>
            </View>
          )}
          {/* Mute/unmute voice button */}
          <TouchableOpacity style={s.muteBtn} onPress={toggleMute}>
            <Text style={s.muteBtnTxt}>{voiceMuted ? '🔇' : '🔊'}</Text>
            <Text style={s.muteBtnLbl}>{voiceMuted ? 'MUTED' : 'LIVE'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice playback banner */}
      {!voiceMuted && alerts.length > 0 && (
        <View style={[s.voiceBanner, {
          backgroundColor: playingId ? '#1a2e1a' : '#1a1a2e'
        }]}>
          <View style={[s.voicePulse, { backgroundColor: playingId ? '#4caf50' : '#555' }]} />
          <View style={{ flex: 1 }}>
            {playingId ? (
              <>
                <Text style={s.voiceBannerTitle}>
                  🎙 PLAYING VOICE NOTE
                </Text>
                <Text style={s.voiceBannerSub}>
                  {alerts.find(a => (a._id || a.id) === playingId)?.driverName || 'Unknown Driver'}
                  {' — '}
                  {(ALERT_CONFIG[alerts.find(a => (a._id || a.id) === playingId)?.alertType] || {}).label || 'ALERT'}
                </Text>
              </>
            ) : (
              <Text style={s.voiceBannerTitle}>
                🎙 {voiceAlerts > 0
                  ? `Looping ${voiceAlerts} voice note${voiceAlerts > 1 ? 's' : ''} — loading...`
                  : 'No voice notes from drivers yet'}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={toggleMute} style={s.muteInline}>
            <Text style={s.muteInlineTxt}>🔇 MUTE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Muted banner */}
      {voiceMuted && (
        <TouchableOpacity style={s.mutedBanner} onPress={toggleMute}>
          <Text style={s.mutedBannerTxt}>
            🔇 Voice alerts muted — Tap to unmute
          </Text>
        </TouchableOpacity>
      )}

      {/* Station info */}
      <View style={s.stationBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.stationId}>{user?.stationId || '—'}</Text>
          <Text style={s.stationSub}>
            {user?.district || '—'}  ·  {user?.city || '—'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${user?.emergencyLine}`)}>
          <Text style={s.emergencyNum}>📞 {user?.emergencyLine || '—'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsBar}>
        {[
          [alerts.length,                                           'ACTIVE',    RED   ],
          [alerts.filter(a=>a.alertType==='robbery').length,       'ROBBERY',   RED   ],
          [alerts.filter(a=>a.alertType==='accident').length,      'ACCIDENT',  GOLD  ],
          [voiceAlerts,                                            'W/ VOICE',  GREEN ],
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={RED} />
        }
      >
        <View style={s.listHeader}>
          <Text style={s.listTitle}>
            🚨 ACTIVE ALERTS ({alerts.length})
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={s.refreshBtn}>↻ REFRESH</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.listSub}>
          Voice notes loop continuously until alert is resolved · Pull down to refresh
        </Text>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={RED} />
            <Text style={s.loadingTxt}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIco}>✅</Text>
            <Text style={s.emptyTxt}>No active alerts</Text>
            <Text style={s.emptySub}>All clear — pull down to refresh</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const cfg     = ALERT_CONFIG[alert.alertType] || ALERT_CONFIG.theft;
            const alertId = alert._id || alert.id;
            const lat     = alert.location?.lat || alert.location?.latitude;
            const lng     = alert.location?.lng || alert.location?.longitude;
            const hasVoice = !!localStorage.getItem(`tsn_voice_${alert.driverId}`);
            const isPlaying = playingId === alertId;

            return (
              <View
                key={alertId}
                style={[
                  s.alertCard,
                  { borderLeftColor: cfg.color },
                  isPlaying && s.alertCardPlaying,
                ]}
              >
                {/* Playing indicator */}
                {isPlaying && (
                  <View style={s.playingBar}>
                    <View style={s.playingDot} />
                    <Text style={s.playingTxt}>🎙 VOICE NOTE PLAYING NOW</Text>
                  </View>
                )}

                {/* Top row */}
                <View style={s.alertTop}>
                  <View style={[s.alertTag, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.alertTagTxt, { color: cfg.color }]}>
                      {cfg.ico}  {cfg.label}
                    </Text>
                  </View>
                  <Text style={s.alertTime}>{formatTime(alert.timestamp || alert.createdAt)}</Text>
                  <View style={s.activeBadge}>
                    <Text style={s.activeTxt}>● ACTIVE</Text>
                  </View>
                </View>

                {/* Location */}
                <TouchableOpacity onPress={() => openMaps(lat, lng)}>
                  <Text style={s.alertLocation}>
                    📍 {alert.location?.address ||
                      (lat ? `${parseFloat(lat).toFixed(4)}° N, ${parseFloat(lng).toFixed(4)}° E` : 'No location')}
                    {lat ? '  →  tap to open map' : ''}
                  </Text>
                </TouchableOpacity>

                {/* Driver */}
                <View style={s.driverRow}>
                  <View style={s.driverAvatar}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.driverLabel}>DRIVER</Text>
                    <Text style={s.driverName}>{alert.driverName || '—'}</Text>
                    <Text style={s.driverMeta}>
                      🪪 {alert.driverId || '—'}
                      {alert.vehiclePlate ? `  🚗 ${alert.vehiclePlate}` : ''}
                    </Text>
                  </View>
                  {alert.phoneNumber && (
                    <TouchableOpacity
                      style={s.callBtn}
                      onPress={() => Linking.openURL(`tel:${alert.phoneNumber}`)}
                    >
                      <Text>📞</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Voice note badge */}
                <View style={[s.voiceRow, { backgroundColor: hasVoice ? '#e8f5e9' : '#f5f5f5' }]}>
                  <Text style={[s.voiceRowTxt, { color: hasVoice ? GREEN : '#888' }]}>
                    {hasVoice
                      ? (isPlaying ? '🔊 Voice note playing...' : '🎙 Voice note queued — will play shortly')
                      : '🔇 No voice note — driver has not recorded one'}
                  </Text>
                </View>

                {/* Actions */}
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={s.viewBtn}
                    onPress={() => nav('alertDetails')}
                  >
                    <Text style={s.viewBtnTxt}>👁 DETAILS</Text>
                  </TouchableOpacity>

                  {lat && (
                    <TouchableOpacity
                      style={s.mapsBtn}
                      onPress={() => openMaps(lat, lng)}
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

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⊞</Text>
          <Text style={s.navTxtA}>DASHBOARD</Text>
        </View>
        <TouchableOpacity style={s.navItem} onPress={() => nav('liveMap')}>
          <Text style={s.navIco}>🗺</Text>
          <Text style={s.navTxt}>LIVE MAP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => nav('chatBoard')}>
          <Text style={s.navIco}>💬</Text>
          <Text style={s.navTxt}>CHAT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => nav('profileSetup')}>
          <Text style={s.navIco}>👤</Text>
          <Text style={s.navTxt}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f5f5f5' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerLeft:        { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shieldWrap:        { width: 34, height: 34, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:       { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:         { fontSize: 10, color: '#888', marginTop: 1 },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertCountBadge:   { backgroundColor: RED, borderRadius: 12, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  alertCountTxt:     { fontSize: 13, fontWeight: '900', color: '#fff' },
  muteBtn:           { alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  muteBtnTxt:        { fontSize: 18 },
  muteBtnLbl:        { fontSize: 8, fontWeight: '800', color: '#555', marginTop: 1 },
  voiceBanner:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  voicePulse:        { width: 12, height: 12, borderRadius: 6 },
  voiceBannerTitle:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  voiceBannerSub:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  muteInline:        { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  muteInlineTxt:     { fontSize: 11, fontWeight: '700', color: '#fff' },
  mutedBanner:       { backgroundColor: '#333', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  mutedBannerTxt:    { fontSize: 12, color: '#aaa', fontWeight: '600' },
  stationBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 10 },
  stationId:         { fontSize: 15, fontWeight: '900', color: GOLD },
  stationSub:        { fontSize: 11, color: '#aaa', marginTop: 2 },
  emergencyNum:      { fontSize: 12, color: '#fff', fontWeight: '700' },
  statsBar:          { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statItem:          { flex: 1, alignItems: 'center' },
  statNum:           { fontSize: 22, fontWeight: '900' },
  statLbl:           { fontSize: 9, color: '#888', textAlign: 'center', marginTop: 2, fontWeight: '600' },
  statDiv:           { width: 1, backgroundColor: '#eee', marginVertical: 4 },
  listHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  listTitle:         { fontSize: 14, fontWeight: '900', color: '#111' },
  refreshBtn:        { fontSize: 12, color: RED, fontWeight: '700' },
  listSub:           { fontSize: 10, color: '#888', paddingHorizontal: 14, marginBottom: 10 },
  loadingBox:        { alignItems: 'center', padding: 40 },
  loadingTxt:        { color: '#888', marginTop: 12 },
  emptyBox:          { backgroundColor: '#fff', margin: 14, borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIco:          { fontSize: 40 },
  emptyTxt:          { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 12 },
  emptySub:          { fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' },
  alertCard:         { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 2 },
  alertCardPlaying:  { borderWidth: 2, borderColor: GREEN, borderLeftWidth: 4 },
  playingBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, padding: 8, marginBottom: 10, gap: 8 },
  playingDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  playingTxt:        { fontSize: 12, fontWeight: '800', color: GREEN },
  alertTop:          { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap' },
  alertTag:          { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  alertTagTxt:       { fontSize: 11, fontWeight: '700' },
  alertTime:         { fontSize: 11, color: '#666', flex: 1 },
  activeBadge:       { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt:         { fontSize: 10, fontWeight: '800', color: '#fff' },
  alertLocation:     { fontSize: 13, fontWeight: '700', color: BLUE, marginBottom: 10 },
  driverRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 10 },
  driverAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  driverLabel:       { fontSize: 10, color: '#888', fontWeight: '600' },
  driverName:        { fontSize: 14, fontWeight: '800', color: '#111', marginTop: 2 },
  driverMeta:        { fontSize: 11, color: '#666', marginTop: 2 },
  callBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  voiceRow:          { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  voiceRowTxt:       { fontSize: 11, fontWeight: '600' },
  actionRow:         { flexDirection: 'row', gap: 8 },
  viewBtn:           { flex: 1, backgroundColor: BLUE, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  viewBtnTxt:        { fontSize: 11, fontWeight: '800', color: '#fff' },
  mapsBtn:           { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  mapsBtnTxt:        { fontSize: 11, fontWeight: '800', color: '#fff' },
  resolveBtn:        { flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  resolveBtnTxt:     { fontSize: 11, fontWeight: '800', color: '#fff' },
  bottomNav:         { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:         { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:           { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:           { fontSize: 18, color: '#fff' },
  navTxtA:           { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:            { fontSize: 18, color: '#aaa' },
  navTxt:            { fontSize: 9, color: '#aaa', marginTop: 2 },
});
