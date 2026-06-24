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
  const recordingRef = useRef(null);

  const isDriver = role === 'driver';

  useEffect(() => {
    return () => { soundObj?.unloadAsync(); };
  }, [soundObj]);

  // ── PHOTO UPLOAD ─────────────────────────────────────────────────────────────
  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
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

    // Mobile
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
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          savePhoto(result.assets[0].uri);
          setProfileSaved(false);
        }
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    })();
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') {
      handlePickPhoto();
      return;
    }
    Alert.alert(
      'Update Profile Photo',
      'Choose photo source',
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        savePhoto(result.assets[0].uri);
        setProfileSaved(false);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ── VOICE RECORDING ──────────────────────────────────────────────────────────
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
    } catch (e) {
      Alert.alert('Recording Error', e.message);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      saveVoice(uri);
      setProfileSaved(false);
      Alert.alert(
        '✅ Voice Recorded',
        'Your voice note is ready.\n\nTap SAVE PROFILE to keep it permanently.\n\nThis voice will play automatically when you press SOS.'
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save recording: ' + e.message);
    }
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

  // ── SAVE PROFILE ─────────────────────────────────────────────────────────────
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
      `Your profile is now saved permanently:\n\n${profilePhoto ? '📷 Profile photo — visible on every screen\n' : ''}${voiceUri ? '🎙 Voice note — plays when you press SOS\n' : ''}\nYou will NOT need to re-upload these again.`,
      [{ text: 'Great!', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') }]
    );
  };

  // ── EMERGENCY CALL ───────────────────────────────────────────────────────────
  const callEmergency = (number, label) => {
    Alert.alert(
      `📞 Call ${label}`,
      `Dial ${number} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📞 CALL NOW', onPress: () => Linking.openURL(`tel:${number}`) }
      ]
    );
  };

  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout / Déconnexion',
      'Are you sure you want to logout?\n\nYou can log back in with any account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'YES — LOGOUT',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop any playing audio
              await soundObj?.stopAsync();
              await soundObj?.unloadAsync();
            } catch (e) {}
            // Clear auth state
            logout();
            // Force navigate to login
            setTimeout(() => nav('login'), 100);
          }
        }
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
          <Text style={s.chatIco}>💬</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── PHOTO ── */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={showPhotoOptions} style={s.avatarWrap}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarCircle}>
                <Text style={s.avatarIco}>{isDriver ? '🚖' : '🏛'}</Text>
              </View>
            )}
            <View style={s.cameraBadge}><Text>📷</Text></View>
          </TouchableOpacity>

          <Text style={s.avatarName}>
            {user?.fullName || user?.stationName || '—'}
          </Text>
          <View style={[s.roleBadge, { backgroundColor: isDriver ? RED : BLUE }]}>
            <Text style={s.roleTxt}>{isDriver ? '🚖 TAXI DRIVER' : '🏛 POLICE STATION'}</Text>
          </View>
          <Text style={s.tapHint}>
            {profilePhoto ? '✅ Photo saved · Tap to change' : 'Tap to upload photo'}
          </Text>
        </View>

        {/* ── SAVE PROFILE BUTTON ── */}
        {(profilePhoto || voiceUri) && (
          <TouchableOpacity
            style={[s.saveBtn, profileSaved && { backgroundColor: GREEN }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnTxt}>
                  {profileSaved
                    ? '✅ PROFILE SAVED TO ACCOUNT'
                    : '💾 SAVE PROFILE TO MY ACCOUNT'}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* ── VOICE NOTE ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🎙 VOICE IDENTITY NOTE</Text>
          <Text style={s.cardSub}>
            Record anything in your own words — your name, a phrase, a sound.
            This voice plays automatically when you press the SOS button,
            alerting nearby police and drivers.
          </Text>

          {voiceUri && (
            <View style={s.voiceSavedBanner}>
              <Text style={s.voiceSavedTxt}>✅ Voice note recorded and active</Text>
              <Text style={s.voiceSavedSub}>
                Plays automatically on SOS · {profileSaved ? 'Saved to account' : 'Tap SAVE PROFILE above'}
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
                <Text style={s.voiceBtnTxt}>STOP & SAVE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.voiceBtn, { backgroundColor: '#333', flex: 1 }]}
                onPress={startRecording}
              >
                <Text style={s.voiceBtnIco}>🎙</Text>
                <Text style={s.voiceBtnTxt}>{voiceUri ? 'RE-RECORD' : 'RECORD VOICE'}</Text>
              </TouchableOpacity>
            )}

            {voiceUri && (
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
                🔴 Recording... Say anything in your own words. Tap STOP when done.
              </Text>
            </View>
          )}
        </View>

        {/* ── EMERGENCY CONTACTS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🚨 EMERGENCY CONTACTS</Text>
          <Text style={s.cardSub}>Connected to your SOS button — tap to call directly</Text>
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
                <Text style={s.emergencyIco}>{ico}</Text>
              </View>
              <View style={s.emergencyInfo}>
                <Text style={s.emergencyLabel}>{label}</Text>
                <Text style={s.emergencyNumber}>{number}</Text>
              </View>
              <View style={[s.callBtn, { backgroundColor: color }]}>
                <Text style={s.callBtnTxt}>📞 CALL</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── ACCOUNT INFO ── */}
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
              <InfoRow label="Station Name"  value={user?.stationName}   ico="🏛" />
              <InfoRow label="Station ID"    value={user?.stationId}     ico="🪪" />
              <InfoRow label="District"      value={user?.district}      ico="📍" />
              <InfoRow label="City"          value={user?.city}          ico="🌆" />
              <InfoRow label="Emergency Line" value={user?.emergencyLine} ico="📞" />
              <InfoRow label="Commander"     value={user?.commanderName} ico="👮" />
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>QUICK ACTIONS</Text>
          {[
            { ico: '⊞',  lbl: 'Dashboard',      to: isDriver ? 'driverDashboard' : 'policeDashboard' },
            { ico: '🗺',  lbl: 'Live Driver Map', to: 'liveMap'    },
            { ico: '💬', lbl: 'Community Chat',  to: 'chatBoard'   },
            { ico: '📊', lbl: 'Statistics',      to: 'statistics'  },
            ...(isDriver ? [{ ico: '🚨', lbl: 'Report Emergency', to: 'emergency' }] : []),
          ].map(({ ico, lbl, to }) => (
            <TouchableOpacity key={lbl} style={s.actionBtn} onPress={() => nav(to)}>
              <Text style={s.actionIco}>{ico}</Text>
              <Text style={s.actionTxt}>{lbl}</Text>
              <Text style={s.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Direct logout - no Alert needed */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            logout();
            nav('login');
          }}
        >
          <Text style={s.logoutTxt}>🚪  LOGOUT / DÉCONNEXION</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        {[
          { ico: '⊞',  lbl: 'DASHBOARD', to: isDriver ? 'driverDashboard' : 'policeDashboard' },
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
  chatIco:          { fontSize: 22 },
  avatarSection:    { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 8 },
  avatarWrap:       { position: 'relative', marginBottom: 12 },
  avatarCircle:     { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: RED },
  avatarImg:        { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: RED },
  avatarIco:        { fontSize: 52 },
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
  voiceSavedSub:    { fontSize: 10, color: '#555', marginTop: 3 },
  voiceBtnsRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  voiceBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  voiceBtnIco:      { fontSize: 18, color: '#fff' },
  voiceBtnTxt:      { fontSize: 12, fontWeight: '800', color: '#fff' },
  recordingBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde8e8', borderRadius: 10, padding: 10 },
  recordingDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: RED, marginRight: 10 },
  recordingTxt:     { flex: 1, fontSize: 11, color: RED, fontWeight: '600', lineHeight: 16 },
  emergencyRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  emergencyIcoBg:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emergencyIco:     { fontSize: 20 },
  emergencyInfo:    { flex: 1 },
  emergencyLabel:   { fontSize: 12, fontWeight: '700', color: '#111' },
  emergencyNumber:  { fontSize: 15, fontWeight: '900', color: '#555', marginTop: 2 },
  callBtn:          { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
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
