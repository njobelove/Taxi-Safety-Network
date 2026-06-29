import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, Image,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '../services/Icon';
import { Audio } from 'expo-av';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

export default function ProfileSetupScreen({ nav }) {
  const { user, role, logout, profilePhoto, voiceUri, savePhoto, saveVoice } = useAuth();
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
    return () => { soundObj?.unloadAsync(); clearInterval(timerRef.current); };
  }, [soundObj]);

  const blobToBase64 = async (uri) => {
    try {
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        const response = await fetch(uri);
        const blob     = await response.blob();
        return new Promise((resolve, reject) => {
          const reader   = new FileReader();
          reader.onload  = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      return uri;
    } catch (e) { return uri; }
  };

  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      const input  = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader  = new FileReader();
        reader.onload = (ev) => { savePhoto(ev.target.result); setProfileSaved(false); };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    (async () => {
      try {
        const IP = require('expo-image-picker');
        const { status } = await IP.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow photo library access.'); return; }
        const result = await IP.launchImageLibraryAsync({ mediaTypes: IP.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.5 });
        if (!result.canceled && result.assets[0]) { savePhoto(await blobToBase64(result.assets[0].uri)); setProfileSaved(false); }
      } catch (e) { Alert.alert('Error', e.message); }
    })();
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') { handlePickPhoto(); return; }
    Alert.alert('Update Profile Photo', 'Choose source', [
      { text: 'Take Photo', onPress: async () => {
        try {
          const IP = require('expo-image-picker');
          const { status } = await IP.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow camera access.'); return; }
          const result = await IP.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.5 });
          if (!result.canceled && result.assets[0]) { savePhoto(await blobToBase64(result.assets[0].uri)); setProfileSaved(false); }
        } catch (e) { Alert.alert('Error', e.message); }
      }},
      { text: 'Choose from Gallery', onPress: handlePickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow microphone access.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true); setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (e) { Alert.alert('Recording Error', e.message); }
  };

  const stopRecording = async () => {
    try {
      clearInterval(timerRef.current); setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri  = recordingRef.current.getURI();
      const b64  = await blobToBase64(uri);
      saveVoice(b64); setProfileSaved(false);
      Alert.alert('Voice Note Saved', 'Your voice note has been saved permanently!\n\nThis voice will broadcast to police and drivers when you trigger SOS.\n\nTap SAVE PROFILE to confirm.');
    } catch (e) { Alert.alert('Error', 'Could not save recording: ' + e.message); }
  };

  const playVoiceNote = async () => {
    try {
      if (!voiceUri) { Alert.alert('No Recording', 'Please record your voice note first.'); return; }
      if (playing) { await soundObj?.stopAsync(); setPlaying(false); return; }
      const { sound } = await Audio.Sound.createAsync({ uri: voiceUri });
      setSoundObj(sound); setPlaying(true); await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => { if (status.didJustFinish) { setPlaying(false); sound.unloadAsync(); } });
    } catch (e) { setPlaying(false); Alert.alert('Playback Error', e.message); }
  };

  const handleSaveProfile = async () => {
    if (!profilePhoto && !voiceUri) { Alert.alert('Nothing to Save', 'Please upload a photo or record a voice note first.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false); setProfileSaved(true);
    Alert.alert('Profile Saved!',
      (profilePhoto ? 'Profile photo saved\n' : '') + (voiceUri ? 'Voice note saved permanently\n' : '') + '\nYou will NOT need to re-upload these again.',
      [{ text: 'Great!', onPress: () => nav(isDriver ? 'driverDashboard' : 'policeDashboard') }]
    );
  };

  const callEmergency = (number, label) => {
    Alert.alert('Call ' + label, 'Dial ' + number + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'CALL NOW', onPress: () => Linking.openURL('tel:' + number) },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>MY PROFILE</Text>
        <TouchableOpacity onPress={() => nav('chatBoard')}>
          <MaterialIcons name="chat" size={24} color={RED} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Photo */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={showPhotoOptions} style={s.avatarWrap}>
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={s.avatarImg} />
              : <View style={s.avatarCircle}>
                  <MaterialIcons name={isDriver ? 'directions-car' : 'account-balance'} size={52} color={isDriver ? RED : BLUE} />
                </View>
            }
            <View style={s.cameraBadge}>
              <MaterialIcons name="photo-camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.avatarName}>{user?.fullName || user?.stationName || '—'}</Text>
          <View style={[s.roleBadge, { backgroundColor: isDriver ? RED : BLUE }]}>
            <MaterialIcons name={isDriver ? 'directions-car' : 'local-police'} size={14} color="#fff" />
            <Text style={s.roleTxt}>{isDriver ? 'TAXI DRIVER' : 'POLICE STATION'}</Text>
          </View>
          <Text style={s.tapHint}>
            {profilePhoto ? 'Photo saved · Tap to change' : 'Tap to upload photo'}
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
              : <>
                  <MaterialIcons name={profileSaved ? 'check-circle' : 'save'} size={20} color="#fff" />
                  <Text style={s.saveBtnTxt}>
                    {profileSaved ? 'PROFILE SAVED' : 'SAVE PROFILE TO MY ACCOUNT'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Voice note */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <MaterialIcons name="mic" size={18} color="#888" />
            <Text style={s.cardTitle}>VOICE IDENTITY NOTE</Text>
          </View>
          <Text style={s.cardSub}>
            Record anything in your own words. This voice plays automatically
            to police and drivers when you trigger an SOS alert.
          </Text>

          {voiceUri && !voiceUri.startsWith('blob:') && (
            <View style={s.voiceSavedBanner}>
              <MaterialIcons name="check-circle" size={16} color={GREEN} />
              <View>
                <Text style={s.voiceSavedTxt}>Voice note saved permanently</Text>
                <Text style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Will broadcast on SOS to police and drivers</Text>
              </View>
            </View>
          )}

          {voiceUri && voiceUri.startsWith('blob:') && (
            <View style={[s.voiceSavedBanner, { backgroundColor: '#fff3e0' }]}>
              <MaterialIcons name="warning" size={16} color="#e65100" />
              <Text style={[s.voiceSavedTxt, { color: '#e65100' }]}>Please re-record your voice note</Text>
            </View>
          )}

          <View style={s.voiceBtnsRow}>
            {isRecording ? (
              <TouchableOpacity style={[s.voiceBtn, { backgroundColor: RED, flex: 1 }]} onPress={stopRecording}>
                <MaterialIcons name="stop" size={18} color="#fff" />
                <Text style={s.voiceBtnTxt}>STOP & SAVE ({recSecs}s)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.voiceBtn, { backgroundColor: '#333', flex: 1 }]} onPress={startRecording}>
                <MaterialIcons name="mic" size={18} color="#fff" />
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
                <MaterialIcons name={playing ? 'stop' : 'play-arrow'} size={18} color="#fff" />
                <Text style={s.voiceBtnTxt}>{playing ? 'STOP' : 'PLAY'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View style={s.recordingBanner}>
              <MaterialIcons name="fiber-manual-record" size={14} color={RED} />
              <Text style={s.recordingTxt}>Recording... {recSecs}s — Say anything. Tap STOP when done.</Text>
            </View>
          )}
        </View>

        {/* Emergency contacts */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <MaterialIcons name="emergency" size={18} color="#888" />
            <Text style={s.cardTitle}>EMERGENCY CONTACTS</Text>
          </View>
          <Text style={s.cardSub}>Connected to your SOS button — tap to call</Text>
          {[
            { label: 'Police Emergency',   number: '117',           icon: 'local-police',    color: BLUE  },
            { label: 'Fire Brigade',       number: '118',           icon: 'local-fire-department', color: RED },
            { label: 'Ambulance / SAMU',   number: '15',            icon: 'medical-services', color: GREEN },
            { label: 'TSN Command Centre', number: '+237675000000', icon: 'security',         color: '#8B4513' },
          ].map(({ label, number, icon, color }) => (
            <TouchableOpacity key={number} style={s.emergencyRow} onPress={() => callEmergency(number, label)}>
              <View style={[s.emergencyIcoBg, { backgroundColor: color }]}>
                <MaterialIcons name={icon} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.emergencyLabel}>{label}</Text>
                <Text style={s.emergencyNumber}>{number}</Text>
              </View>
              <TouchableOpacity style={[s.callBtnSmall, { backgroundColor: color }]} onPress={() => Linking.openURL('tel:' + number)}>
                <MaterialIcons name="phone" size={14} color="#fff" />
                <Text style={s.callBtnTxt}>CALL</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account info */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <MaterialIcons name="account-circle" size={18} color="#888" />
            <Text style={s.cardTitle}>ACCOUNT INFORMATION</Text>
          </View>
          {isDriver ? (
            <>
              <InfoRow label="Full Name"     value={user?.fullName}     icon="person"         />
              <InfoRow label="Badge ID"      value={user?.badgeId}      icon="badge"          />
              <InfoRow label="Phone"         value={user?.phoneNumber}  icon="phone"          />
              <InfoRow label="Network"       value={user?.network}      icon="signal-cellular-alt" />
              <InfoRow label="Vehicle Plate" value={user?.vehiclePlate} icon="directions-car" />
              <InfoRow label="City"          value={user?.city}         icon="location-city"  />
            </>
          ) : (
            <>
              <InfoRow label="Station Name"   value={user?.stationName}   icon="account-balance" />
              <InfoRow label="Station ID"     value={user?.stationId}     icon="badge"           />
              <InfoRow label="District"       value={user?.district}      icon="location-on"     />
              <InfoRow label="City"           value={user?.city}          icon="location-city"   />
              <InfoRow label="Emergency Line" value={user?.emergencyLine} icon="phone"           />
              <InfoRow label="Commander"      value={user?.commanderName} icon="local-police"    />
            </>
          )}
        </View>

        {/* Quick actions */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <MaterialIcons name="apps" size={18} color="#888" />
            <Text style={s.cardTitle}>QUICK ACTIONS</Text>
          </View>
          {[
            { icon: 'dashboard',     lbl: 'Dashboard',           to: isDriver ? 'driverDashboard' : 'policeDashboard', color: BLUE  },
            { icon: 'map',           lbl: 'Live Driver Map',      to: 'liveMap',      color: GREEN },
            { icon: 'chat',          lbl: 'Community Chat',       to: 'chatBoard',    color: '#8B4513' },
            { icon: 'bar-chart',     lbl: 'Statistics',           to: 'statistics',   color: BLUE  },
            { icon: 'history',       lbl: 'Alert History',        to: 'history',      color: '#555' },
            { icon: 'settings',      lbl: 'Settings',             to: 'settings',     color: '#555' },
            ...(isDriver ? [
              { icon: 'warning',     lbl: 'Report Emergency',     to: 'emergency',    color: RED   },
              { icon: 'notifications-off', lbl: 'Deactivate My Alert', to: 'disactivation', color: GREEN },
            ] : []),
          ].map(({ icon, lbl, to, color }) => (
            <TouchableOpacity key={lbl} style={s.actionBtn} onPress={() => nav(to)}>
              <MaterialIcons name={icon} size={22} color={color} style={{ width: 30 }} />
              <Text style={s.actionTxt}>{lbl}</Text>
              <MaterialIcons name="chevron-right" size={22} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => { logout(); nav('login'); }}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={s.logoutTxt}>LOGOUT / DÉCONNEXION</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        {[
          { icon: 'dashboard',  lbl: 'DASHBOARD', to: isDriver ? 'driverDashboard' : 'policeDashboard' },
          { icon: isDriver ? 'warning' : 'assignment', lbl: isDriver ? 'ALERTS' : 'INCIDENTS', to: isDriver ? 'emergency' : 'policeDashboard' },
          { icon: 'chat',       lbl: 'CHAT',      to: 'chatBoard'    },
          { icon: 'person',     lbl: 'PROFILE',   to: 'profileSetup' },
        ].map(({ icon, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'PROFILE' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <MaterialIcons name={icon} size={22} color={lbl === 'PROFILE' ? '#fff' : '#aaa'} />
            <Text style={lbl === 'PROFILE' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <View style={s.infoRow}>
      <MaterialIcons name={icon} size={20} color="#aaa" style={{ width: 30 }} />
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
  headerTitle:      { fontSize: 15, fontWeight: '900', color: '#111' },
  avatarSection:    { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 8 },
  avatarWrap:       { position: 'relative', marginBottom: 12 },
  avatarCircle:     { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: RED },
  avatarImg:        { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: RED },
  cameraBadge:      { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarName:       { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 8 },
  roleBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 6 },
  roleTxt:          { fontSize: 12, fontWeight: '800', color: '#fff' },
  tapHint:          { fontSize: 11, color: '#888', fontStyle: 'italic' },
  saveBtn:          { marginHorizontal: 14, marginBottom: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveBtnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  card:             { backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 18 },
  cardTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle:        { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 0.8 },
  cardSub:          { fontSize: 11, color: '#888', lineHeight: 17, marginBottom: 14 },
  voiceSavedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginBottom: 12 },
  voiceSavedTxt:    { fontSize: 12, color: GREEN, fontWeight: '700' },
  voiceBtnsRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  voiceBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  voiceBtnTxt:      { fontSize: 12, fontWeight: '800', color: '#fff' },
  recordingBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8e8', borderRadius: 10, padding: 10 },
  recordingTxt:     { flex: 1, fontSize: 11, color: RED, fontWeight: '600', lineHeight: 16 },
  emergencyRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  emergencyIcoBg:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emergencyLabel:   { fontSize: 12, fontWeight: '700', color: '#111' },
  emergencyNumber:  { fontSize: 15, fontWeight: '900', color: '#555', marginTop: 2 },
  callBtnSmall:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  callBtnTxt:       { fontSize: 11, fontWeight: '800', color: '#fff' },
  infoRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoContent:      { flex: 1 },
  infoLabel:        { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  infoValue:        { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 12 },
  actionTxt:        { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  logoutBtn:        { marginHorizontal: 14, backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  logoutTxt:        { fontSize: 15, fontWeight: '900', color: '#fff' },
  bottomNav:        { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10 },
  navActive:        { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:          { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navTxtA:          { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navTxt:           { fontSize: 9, color: '#aaa', marginTop: 2 },
});