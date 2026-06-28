import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Vibration, Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { triggerSOS } from '../services/sosService';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';
const GREEN = '#2e7d32';

const OPTIONS = [
  {
    id:       'robbery',
    icon:     'warning',
    tag:      'ARMED ROBBERY',
    tagColor: RED,
    accent:   RED,
    title:    'ROBBERY / BRAQUAGE',
    desc:     'Armed robbery or violent threat.',
    bg:       '#fde8e8',
  },
  {
    id:       'assault',
    icon:     'personal-injury',
    tag:      'PHYSICAL THREAT',
    tagColor: '#e65100',
    accent:   '#e65100',
    title:    'ASSAULT / AGRESSION',
    desc:     'Physical attack or harassment.',
    bg:       '#fff3e0',
  },
  {
    id:       'accident',
    icon:     'car-crash',
    tag:      'VEHICLE INCIDENT',
    tagColor: BLUE,
    accent:   BLUE,
    title:    'ACCIDENT',
    desc:     'Vehicle collision or damage.',
    bg:       '#e8f0fe',
  },
  {
    id:       'medical',
    icon:     'medical-services',
    tag:      'HEALTH EMERGENCY',
    tagColor: '#827717',
    accent:   '#827717',
    title:    'MEDICAL EMERGENCY',
    desc:     'Injury or health emergency.',
    bg:       '#f5f5dc',
  },
  {
    id:       'theft',
    icon:     'security',
    tag:      'PROPERTY CRIME',
    tagColor: '#6a1b9a',
    accent:   '#6a1b9a',
    title:    'THEFT / VOL',
    desc:     'Theft of property or belongings.',
    bg:       '#f3e5f5',
  },
];

