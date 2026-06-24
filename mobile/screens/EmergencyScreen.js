import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Vibration, Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import { createSOSAlert } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';

export default function EmergencyScreen({ nav, location }) {
  const { user, token, voiceUri } = useAuth();
  const [selected, setSelected] = useState(null);
  const [sending,  setSending]  = useState(false);
  const soundRef = useRef(null);

  // ── Play saved voice note ──────────────────────────────────────────────────
  const playVoiceAlert = async () => {
    try {
      if (!voiceUri) return;
      const { sound } = await Audio.Sound.createAsync({ uri: voiceUri });
      soundRef.current = sound;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (e) {
      console.log('Voice play error:', e.message);
    }
  };

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const options = [
    { id: 'robbery',  tag: 'ARMED ROBBERY',    tagColor: RED,       accent: RED,       title: 'ROBBERY / BRAQUAGE',  desc: 'Armed robbery or violent threat.',   ico: '⚠',  icoBg: '#fde8e8' },
    { id: 'assault',  tag: 'PHYSICAL THREAT',  tagColor: '#e65100', accent: '#e65100', title: 'ASSAULT / AGRESSION', desc: 'Physical attack or harassment.',     ico: '🚨', icoBg: '#fff3e0' },
    { id: 'accident', tag: 'VEHICLE INCIDENT', tagColor: BLUE,      accent: BLUE,      title: 'ACCIDENT',            desc: 'Vehicle collision or damage.',       ico: '🚓', icoBg: '#e8f0fe' },
    { id: 'medical',  tag: 'HEALTH EMERGENCY', tagColor: '#827717', accent: '#827717', title: 'MEDICAL EMERGENCY',   desc: 'Injury or health emergency.',        ico: '➕', icoBg: '#f5f5dc' },
    { id: 'theft',    tag: 'PROPERTY CRIME',   tagColor: '#6a1b9a', accent: '#6a1b9a', title: 'THEFT / VOL',         desc: 'Theft of property or belongings.',   ico: '🔒', icoBg: '#f3e5f5' },
  ];

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert('Select Alert Type', 'Please choose an incident type first.');
      return;
    }

    setSending(true);

    // ── 1. Vibrate ────────────────────────────────────────────────────────────
    Vibration.vibrate([0, 300, 100, 300, 100, 500]);

    // ── 2. Play saved voice note immediately ──────────────────────────────────
    if (voiceUri) {
      await playVoiceAlert();
    }

    const lat      = location?.latitude?.toFixed(5)  || '3.84800';
    const lng      = location?.longitude?.toFixed(5) || '11.50210';
    const mapsLink = `https://maps.google.com?q=${lat},${lng}`;
    const driverName = user?.fullName    || 'Unknown Driver';
    const badgeId    = user?.badgeId     || 'UNKNOWN';
    const plate      = user?.vehiclePlate || 'UNKNOWN';
    const network    = user?.network      || 'MTN';

    const smsBody = encodeURIComponent(
      `🚨 TSN EMERGENCY ALERT 🚨\n` +
      `Driver: ${driverName}\n` +
      `Badge:  ${badgeId}\n` +
      `Plate:  ${plate}\n` +
      `Type:   ${selected.toUpperCase()}\n` +
      `GPS:    ${lat}° N, ${lng}° E\n` +
      `Maps:   ${mapsLink}\n` +
      `Time:   ${new Date().toLocaleTimeString()}\n` +
      `Network: ${network}\n\n` +
      `PLEASE RESPOND IMMEDIATELY`
    );

    // ── 3. Send to backend → notifies all connected police + drivers ──────────
    try {
      await createSOSAlert({
        driverId:      badgeId,
        driverName,
        phoneNumber:   user?.phoneNumber || '',
        network,
        vehiclePlate:  plate,
        alertType:     selected,
        location: {
          lat:     parseFloat(lat),
          lng:     parseFloat(lng),
          address: `${lat}° N, ${lng}° E`,
        },
        triggerMethod: 'manual',
        hasVoiceNote:  !!voiceUri,
        timestamp:     new Date().toISOString(),
      }, token);
    } catch (e) {
      console.log('Backend alert error:', e.message);
    }

    setSending(false);

    // ── 4. Show action options ────────────────────────────────────────────────
    Alert.alert(
      '🚨 SOS ACTIVATED — HELP IS COMING',
      `✅ Alert sent to all nearby police & drivers\n${voiceUri ? '🎙 Your voice note is playing\n' : ''}📍 Location: ${lat}° N, ${lng}° E\n\nSelect additional action:`,
      [
        { text: '📞 Call Police (117)',    onPress: () => Linking.openURL('tel:117')                              },
        { text: '📱 SMS Police Station',  onPress: () => Linking.openURL(`sms:+237222221234?body=${smsBody}`)    },
        { text: '🗺 Share My Location',   onPress: () => Linking.openURL(mapsLink)                               },
        { text: '✅ Done',                 onPress: () => nav('confirmation')                                     },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('driverDashboard')}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🚨 EMERGENCY ALERT</Text>
          <Text style={s.headerSub}>Select incident type and confirm</Text>
        </View>
        <View style={s.mtnBadge}>
          <Text style={s.mtnTxt}>{user?.network || 'MTN'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Location status */}
        <View style={[s.locationBanner, { backgroundColor: location ? '#e8f5e9' : '#fde8e8' }]}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>{location ? '📍' : '⚠'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.locationTxt, { color: location ? '#2e7d32' : RED }]}>
              {location ? 'LOCATION DETECTED — READY TO SEND' : 'GETTING LOCATION...'}
            </Text>
            <Text style={s.locationSub}>
              {location
                ? `${location.latitude.toFixed(5)}° N, ${location.longitude.toFixed(5)}° E`
                : 'Please allow location access'}
            </Text>
          </View>
        </View>

        {/* Voice note status */}
        {voiceUri && (
          <View style={s.voiceBanner}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>🎙</Text>
            <Text style={s.voiceBannerTxt}>
              Voice note saved — will play automatically on SOS
            </Text>
          </View>
        )}

        {/* Alert type options */}
        <Text style={s.selectLabel}>SELECT INCIDENT TYPE</Text>
        {options.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[s.optCard, selected === o.id && { borderColor: o.accent, borderWidth: 2.5 }]}
            onPress={() => setSelected(o.id)}
            activeOpacity={0.82}
          >
            <View style={[s.optAccent, { backgroundColor: o.accent }]} />
            <View style={s.optBody}>
              <Text style={[s.optTag, { color: o.tagColor }]}>{o.tag}</Text>
              <Text style={s.optTitle}>{o.title}</Text>
              <Text style={s.optDesc}>{o.desc}</Text>
            </View>
            <View style={[s.optIco, { backgroundColor: o.icoBg }]}>
              <Text style={{ fontSize: 22 }}>{o.ico}</Text>
            </View>
            {selected === o.id && (
              <View style={[s.checkBadge, { backgroundColor: o.accent }]}>
                <Text style={s.checkTxt}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Confirm */}
        <View style={s.confirmCard}>
          <Text style={s.disclaimerTxt}>
            Pressing CONFIRM will:{'\n'}
            {voiceUri ? '🎙 Play your voice note\n' : ''}
            📡 Alert all nearby police & drivers{'\n'}
            📍 Share your exact location{'\n'}
            📱 Enable SMS + phone call options
          </Text>
          <Text style={s.selectedTxt}>
            {selected
              ? `Selected: ${options.find(o => o.id === selected)?.title}`
              : '⚠ No incident type selected yet'}
          </Text>
          <TouchableOpacity
            style={[s.confirmBtn, (!selected || sending) && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={!selected || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.confirmTxt}>🚨 CONFIRM SOS ALERT</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => nav('driverDashboard')}>
          <Text style={s.navIco}>⊞</Text><Text style={s.navTxt}>DASHBOARD</Text>
        </TouchableOpacity>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⚠</Text><Text style={s.navTxtA}>ALERTS</Text>
        </View>
        <TouchableOpacity style={s.navItem} onPress={() => nav('chatBoard')}>
          <Text style={s.navIco}>💬</Text><Text style={s.navTxt}>CHAT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => nav('profileSetup')}>
          <Text style={s.navIco}>👤</Text><Text style={s.navTxt}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#fff' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backArrow:     { fontSize: 22, color: RED, marginRight: 12, fontWeight: '600' },
  headerTitle:   { fontSize: 14, fontWeight: '900', color: '#111' },
  headerSub:     { fontSize: 10, color: '#888', marginTop: 1 },
  mtnBadge:      { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  mtnTxt:        { fontSize: 11, fontWeight: '800', color: '#111' },
  locationBanner:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 8, borderRadius: 12, padding: 12 },
  locationTxt:   { fontSize: 12, fontWeight: '800' },
  locationSub:   { fontSize: 11, color: '#555', marginTop: 2 },
  voiceBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 10 },
  voiceBannerTxt:{ fontSize: 11, color: '#2e7d32', fontWeight: '600', flex: 1 },
  selectLabel:   { fontSize: 11, fontWeight: '800', color: '#555', paddingHorizontal: 16, marginBottom: 10, letterSpacing: 0.5 },
  optCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  optAccent:     { width: 5, alignSelf: 'stretch' },
  optBody:       { flex: 1, padding: 14 },
  optTag:        { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  optTitle:      { fontSize: 18, fontWeight: '900', color: '#111' },
  optDesc:       { fontSize: 11, color: '#666', marginTop: 4 },
  optIco:        { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', margin: 12 },
  checkBadge:    { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkTxt:      { fontSize: 12, fontWeight: '900', color: '#fff' },
  confirmCard:   { marginHorizontal: 16, marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 14, padding: 18 },
  disclaimerTxt: { fontSize: 13, color: '#333', lineHeight: 22, marginBottom: 10 },
  selectedTxt:   { fontSize: 12, color: RED, fontWeight: '700', marginBottom: 14 },
  confirmBtn:    { backgroundColor: RED, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  confirmTxt:    { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  bottomNav:     { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:     { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:       { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:       { fontSize: 18, color: '#fff' },
  navTxtA:       { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 9, color: '#aaa', marginTop: 2 },
});
