import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1565C0';

export default function EmergencyScreen({ nav }) {
  const [selected, setSelected] = useState(null);

  const options = [
    { id: 'theft',    tag: 'SELECT ALERT / CHOISIR',    tagColor: RED,       accent: RED,       title: 'THEFT / AGRESSION', desc: 'Vol, braquage, ou menace physique.', ico: '⚠',  icoBg: '#fde8e8' },
    { id: 'accident', tag: 'REPORT INCIDENT / RAPPORT', tagColor: BLUE,      accent: BLUE,      title: 'ACCIDENT',           desc: 'Collision ou dommage véhicule.',     ico: '🚓', icoBg: '#e8f0fe' },
    { id: 'medical',  tag: 'MEDICAL HELP / MÉDICALE',   tagColor: '#827717', accent: '#827717', title: 'MEDICAL',            desc: 'Blessure ou urgence de santé.',      ico: '➕', icoBg: '#f5f5dc' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={s.shieldWrap}><Text style={{ fontSize: 18, color: '#fff' }}>🛡</Text></View>
          <View>
            <Text style={s.headerTitle}>TAXI SAFETY NETWORK</Text>
            <Text style={s.headerSub}>YAOUNDÉ COMMAND</Text>
          </View>
        </View>
        <View style={s.mtnBadge}><Text style={s.mtnTxt}>📶 MTN4G</Text></View>
        <Text style={{ fontSize: 20, color: '#555', marginLeft: 6 }}>⋮</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.mainTitle}>EMERGENCY{'\n'}ALERT</Text>
          <Text style={s.mainFr}>ALERTE D'URGENCE</Text>
        </View>

        {/* Offline banner */}
        <View style={s.offlineBanner}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>✅</Text>
          <View>
            <Text style={s.offlineTxt}>OFFLINE FALLBACK ACTIVE</Text>
            <Text style={s.offlineSub}>PROTOCOL: SMS/USSD PRIORITY</Text>
          </View>
        </View>

        {/* Alert type options */}
        {options.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[s.optCard, selected === o.id && { borderColor: o.accent, borderWidth: 2 }]}
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
          </TouchableOpacity>
        ))}

        {/* Confirm card */}
        <View style={s.confirmCard}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={{ width: 3, backgroundColor: RED, borderRadius: 2, marginRight: 10 }} />
            <Text style={s.disclaimerTxt}>
              Your location and driver ID will be shared with{'\n'}Central Command immediately.
            </Text>
          </View>
          <Text style={s.disclaimerFr}>Votre localisation sera partagée instantanément.</Text>
          <TouchableOpacity style={s.confirmBtn} onPress={() => nav('disactivation')} activeOpacity={0.85}>
            <Text style={s.confirmTxt}>CONFIRM ALERT</Text>
            <Text style={s.confirmFr}>CONFIRMER L'ALERTE</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => nav('driverDashboard')}>
          <Text style={s.navIco}>⊞</Text><Text style={s.navTxt}>DASHBOARD</Text>
        </TouchableOpacity>
        <View style={s.navActive}>
          <Text style={s.navIcoA}>⚠</Text><Text style={s.navTxtA}>ALERTS</Text>
        </View>
        <TouchableOpacity style={s.navItem}>
          <Text style={s.navIco}>👥</Text><Text style={s.navTxt}>CONTACTS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => nav('profileSetup')}>
          <Text style={s.navIco}>👤</Text><Text style={s.navTxt}>PROFILE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  shieldWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:  { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:    { fontSize: 10, color: '#888', marginTop: 1 },
  mtnBadge:     { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  mtnTxt:       { fontSize: 11, fontWeight: '800', color: '#111' },
  titleBlock:   { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  mainTitle:    { fontSize: 38, fontWeight: '900', color: RED, lineHeight: 42 },
  mainFr:       { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
  offlineBanner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, marginHorizontal: 20, marginBottom: 20, padding: 12 },
  offlineTxt:   { fontSize: 12, fontWeight: '800', color: '#333', letterSpacing: 0.3 },
  offlineSub:   { fontSize: 10, color: '#888', marginTop: 2 },
  optCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  optAccent:    { width: 5, alignSelf: 'stretch' },
  optBody:      { flex: 1, padding: 16 },
  optTag:       { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  optTitle:     { fontSize: 22, fontWeight: '900', color: '#111' },
  optDesc:      { fontSize: 12, color: '#666', marginTop: 4 },
  optIco:       { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', margin: 14 },
  confirmCard:  { marginHorizontal: 20, marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  disclaimerTxt:{ fontSize: 13, color: '#333', fontWeight: '600', lineHeight: 19, flex: 1 },
  disclaimerFr: { fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 16 },
  confirmBtn:   { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmTxt:   { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  confirmFr:    { color: '#ffc9c9', fontSize: 11, marginTop: 3 },
  bottomNav:    { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', paddingVertical: 8 },
  navActive:    { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:      { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:      { fontSize: 18, color: '#fff' },
  navTxtA:      { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:       { fontSize: 18, color: '#aaa' },
  navTxt:       { fontSize: 9, color: '#aaa', marginTop: 2 },
});
