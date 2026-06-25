import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, Image,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

export default function ProfileSetupScreen({ nav }) {
  const {
    user, role, logout,
    profilePhoto, voiceUri,
    savePhoto, saveVoice,
  } = useAuth();

  const [isRecording,  setIsRecording]  = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [soundObj,     setSoundObj]     = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [recSecs,      setRecSecs]      = useState(0);
  const recordingRef = useRef(null);
  const timerRef     = useRef(null);

  const isDriver = role === 'driver';

  useEffect(() => {
    return () => {
      soundObj?.unloadAsync();
      clearInterval(timerRef.current);
    };
  }, [soundObj]);

  // ── Convert blob URI to base64 for permanent storage ─────────────────────
  const blobToBase64 = async (uri) => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob     = await response.blob();
        return new Promise((resolve, reject) => {
          const reader  = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      return uri; // On mobile, URI is already permanent
    } catch (e) {
      console.log('blobToBase64 error:', e.message);
      return uri;
    }
  };

  // ── PHOTO UPLOAD ─────────────────────────────────────────────────────────
  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type  = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            // Save as base64 — permanent, survives reload
            savePhoto(ev.target.result);
            setProfileSaved(false);
            Alert.alert('✅ Photo Uploaded', 'Tap SAVE PROFILE to keep it permanently.');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }
    (async () => {
      try {
        const IP = require('expo-image-picker');
        const { status } = await IP.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow photo library access.');
          return;
        }
        const result = await IP.launchImageLibraryAsync({
          mediaTypes: IP.MediaTypeOptions.Images,
          allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });
        if (!result.canceled && result.assets[0]) {
          const b64 = await blobToBase64(result.assets[0].uri);
          savePhoto(b64);
          setProfileSaved(false);
        }
      } catch (e) { Alert.alert('Error', e.message); }
    })();
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') { handlePickPhoto(); return; }
    Alert.alert('Update Profile Photo', 'Choose source',
      [
        { text: '📷 Take Photo',          onPress: handleTakePhoto },
        { text: '🖼 Choose from Gallery', onPress: handlePickPhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const IP = require('expo-image-picker');
      const { status } = await IP.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access.');
        return;
      }
      const result = await IP.launchCameraAsync({
        allowsEditing: true, aspect: [1, 1], quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        const b64 = await blobToBase64(result.assets[0].uri);
        savePhoto(b64);
        setProfileSaved(false);
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  // ── VOICE RECORDING ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (e) { Alert.alert('Recording Error', e.message); }
  };

  const stopRecording = async () => {
    try {
      clearInterval(timerRef.current);
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      // ── KEY FIX: Convert to base64 so it survives page reload ──
      Alert.alert('⏳ Saving...', 'Converting voice note for permanent storage...');
      const base64Uri = await blobToBase64(uri);
      saveVoice(base64Uri);
      setProfileSaved(false);
      Alert.alert(
        '✅ Voice Note Saved',
        'Your voice note has been saved permanently!\n\nThis voice will play to police and drivers when you trigger an SOS alert.\n\nTap SAVE PROFILE to confirm.'
      );
    } catch (e) { Alert.alert('Error', 'Could not save recording: ' + e.message); }
  };

  const playVoiceNote = async () => {
    try {
      if (!voiceUri) {
        Alert.alert('No Recording', 'Please record your voice note first.');
        return;
      }
      if (playing) {
        await soundObj?.stopAsync();
        setPlaying(false);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: voiceUri });
      setSoundObj(sound);
      setPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (e) {
      setPlaying(false);
      Alert.alert('Playback Error', e.message);
    }
  };

  // ── SAVE PROFILE ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profilePhoto && !voiceUri) {
      Alert.alert('Nothing to Save', 'Please upload a photo or record a voice note first.');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setProfileSaved(true);
    Alert.alert(
      '✅ Profile Saved!',
      (profilePhoto ? '📷 Profile photo saved\n' : '') +
      (voiceUri     ? '🎙 Voice note saved permanently\n' : '') +
      '\nYou will NOT need to re-upload these again.',
      [{ text: 'Great!', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') }]
    );
  };

  const callEmergency = (number, label) => {
    Alert.alert('📞 Call ' + label, 'Dial ' + number + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📞 CALL NOW', onPress: () => Linking.openURL('tel:' + number) }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'LOGOUT', style: 'destructive',
          onPress: () => { logout(); nav('login'); } }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>MY PROFILE</Text>
        <TouchableOpacity onPress={() => nav('chatBoard')}>
          <Text style={{ fontSize: 22 }}>💬</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Photo */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={showPhotoOptions} style={s.avatarWrap}>
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={s.avatarImg} />
              : <View style={s.avatarCircle}>
                  <Text style={{ fontSize: 52 }}>{isDriver ? '🚖' : '🏛'}</Text>
                </View>
            }
            <View style={s.cameraBadge}><Text>📷</Text></View>
          </TouchableOpacity>
          <Text style={s.avatarName}>{user?.fullName || user?.stationName || '—'}</Text>
          <View style={[s.roleBadge, { backgroundColor: isDriver ? RED : BLUE }]}>
            <Text style={s.roleTxt}>{isDriver ? '🚖 TAXI DRIVER' : '🏛 POLICE STATION'}</Text>
          </View>
          <Text style={s.tapHint}>
            {profilePhoto ? '✅ Photo saved · Tap to change' : 'Tap to upload photo'}
          </Text>
        </View>

        {/* Save button */}
        {(profilePhoto || voiceUri) && (
          <TouchableOpacity
            style={[s.saveBtn, profileSaved && { backgroundColor: GREEN }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnTxt}>
                  {profileSaved ? '✅ PROFILE SAVED' : '💾 SAVE PROFILE TO MY ACCOUNT'}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* Voice note */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🎙 VOICE IDENTITY NOTE</Text>
          <Text style={s.cardSub}>
            Record anything in your own words. This voice plays automatically
            to police and drivers when you trigger an SOS alert.{'\n\n'}
            ⚠ Voice notes are saved permanently as audio data — they work
            even after you close and reopen the app.
          </Text>

          {voiceUri && !voiceUri.startsWith('blob:') && (
            <View style={s.voiceSavedBanner}>
              <Text style={s.voiceSavedTxt}>✅ Voice note saved permanently</Text>
              <Text style={{ fontSize: 10, color: '#555', marginTop: 3 }}>
                Will broadcast to police & drivers on SOS
              </Text>
            </View>
          )}

          {voiceUri && voiceUri.startsWith('blob:') && (
            <View style={[s.voiceSavedBanner, { backgroundColor: '#fff3e0' }]}>
              <Text style={[s.voiceSavedTxt, { color: '#e65100' }]}>
                ⚠ Voice note needs re-recording
              </Text>
              <Text style={{ fontSize: 10, color: '#555', marginTop: 3 }}>
                Temporary recording expired — please record again below
              </Text>
            </View>
          )}

          <View style={s.voiceBtnsRow}>
            {isRecording ? (
              <TouchableOpacity
                style={[s.voiceBtn, { backgroundColor: RED, flex: 1 }]}
                onPress={stopRecording}
              >
                <Text style={s.voiceBtnIco}>⏹</Text>
                <Text style={s.voiceBtnTxt}>STOP & SAVE ({recSecs}s)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.voiceBtn, { backgroundColor: '#333', flex: 1 }]}
                onPress={startRecording}
              >
                <Text style={s.voiceBtnIco}>🎙</Text>
                <Text style={s.voiceBtnTxt}>
                  {voiceUri && !voiceUri.startsWith('blob:') ? 'RE-RECORD' : 'RECORD VOICE'}
                </Text>
              </TouchableOpacity>
            )}

            {voiceUri && !voiceUri.startsWith('blob:') && (
              <TouchableOpacity
                style={[s.voiceBtn, { backgroundColor: playing ? GOLD : GREEN }]}
                onPress={playVoiceNote}
              >
                <Text style={s.voiceBtnIco}>{playing ? '⏹' : '▶'}</Text>
                <Text style={s.voiceBtnTxt}>{playing ? 'STOP' : 'PLAY'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View style={s.recordingBanner}>
              <View style={s.recordingDot} />
              <Text style={s.recordingTxt}>
                🔴 Recording... {recSecs}s — Say anything in your own words. Tap STOP when done.
              </Text>
            </View>
          )}
        </View>

        {/* Emergency contacts */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🚨 EMERGENCY CONTACTS</Text>
          <Text style={s.cardSub}>Connected to your SOS button</Text>
          {[
            { label: 'Police Emergency',   number: '117',           ico: '👮', color: BLUE  },
            { label: 'Fire Brigade',       number: '118',           ico: '🚒', color: RED   },
            { label: 'Ambulance / SAMU',   number: '15',            ico: '🚑', color: GREEN },
            { label: 'TSN Command Centre', number: '+237675000000', ico: '🛡', color: '#8B4513' },
          ].map(({ label, number, ico, color }) => (
            <TouchableOpacity
              key={number}
              style={s.emergencyRow}
              onPress={() => callEmergency(number, label)}
            >
              <View style={[s.emergencyIcoBg, { backgroundColor: color }]}>
                <Text style={{ fontSize: 20 }}>{ico}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.emergencyLabel}>{label}</Text>
                <Text style={s.emergencyNumber}>{number}</Text>
              </View>
              <View style={[s.callBtn2, { backgroundColor: color }]}>
                <Text style={s.callBtnTxt}>📞 CALL</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>ACCOUNT INFORMATION</Text>
          {isDriver ? (
            <>
              <InfoRow label="Full Name"     value={user?.fullName}     ico="👤" />
              <InfoRow label="Badge ID"      value={user?.badgeId}      ico="🪪" />
              <InfoRow label="Phone"         value={user?.phoneNumber}  ico="📞" />
              <InfoRow label="Network"       value={user?.network}      ico="📶" />
              <InfoRow label="Vehicle Plate" value={user?.vehiclePlate} ico="🚗" />
              <InfoRow label="City"          value={user?.city}         ico="📍" />
            </>
          ) : (
            <>
              <InfoRow label="Station Name"   value={user?.stationName}   ico="🏛" />
              <InfoRow label="Station ID"     value={user?.stationId}     ico="🪪" />
              <InfoRow label="District"       value={user?.district}      ico="📍" />
              <InfoRow label="City"           value={user?.city}          ico="🌆" />
              <InfoRow label="Emergency Line" value={user?.emergencyLine} ico="📞" />
              <InfoRow label="Commander"      value={user?.commanderName} ico="👮" />
            </>
          )}
        </View>

        {/* Quick actions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>QUICK ACTIONS</Text>
          {[
            { ico: '⊞',  lbl: 'Dashboard',      to: isDriver ? 'driverDashboard' : 'policeDashboard' },
            { ico: '🗺',  lbl: 'Live Driver Map', to: 'liveMap'    },
            { ico: '💬', lbl: 'Community Chat',  to: 'chatBoard'   },
            { ico: '📊', lbl: 'Statistics',      to: 'statistics'  },
            ...(isDriver ? [
              { ico: '🚨', lbl: 'Report Emergency',   to: 'emergency'    },
              { ico: '🔕', lbl: 'Deactivate My Alert', to: 'disactivation' },
            ] : []),
          ].map(({ ico, lbl, to }) => (
            <TouchableOpacity key={lbl} style={s.actionBtn} onPress={() => nav(to)}>
              <Text style={s.actionIco}>{ico}</Text>
              <Text style={s.actionTxt}>{lbl}</Text>
              <Text style={s.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>🚪  LOGOUT / DÉCONNEXION</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        {[
          { ico: '⊞', lbl: 'DASHBOARD', to: isDriver ? 'driverDashboard' : 'policeDashboard' },
          { ico: isDriver ? '⚠' : '📋', lbl: isDriver ? 'ALERTS' : 'INCIDENTS', to: isDriver ? 'emergency' : 'policeDashboard' },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'    },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup' },
        ].map(({ ico, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'PROFILE' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <Text style={lbl === 'PROFILE' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'PROFILE' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, ico }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIco}>{ico}</Text>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back:             { fontSize: 22, color: RED, fontWeight: '600' },
  headerTitle:      { fontSize: 15, fontWeight: '900', color: '#111' },
  avatarSection:    { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 8 },
  avatarWrap:       { position: 'relative', marginBottom: 12 },
  avatarCircle:     { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: RED },
  avatarImg:        { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: RED },
  cameraBadge:      { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarName:       { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 8 },
  roleBadge:        { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 6 },
  roleTxt:          { fontSize: 12, fontWeight: '800', color: '#fff' },
  tapHint:          { fontSize: 11, color: '#888', fontStyle: 'italic' },
  saveBtn:          { marginHorizontal: 14, marginBottom: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  card:             { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 18 },
  cardTitle:        { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 0.8, marginBottom: 6 },
  cardSub:          { fontSize: 11, color: '#888', lineHeight: 17, marginBottom: 14 },
  voiceSavedBanner: { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginBottom: 12 },
  voiceSavedTxt:    { fontSize: 12, color: GREEN, fontWeight: '700' },
  voiceBtnsRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  voiceBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  voiceBtnIco:      { fontSize: 18, color: '#fff' },
  voiceBtnTxt:      { fontSize: 12, fontWeight: '800', color: '#fff' },
  recordingBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde8e8', borderRadius: 10, padding: 10 },
  recordingDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: RED, marginRight: 10 },
  recordingTxt:     { flex: 1, fontSize: 11, color: RED, fontWeight: '600', lineHeight: 16 },
  emergencyRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  emergencyIcoBg:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emergencyLabel:   { fontSize: 12, fontWeight: '700', color: '#111' },
  emergencyNumber:  { fontSize: 15, fontWeight: '900', color: '#555', marginTop: 2 },
  callBtn2:         { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  callBtnTxt:       { fontSize: 11, fontWeight: '800', color: '#fff' },
  infoRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoIco:          { fontSize: 20, marginRight: 14, width: 28 },
  infoContent:      { flex: 1 },
  infoLabel:        { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  infoValue:        { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  actionIco:        { fontSize: 20, marginRight: 14, width: 28 },
  actionTxt:        { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  actionArrow:      { fontSize: 22, color: '#ccc' },
  logoutBtn:        { marginHorizontal: 14, backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  logoutTxt:        { fontSize: 15, fontWeight: '900', color: '#fff' },
  bottomNav:        { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10 },
  navActive:        { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:          { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:          { fontSize: 18, color: '#fff' },
  navTxtA:          { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:           { fontSize: 18, color: '#aaa' },
  navTxt:           { fontSize: 9, color: '#aaa', marginTop: 2 },
});