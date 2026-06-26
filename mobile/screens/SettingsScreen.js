import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Switch, Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';

export default function SettingsScreen({ nav }) {
  const { user, role, logout } = useAuth();
  const isDriver = role === 'driver';

  // Settings state
  const [sosVibration,    setSosVibration]    = useState(true);
  const [voiceAlerts,     setVoiceAlerts]     = useState(true);
  const [pushNotif,       setPushNotif]       = useState(true);
  const [autoShareLoc,    setAutoShareLoc]    = useState(true);
  const [darkMode,        setDarkMode]        = useState(false);
  const [alertSound,      setAlertSound]      = useState(true);
  const [offlineSMS,      setOfflineSMS]      = useState(true);
  const [language,        setLanguage]        = useState('EN');

  const VERSION = '1.0.0';
  const BUILD   = '2025.06';

  const handleClearData = () => {
    Alert.alert(
      '⚠ Clear All Data',
      'This will clear your profile photo and voice note. You will need to re-upload them.\n\nYour account and alerts will NOT be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            try {
              const userId = user?.badgeId || user?.stationId;
              localStorage.removeItem('tsn_photo_' + userId);
              localStorage.removeItem('tsn_voice_' + userId);
              localStorage.removeItem('tsn_photo');
              localStorage.removeItem('tsn_voice');
            } catch (e) {}
            Alert.alert('✅ Done', 'Local data cleared. Your account is still active.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠ Delete Account',
      'To delete your account, please contact TSN Command:\n\nsupport@tsn-cameroon.com\n\nOr call: +237675000000',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => Linking.openURL('mailto:support@tsn-cameroon.com') },
      ]
    );
  };

  const Section = ({ title }) => (
    <Text style={s.sectionTitle}>{title}</Text>
  );

  const SettingRow = ({ ico, title, subtitle, value, onValueChange, type = 'switch', onPress, danger }) => (
    <TouchableOpacity
      style={s.row}
      onPress={type === 'button' ? onPress : undefined}
      activeOpacity={type === 'button' ? 0.7 : 1}
    >
      <View style={[s.rowIcoBg, danger && { backgroundColor: '#fde8e8' }]}>
        <Text style={s.rowIco}>{ico}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowTitle, danger && { color: RED }]}>{title}</Text>
        {subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#ddd', true: RED }}
          thumbColor={value ? '#fff' : '#fff'}
        />
      )}
      {type === 'button' && (
        <Text style={[s.rowArrow, danger && { color: RED }]}>›</Text>
      )}
      {type === 'value' && (
        <Text style={s.rowValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(isDriver ? 'driverDashboard' : 'policeDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>⚙ SETTINGS</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Account info */}
        <View style={s.accountCard}>
          <View style={[s.accountAvatar, { backgroundColor: isDriver ? RED : BLUE }]}>
            <Text style={{ fontSize: 30 }}>{isDriver ? '🚖' : '🏛'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.accountName}>{user?.fullName || user?.stationName || '—'}</Text>
            <Text style={s.accountId}>
              {isDriver ? '🪪 ' + user?.badgeId : '🏛 ' + user?.stationId}
            </Text>
            <View style={[s.rolePill, { backgroundColor: isDriver ? RED : BLUE }]}>
              <Text style={s.rolePillTxt}>{isDriver ? '🚖 DRIVER' : '🏛 POLICE'}</Text>
            </View>
          </View>
        </View>

        {/* SOS Settings */}
        <Section title="🚨 SOS & EMERGENCY" />
        <View style={s.card}>
          <SettingRow
            ico="📳" title="SOS Vibration"
            subtitle="Vibrate phone hard when SOS triggers"
            value={sosVibration} onValueChange={setSosVibration}
          />
          <View style={s.divider} />
          <SettingRow
            ico="🎙" title="Voice Alert Broadcast"
            subtitle="Play your voice note when SOS triggers"
            value={voiceAlerts} onValueChange={setVoiceAlerts}
          />
          <View style={s.divider} />
          <SettingRow
            ico="📱" title="Offline SMS Fallback"
            subtitle="Send SMS to police if no internet"
            value={offlineSMS} onValueChange={setOfflineSMS}
          />
        </View>

        {/* Notifications */}
        <Section title="🔔 NOTIFICATIONS" />
        <View style={s.card}>
          <SettingRow
            ico="🔔" title="Push Notifications"
            subtitle="Get notified when new alerts are created"
            value={pushNotif} onValueChange={setPushNotif}
          />
          <View style={s.divider} />
          <SettingRow
            ico="🔊" title="Alert Sound"
            subtitle="Play sound for incoming alerts"
            value={alertSound} onValueChange={setAlertSound}
          />
        </View>

        {/* Location */}
        <Section title="📍 LOCATION" />
        <View style={s.card}>
          <SettingRow
            ico="📡" title="Auto-Share Location"
            subtitle="Automatically share GPS when on duty"
            value={autoShareLoc} onValueChange={setAutoShareLoc}
          />
          <View style={s.divider} />
          <SettingRow
            ico="🗺" title="Open Live Map"
            subtitle="See all active drivers on map"
            type="button"
            onPress={() => nav('liveMap')}
          />
        </View>

        {/* Appearance */}
        <Section title="🎨 APPEARANCE" />
        <View style={s.card}>
          <SettingRow
            ico="🌍" title="Language"
            subtitle="App language"
            type="value"
            value={language}
          />
          <View style={s.divider} />
          <TouchableOpacity
            style={s.row}
            onPress={() => {
              Alert.alert(
                'Language / Langue',
                'Choose language:',
                [
                  { text: '🇬🇧 English', onPress: () => setLanguage('EN') },
                  { text: '🇫🇷 Français', onPress: () => setLanguage('FR') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <View style={s.rowIcoBg}><Text style={s.rowIco}>🇫🇷</Text></View>
            <View style={s.rowInfo}>
              <Text style={s.rowTitle}>Changer en Français</Text>
              <Text style={s.rowSub}>Switch to French language</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <Section title="📞 EMERGENCY CONTACTS" />
        <View style={s.card}>
          {[
            { ico: '👮', label: 'Police',    number: '117', color: BLUE  },
            { ico: '🚑', label: 'Ambulance', number: '15',  color: GREEN },
            { ico: '🚒', label: 'Fire',      number: '118', color: RED   },
          ].map(({ ico, label, number, color }) => (
            <React.Fragment key={number}>
              <TouchableOpacity
                style={s.row}
                onPress={() => {
                  Alert.alert('📞 Call ' + label, 'Dial ' + number + '?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: '📞 CALL NOW', onPress: () => Linking.openURL('tel:' + number) },
                  ]);
                }}
              >
                <View style={[s.rowIcoBg, { backgroundColor: color + '20' }]}>
                  <Text style={s.rowIco}>{ico}</Text>
                </View>
                <View style={s.rowInfo}>
                  <Text style={s.rowTitle}>{label} Emergency</Text>
                  <Text style={[s.rowSub, { color, fontWeight: '800' }]}>{number}</Text>
                </View>
                <View style={[s.callPill, { backgroundColor: color }]}>
                  <Text style={s.callPillTxt}>📞 CALL</Text>
                </View>
              </TouchableOpacity>
              <View style={s.divider} />
            </React.Fragment>
          ))}
          <TouchableOpacity
            style={s.row}
            onPress={() => nav('profileSetup')}
          >
            <View style={s.rowIcoBg}><Text style={s.rowIco}>⚙</Text></View>
            <View style={s.rowInfo}>
              <Text style={s.rowTitle}>Manage Emergency Contacts</Text>
              <Text style={s.rowSub}>Add custom police station numbers</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Section title="ℹ ABOUT TSN" />
        <View style={s.card}>
          <SettingRow
            ico="📱" title="App Version"
            subtitle="Taxi Safety Network"
            type="value" value={VERSION + ' (' + BUILD + ')'}
          />
          <View style={s.divider} />
          <SettingRow
            ico="📧" title="Contact Support"
            subtitle="support@tsn-cameroon.com"
            type="button"
            onPress={() => Linking.openURL('mailto:support@tsn-cameroon.com')}
          />
          <View style={s.divider} />
          <SettingRow
            ico="📖" title="Terms of Service"
            subtitle="Read our terms and privacy policy"
            type="button"
            onPress={() => Alert.alert('Terms of Service', 'TSN is a safety platform for taxi drivers in Cameroon. All data is encrypted and used only for emergency response.')}
          />
          <View style={s.divider} />
          <SettingRow
            ico="🔒" title="Privacy Policy"
            subtitle="How we protect your data"
            type="button"
            onPress={() => Alert.alert('Privacy Policy', 'Your location and personal data are only shared during active SOS alerts with registered police stations and nearby drivers.')}
          />
        </View>

        {/* Danger zone */}
        <Section title="⚠ DANGER ZONE" />
        <View style={s.card}>
          <SettingRow
            ico="🗑" title="Clear Local Data"
            subtitle="Remove saved photo and voice note"
            type="button" danger
            onPress={handleClearData}
          />
          <View style={s.divider} />
          <SettingRow
            ico="❌" title="Delete Account"
            subtitle="Permanently delete your TSN account"
            type="button" danger
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={() => {
            logout();
            nav('login');
          }}
        >
          <Text style={s.logoutTxt}>🚪 LOGOUT / DÉCONNEXION</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.nav}>
        {(isDriver ? [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'emergency'       },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
          { ico: '⚙',  lbl: 'SETTINGS', to: 'settings'        },
        ] : [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'policeDashboard' },
          { ico: '🗺',  lbl: 'LIVE MAP', to: 'liveMap'         },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
          { ico: '⚙',  lbl: 'SETTINGS', to: 'settings'        },
        ]).map(({ ico, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'SETTINGS' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <Text style={lbl === 'SETTINGS' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'SETTINGS' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back:          { fontSize: 22, color: RED, fontWeight: '600' },
  headerTitle:   { fontSize: 15, fontWeight: '900', color: '#111' },
  accountCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginBottom: 4, gap: 16 },
  accountAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  accountName:   { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 4 },
  accountId:     { fontSize: 12, color: '#888', marginBottom: 8 },
  rolePill:      { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  rolePillTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },
  sectionTitle:  { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  card:          { backgroundColor: '#fff', marginHorizontal: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcoBg:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  rowIco:        { fontSize: 20 },
  rowInfo:       { flex: 1 },
  rowTitle:      { fontSize: 14, fontWeight: '600', color: '#111' },
  rowSub:        { fontSize: 11, color: '#888', marginTop: 2 },
  rowArrow:      { fontSize: 22, color: '#ccc' },
  rowValue:      { fontSize: 13, color: '#888', fontWeight: '600' },
  divider:       { height: 1, backgroundColor: '#f5f5f5', marginLeft: 66 },
  callPill:      { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  callPillTxt:   { fontSize: 11, fontWeight: '800', color: '#fff' },
  logoutBtn:     { marginHorizontal: 16, marginTop: 24, backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  logoutTxt:     { fontSize: 15, fontWeight: '900', color: '#fff' },
  nav:           { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  navActive:     { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:       { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:       { fontSize: 18, color: '#fff' },
  navTxtA:       { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 9, color: '#aaa', marginTop: 2 },
});