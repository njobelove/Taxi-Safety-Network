import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { saveVoiceProfile, getDriverByBadge } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';

export default function ProfileSetupScreen({ nav }) {
  const { user, userType } = useAuth();
  const [autoFallback, setAutoFallback] = useState(true);
  const [triggerPhrase, setTriggerPhrase] = useState('Mbolo Police');

  // ── Recording state ──────────────────────────────────────────────────────────
  const [recording,       setRecording]       = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle | recording | recorded | saving | saved
  const [recordingUri,    setRecordingUri]     = useState(null);
  const [sound,           setSound]           = useState(null);
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [waveAnim,        setWaveAnim]        = useState(Array(20).fill(20));
  const waveInterval = useRef(null);

  // Load existing voice profile
  useEffect(() => {
    if (user?.voice_profile?.trigger_phrase) {
      setTriggerPhrase(user.voice_profile.trigger_phrase);
    }
    if (user?.voice_profile?.recording_uri) {
      setRecordingUri(user.voice_profile.recording_uri);
      setRecordingStatus('saved');
    }
  }, []);

  // Animate waveform while recording
  useEffect(() => {
    if (recordingStatus === 'recording') {
      waveInterval.current = setInterval(() => {
        setWaveAnim(Array(20).fill(0).map(() => Math.floor(Math.random() * 55) + 15));
      }, 100);
    } else {
      clearInterval(waveInterval.current);
      setWaveAnim(Array(20).fill(20));
    }
    return () => clearInterval(waveInterval.current);
  }, [recordingStatus]);

  // ── Request mic permission ───────────────────────────────────────────────────
  const requestPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone Required', 'Please allow microphone access to record your voice trigger phrase.');
      return false;
    }
    return true;
  };

  // ── Start recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    const granted = await requestPermission();
    if (!granted) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setRecordingStatus('recording');
    } catch (e) {
      Alert.alert('Recording Error', 'Could not start recording. Try again.');
    }
  };

  // ── Stop recording ───────────────────────────────────────────────────────────
  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setRecordingStatus('recorded');
    } catch (e) {
      Alert.alert('Error', 'Could not stop recording.');
      setRecordingStatus('idle');
    }
  };

  // ── Play back recording ──────────────────────────────────────────────────────
  const playRecording = async () => {
    if (!recordingUri) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      return;
    }
    try {
      const { sound: s } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(s);
      setIsPlaying(true);
      await s.playAsync();
      s.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setSound(null);
        }
      });
    } catch (e) {
      Alert.alert('Playback Error', 'Could not play the recording.');
    }
  };

  // ── Save voice profile to MongoDB ────────────────────────────────────────────
  const saveProfile = async () => {
    if (!recordingUri) {
      Alert.alert('No Recording', 'Please record your trigger phrase first.');
      return;
    }
    setRecordingStatus('saving');
    try {
      await saveVoiceProfile(user.badge_id, triggerPhrase, recordingUri);
      setRecordingStatus('saved');
      Alert.alert(
        '✅ Voice Profile Saved',
        `Your trigger phrase "${triggerPhrase}" has been saved. The system will recognise your voice and automatically send an alert.`
      );
    } catch (e) {
      setRecordingStatus('recorded');
      Alert.alert('Error', 'Could not save voice profile. Try again.');
    }
  };

  const resetRecording = () => {
    setRecordingUri(null);
    setRecording(null);
    setRecordingStatus('idle');
    if (sound) { sound.unloadAsync(); setSound(null); }
    setIsPlaying(false);
  };

  const phrases = ['Mbolo Police', 'Appel Urgence', 'SOS Cameroun', 'Police Secours'];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <View style={s.shieldWrap}><Text style={{ fontSize: 15, color: '#fff' }}>🛡</Text></View>
        <Text style={s.brand}>SENTINEL</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 20 }}>🌐</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.pageTitle}>Trigger & Profile{'\n'}Setup</Text>
          <Text style={s.pageFr}>CONFIGURATION DU DÉCLENCHEUR ET DU PROFIL</Text>
        </View>

        {/* ── VOICE TRIGGER CARD ──────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardMeta}>BIOMETRIC TRIGGER</Text>
              <Text style={s.cardTitle}>Record Voice{'\n'}Trigger</Text>
              <Text style={s.cardDesc}>
                Say your phrase clearly. The system will recognise it and automatically send an alert.
              </Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: recordingStatus === 'saved' ? '#4caf50' : recordingStatus === 'recording' ? RED : GOLD }]}>
              <Text style={s.statusTxt}>
                {recordingStatus === 'idle'      ? 'READY'     :
                 recordingStatus === 'recording' ? 'REC ●'    :
                 recordingStatus === 'recorded'  ? 'PREVIEW'   :
                 recordingStatus === 'saving'    ? 'SAVING...' : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Phrase selector */}
          <Text style={s.subLabel}>SELECT TRIGGER PHRASE</Text>
          <View style={s.phraseRow}>
            {phrases.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.phraseBtn, triggerPhrase === p && s.phraseBtnA]}
                onPress={() => setTriggerPhrase(p)}
              >
                <Text style={[s.phraseTxt, triggerPhrase === p && s.phraseTxtA]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.selectedPhrase}>Selected: "{triggerPhrase}"</Text>

          {/* Waveform */}
          <View style={s.waveform}>
            {waveAnim.map((h, i) => (
              <View
                key={i}
                style={[
                  s.wavebar,
                  {
                    height: recordingStatus === 'recording' ? h : 20,
                    backgroundColor: recordingStatus === 'recording'
                      ? i % 2 === 0 ? RED : '#ff8a80'
                      : recordingStatus === 'saved' ? '#4caf50' : '#ccc',
                  },
                ]}
              />
            ))}
          </View>

          {/* Recording controls */}
          <View style={s.recControls}>
            {recordingStatus === 'idle' && (
              <TouchableOpacity style={s.recBtn} onPress={startRecording}>
                <Text style={{ fontSize: 18, color: '#fff', marginRight: 8 }}>🎙</Text>
                <Text style={s.recBtnTxt}>Start{'\n'}Recording</Text>
              </TouchableOpacity>
            )}

            {recordingStatus === 'recording' && (
              <TouchableOpacity style={[s.recBtn, { backgroundColor: '#333' }]} onPress={stopRecording}>
                <Text style={{ fontSize: 18, color: '#fff', marginRight: 8 }}>⏹</Text>
                <Text style={s.recBtnTxt}>Stop{'\n'}Recording</Text>
              </TouchableOpacity>
            )}

            {(recordingStatus === 'recorded' || recordingStatus === 'saved') && (
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity style={[s.recBtn, { backgroundColor: BLUE }]} onPress={playRecording}>
                  <Text style={{ fontSize: 16, color: '#fff', marginRight: 8 }}>{isPlaying ? '⏹' : '▶'}</Text>
                  <Text style={s.recBtnTxt}>{isPlaying ? 'Stop' : 'Play\nPreview'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.recBtn, { backgroundColor: '#555' }]} onPress={resetRecording}>
                  <Text style={{ fontSize: 16, color: '#fff', marginRight: 8 }}>🔄</Text>
                  <Text style={s.recBtnTxt}>Re-record</Text>
                </TouchableOpacity>

                {recordingStatus === 'recorded' && (
                  <TouchableOpacity style={[s.recBtn, { backgroundColor: '#4caf50' }]} onPress={saveProfile}>
                    {recordingStatus === 'saving'
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Text style={{ fontSize: 16, color: '#fff', marginRight: 8 }}>💾</Text>
                          <Text style={s.recBtnTxt}>Save to{'\n'}Profile</Text>
                        </>
                    }
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {recordingStatus === 'saved' && (
            <View style={s.savedBanner}>
              <Text style={s.savedTxt}>
                ✅  Voice profile active. Say "{triggerPhrase}" to trigger an alert automatically.
              </Text>
            </View>
          )}

          <Text style={s.recDesc}>
            Enregistrez votre phrase de déclenchement vocale pour les urgences mains libres.
            Le système reconnaît votre voix et envoie une alerte automatiquement.
          </Text>
        </View>

        {/* ── CONNECTIVITY CARD ──────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.connectRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.connectLabel}>📡  Connectivity</Text>
              <Text style={s.connectDesc}>Fallback to USSD/SMS is active for low-signal areas.</Text>
            </View>
            <View style={s.mtnBadge}>
              <Text style={s.mtnTop}>MTN 4G</Text>
              <Text style={s.mtnBot}>{user?.city || 'CM'}</Text>
            </View>
          </View>

          <View style={s.radiusRow}>
            <Text style={s.radiusLabel}>EMERGENCY RADIUS</Text>
            <Text style={s.radiusVal}>500m</Text>
          </View>
          <Text style={s.radiusFr}>Rayon d'urgence</Text>
          <View style={s.sliderTrack}><View style={s.sliderFill} /><View style={s.sliderThumb} /></View>

          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleLabel}>AUTO-FALLBACK</Text>
              <Text style={s.toggleDesc}>Switch to SMS/USSD automatically</Text>
            </View>
            <Switch value={autoFallback} onValueChange={setAutoFallback} trackColor={{ false: '#ddd', true: RED }} thumbColor="#fff" />
          </View>
        </View>

        {/* ── COMMAND IDENTITY CARD ──────────────────────────────────────── */}
        <View style={s.commandCard}>
          <View style={s.commandAvatarWrap}>
            <View style={s.commandAvatar}><Text style={{ fontSize: 44 }}>🧑</Text></View>
            <View style={s.commandVerified}><Text style={s.commandVerifiedTxt}>✓</Text></View>
          </View>
          <Text style={s.commandTitle}>
            {userType === 'driver' ? 'DRIVER IDENTITY' : 'STATION IDENTITY'}
          </Text>
          <Text style={s.commandSub}>
            {userType === 'driver'
              ? `Badge: ${user?.badge_id || '—'}  •  ${user?.city || '—'}`
              : `Station: ${user?.station_id || '—'}  •  ${user?.city || '—'}`}
          </Text>

          <View style={s.statsGrid}>
            {userType === 'driver' ? [
              { label: 'VEHICLE',   val: user?.vehicle_plate || '—' },
              { label: 'NETWORK',   val: user?.network || 'MTN'     },
              { label: 'VOICE',     val: recordingStatus === 'saved' ? 'ACTIVE' : 'NOT SET' },
              { label: 'STATUS',    val: 'ACTIVE'                   },
            ] : [
              { label: 'DISTRICT',  val: user?.district || '—'       },
              { label: 'EMERGENCY', val: user?.emergency_line || '—'  },
              { label: 'COMMANDER', val: user?.commander_name || '—'  },
              { label: 'STATUS',    val: 'ACTIVE'                     },
            ]}
              .map(({ label, val }) => (
                <View key={label} style={s.statBox}>
                  <Text style={s.statLabel}>{label}</Text>
                  <Text style={s.statVal}>{val}</Text>
                </View>
              ))
            }
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { ico: '✱',  lbl: 'SOS',        to: 'disactivation' },
          { ico: '👥', lbl: 'RESPONDERS',  to: 'confirmation'  },
          { ico: '📊', lbl: 'REPORTS',     to: 'statistics'    },
          { ico: '👤', lbl: 'PROFILE',     to: 'profileSetup'  },
        ].map(({ ico, lbl, to }) => (
          <TouchableOpacity key={lbl} style={lbl === 'PROFILE' ? s.navActive : s.navItem} onPress={() => nav(to)}>
            <Text style={lbl === 'PROFILE' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'PROFILE' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  shieldWrap:     { width: 30, height: 30, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brand:          { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 2 },
  titleBlock:     { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10 },
  pageTitle:      { fontSize: 28, fontWeight: '900', color: '#111', lineHeight: 34 },
  pageFr:         { fontSize: 10, color: '#888', marginTop: 6, letterSpacing: 0.3, lineHeight: 15 },
  card:           { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardMeta:       { fontSize: 10, fontWeight: '700', color: RED, letterSpacing: 0.5, marginBottom: 4 },
  cardTitle:      { fontSize: 20, fontWeight: '900', color: '#111', lineHeight: 26 },
  cardDesc:       { fontSize: 12, color: '#555', lineHeight: 17, marginTop: 4 },
  statusBadge:    { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  statusTxt:      { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  subLabel:       { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 8 },
  phraseRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  phraseBtn:      { backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5, borderColor: 'transparent' },
  phraseBtnA:     { backgroundColor: '#fde8e8', borderColor: RED },
  phraseTxt:      { fontSize: 12, fontWeight: '600', color: '#555' },
  phraseTxtA:     { color: RED },
  selectedPhrase: { fontSize: 11, color: RED, fontWeight: '700', marginBottom: 14, fontStyle: 'italic' },
  waveform:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, marginBottom: 14, height: 80 },
  wavebar:        { width: 6, borderRadius: 3, minHeight: 6 },
  recControls:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  recBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  recBtnTxt:      { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 },
  savedBanner:    { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginBottom: 12 },
  savedTxt:       { fontSize: 12, color: '#2e7d32', fontWeight: '600', lineHeight: 18 },
  recDesc:        { fontSize: 11, color: '#888', lineHeight: 16 },
  connectRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  connectLabel:   { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 6 },
  connectDesc:    { fontSize: 11, color: '#666', lineHeight: 16, maxWidth: 200 },
  mtnBadge:       { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  mtnTop:         { fontSize: 12, fontWeight: '900', color: '#111' },
  mtnBot:         { fontSize: 9, color: '#555', marginTop: 2 },
  radiusRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusLabel:    { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  radiusVal:      { fontSize: 16, fontWeight: '900', color: RED },
  radiusFr:       { fontSize: 10, color: '#aaa', marginBottom: 8 },
  sliderTrack:    { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, position: 'relative', marginBottom: 18 },
  sliderFill:     { position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', backgroundColor: RED, borderRadius: 2 },
  sliderThumb:    { position: 'absolute', left: '58%', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: RED },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel:    { fontSize: 13, fontWeight: '800', color: '#111' },
  toggleDesc:     { fontSize: 11, color: '#888', marginTop: 2 },
  commandCard:    { backgroundColor: '#1a1a2e', marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 20, alignItems: 'center' },
  commandAvatarWrap:{ position: 'relative', marginBottom: 14 },
  commandAvatar:  { width: 80, height: 80, borderRadius: 18, backgroundColor: '#2a2a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: RED },
  commandVerified:{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  commandVerifiedTxt:{ fontSize: 13, fontWeight: '900', color: '#111' },
  commandTitle:   { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 26, marginBottom: 4 },
  commandSub:     { fontSize: 11, color: '#aaa', marginBottom: 18, textAlign: 'center' },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  statBox:        { width: '48%', marginBottom: 12 },
  statLabel:      { fontSize: 9, color: '#888', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  statVal:        { fontSize: 14, fontWeight: '900', color: '#fff' },
  bottomNav:      { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:      { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:        { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:        { fontSize: 18, color: '#fff' },
  navTxtA:        { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:         { fontSize: 18, color: '#aaa' },
  navTxt:         { fontSize: 9, color: '#aaa', marginTop: 2 },
});