export default function EmergencyScreen({ nav, location }) {
  const { user, token, voiceUri } = useAuth();
  const [selected, setSelected] = useState(null);
  const [sending,  setSending]  = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert('Select Alert Type', 'Please choose an incident type first.');
      return;
    }
    setSending(true);
    await triggerSOS({ user, location, voiceUri, token, nav });
    setSending(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('driverDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>EMERGENCY ALERT</Text>
          <Text style={s.headerSub}>Select incident type and confirm</Text>
        </View>
        <View style={s.mtnBadge}>
          <Text style={s.mtnTxt}>{user?.network || 'MTN'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Location status */}
        <View style={[s.locationBanner, { backgroundColor: location ? '#e8f5e9' : '#fde8e8' }]}>
          <MaterialIcons
            name={location ? 'gps-fixed' : 'gps-off'}
            size={20}
            color={location ? GREEN : RED}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.locationTxt, { color: location ? GREEN : RED }]}>
              {location ? 'LOCATION DETECTED — READY TO SEND' : 'GETTING LOCATION...'}
            </Text>
            <Text style={s.locationSub}>
              {location
                ? location.latitude.toFixed(5) + '° N, ' + location.longitude.toFixed(5) + '° E'
                : 'Please allow location access'}
            </Text>
          </View>
        </View>

        {/* Voice note status */}
        {voiceUri && (
          <View style={s.voiceBanner}>
            <MaterialIcons name="mic" size={18} color={GREEN} />
            <Text style={s.voiceBannerTxt}>
              Voice note ready — will play automatically on SOS
            </Text>
          </View>
        )}

        {/* Incident type selection */}
        <Text style={s.selectLabel}>SELECT INCIDENT TYPE</Text>

        {OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[
              s.optCard,
              selected === o.id && { borderColor: o.accent, borderWidth: 2.5 },
            ]}
            onPress={() => setSelected(o.id)}
            activeOpacity={0.82}
          >
            <View style={[s.optAccent, { backgroundColor: o.accent }]} />
            <View style={s.optBody}>
              <Text style={[s.optTag, { color: o.tagColor }]}>{o.tag}</Text>
              <Text style={s.optTitle}>{o.title}</Text>
              <Text style={s.optDesc}>{o.desc}</Text>
            </View>
            <View style={[s.optIco, { backgroundColor: o.bg }]}>
              <MaterialIcons name={o.icon} size={26} color={o.accent} />
            </View>
            {selected === o.id && (
              <View style={[s.checkBadge, { backgroundColor: o.accent }]}>
                <MaterialIcons name="check" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Confirm section */}
        <View style={s.confirmCard}>
          <View style={s.disclaimerRow}>
            <MaterialIcons name="info-outline" size={16} color="#555" />
            <Text style={s.disclaimerTxt}>
              Pressing CONFIRM will:{'\n'}
              {voiceUri ? '• Play your voice note\n' : ''}
              {'• Alert all nearby police & drivers\n'}
              {'• Share your exact location\n'}
              {'• Enable SMS + phone call options'}
            </Text>
          </View>

          <View style={s.selectedRow}>
            <MaterialIcons
              name={selected ? 'check-circle' : 'radio-button-unchecked'}
              size={18}
              color={selected ? GREEN : '#aaa'}
            />
            <Text style={[s.selectedTxt, { color: selected ? GREEN : '#aaa' }]}>
              {selected
                ? 'Selected: ' + (OPTIONS.find(o => o.id === selected)?.title || '')
                : 'No incident type selected yet'}
            </Text>
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, (!selected || sending) && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={!selected || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="sos" size={24} color="#fff" />
                <Text style={s.confirmTxt}>CONFIRM SOS ALERT</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => nav('driverDashboard')}>
          <MaterialIcons name="dashboard" size={22} color="#aaa" />
          <Text style={s.navTxt}>DASHBOARD</Text>
        </TouchableOpacity>
        <View style={s.navActive}>
          <MaterialIcons name="warning" size={22} color="#fff" />
          <Text style={s.navTxtA}>ALERTS</Text>
        </View>
        <TouchableOpacity style={s.navItem} onPress={() => nav('chatBoard')}>
          <MaterialIcons name="chat" size={22} color="#aaa" />
          <Text style={s.navTxt}>CHAT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => nav('profileSetup')}>
          <MaterialIcons name="person" size={22} color="#aaa" />
          <Text style={s.navTxt}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle:    { fontSize: 14, fontWeight: '900', color: '#111' },
  headerSub:      { fontSize: 10, color: '#888', marginTop: 1 },
  mtnBadge:       { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  mtnTxt:         { fontSize: 11, fontWeight: '800', color: '#111' },
  locationBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 8, borderRadius: 12, padding: 12, gap: 10 },
  locationTxt:    { fontSize: 12, fontWeight: '800' },
  locationSub:    { fontSize: 11, color: '#555', marginTop: 2 },
  voiceBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 10 },
  voiceBannerTxt: { fontSize: 11, color: GREEN, fontWeight: '600', flex: 1 },
  selectLabel:    { fontSize: 11, fontWeight: '800', color: '#555', paddingHorizontal: 16, marginBottom: 10, letterSpacing: 0.5 },
  optCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  optAccent:      { width: 5, alignSelf: 'stretch' },
  optBody:        { flex: 1, padding: 14 },
  optTag:         { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  optTitle:       { fontSize: 16, fontWeight: '900', color: '#111' },
  optDesc:        { fontSize: 11, color: '#666', marginTop: 4 },
  optIco:         { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', margin: 12 },
  checkBadge:     { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmCard:    { marginHorizontal: 16, marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 14, padding: 18 },
  disclaimerRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },
  disclaimerTxt:  { fontSize: 13, color: '#333', lineHeight: 22, flex: 1 },
  selectedRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  selectedTxt:    { fontSize: 12, fontWeight: '700' },
  confirmBtn:     { backgroundColor: RED, borderRadius: 14, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  confirmTxt:     { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  bottomNav:      { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:      { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:        { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navTxtA:        { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navTxt:         { fontSize: 9, color: '#aaa', marginTop: 2 },
});