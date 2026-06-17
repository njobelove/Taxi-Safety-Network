import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';

const RED = '#d32f2f';

export default function ProfileSetupScreen({ nav, location }) {
  const [autoFallback, setAutoFallback] = useState(true);

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
        <Text style={s.brand}>SENTINEL</Text>
        <View style={{ flex: 1 }} />
        <Text style={s.globe}>🌐</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Page title */}
        <View style={s.titleBlock}>
          <Text style={s.pageTitle}>Trigger & Profile{'\n'}Setup</Text>
          <Text style={s.pageFr}>CONFIGURATION DU DÉCLENCHEUR ET DU{'\n'}PROFIL</Text>
        </View>

        {/* Biometric trigger card */}
        <View style={s.card}>
          <View style={s.cardTopRow}>
            <View>
              <Text style={s.cardMeta}>BIOMETRIC TRIGGER</Text>
              <Text style={s.cardTitle}>Record Voice{'\n'}Trigger</Text>
              <Text style={s.cardDesc}>Phrase: "Mbolo Police" or{'\n'}local dialect</Text>
            </View>
            <View style={s.activeBadge}>
              <Text style={s.activeTxt}>ACTIVE</Text>
              <Text style={s.activeSubTxt}>LISTENER</Text>
            </View>
          </View>

          {/* Waveform */}
          <View style={s.waveform}>
            {Array.from({ length: 20 }).map((_, i) => {
              const heights = [20,35,50,40,60,45,55,30,65,70,60,50,40,65,55,35,50,40,30,25];
              return (
                <View
                  key={i}
                  style={[s.wavebar, {
                    height: heights[i] || 30,
                    backgroundColor: RED,
                    opacity: 0.7 + (i % 3) * 0.1,
                  }]}
                />
              );
            })}
          </View>

          <TouchableOpacity style={s.recordBtn}>
            <Text style={s.recordIco}>🎙</Text>
            <Text style={s.recordTxt}>Start{'\n'}Recording</Text>
          </TouchableOpacity>
          <Text style={s.recordDesc}>
            Enregistrez votre phrase de déclenchement vocale pour les urgences mains libres.
          </Text>
        </View>

        {/* Connectivity card */}
        <View style={s.card}>
          <View style={s.connectRow}>
            <View>
              <Text style={s.connectLabel}>📡  Connectivity</Text>
              <Text style={s.connectDesc}>Fallback to USSD/SMS is active for low-signal areas.</Text>
            </View>
            <View style={s.mtnBadge}>
              <Text style={s.mtnTop}>MTN 4G</Text>
              <Text style={s.mtnBot}>DOUALA, CM</Text>
            </View>
          </View>

          {/* Emergency radius */}
          <View style={s.radiusRow}>
            <Text style={s.radiusLabel}>EMERGENCY RADIUS</Text>
            <Text style={s.radiusVal}>500m</Text>
          </View>
          <Text style={s.radiusFr}>Rayon d'urgence</Text>
          <View style={s.sliderTrack}>
            <View style={s.sliderFill} />
            <View style={s.sliderThumb} />
          </View>

          {/* Auto fallback toggle */}
          <View style={s.toggleRow}>
            <View>
              <Text style={s.toggleLabel}>AUTO-FALLBACK</Text>
              <Text style={s.toggleDesc}>Switch to SMS/USSD automatically</Text>
            </View>
            <Switch
              value={autoFallback}
              onValueChange={setAutoFallback}
              trackColor={{ false: '#ddd', true: RED }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Emergency contacts */}
        <View style={s.card}>
          <View style={s.contactsHeader}>
            <View>
              <Text style={s.contactsTitle}>Emergency{'\n'}Contacts</Text>
              <Text style={s.contactsFr}>Gestion des contacts{'\n'}d'urgence</Text>
            </View>
            <TouchableOpacity style={s.addBtn}>
              <Text style={s.addBtnTxt}>+  ADD{'\n'}CONTACT</Text>
            </TouchableOpacity>
          </View>

          {[
            { initials: 'AM', name: 'Amadou M.', phone: '+237 670 ••• •••', primary: true },
            { initials: 'SK', name: 'Sali K.', phone: '+237 690 ••• •••', primary: false },
          ].map((c) => (
            <View key={c.initials} style={s.contactRow}>
              <View style={s.contactAvatar}><Text style={s.contactInitials}>{c.initials}</Text></View>
              <View style={s.contactInfo}>
                <View style={s.contactNameRow}>
                  <Text style={s.contactName}>{c.name}</Text>
                  {c.primary && <View style={s.primaryBadge}><Text style={s.primaryTxt}>PRIMARY</Text></View>}
                </View>
                <Text style={s.contactPhone}>{c.phone}</Text>
              </View>
              <Text style={s.contactMenu}>⋮</Text>
            </View>
          ))}
        </View>

        {/* Command center identity */}
        <View style={s.commandCard}>
          <View style={s.commandAvatarWrap}>
            <View style={s.commandAvatar}><Text style={s.commandAvatarTxt}>🧑</Text></View>
            <View style={s.commandVerified}><Text style={s.commandVerifiedTxt}>✓</Text></View>
          </View>
          <Text style={s.commandTitle}>COMMAND{'\n'}CENTER IDENTITY</Text>
          <Text style={s.commandSub}>Registered Responder: ID-4492-CMR</Text>

          <View style={s.statsGrid}>
            {[
              { label: 'CREDIBILITY', val: '98.4%' },
              { label: 'ALERTS SENT', val: '12' },
              { label: 'RESPONSE', val: '2m 30s' },
              { label: 'LEVEL', val: 'ELITE' },
            ].map(({ label, val }) => (
              <View key={label} style={s.statBox}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statVal}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { ico: '✱', lbl: 'SOS', active: false },
          { ico: '👥', lbl: 'RESPONDERS', active: false },
          { ico: '📊', lbl: 'REPORTS', active: false },
          { ico: '👤', lbl: 'PROFILE', active: true },
        ].map(({ ico, lbl, active }) => (
          <TouchableOpacity key={lbl} style={active ? s.navItemActive : s.navItem}>
            <Text style={active ? s.navIcoActive : s.navIco}>{ico}</Text>
            <Text style={active ? s.navTxtActive : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  shieldWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  shieldIco: { fontSize: 15, color: '#fff' },
  brand:     { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 2 },
  globe:     { fontSize: 20 },

  titleBlock: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10 },
  pageTitle:  { fontSize: 28, fontWeight: '900', color: '#111', lineHeight: 34 },
  pageFr:     { fontSize: 10, color: '#888', marginTop: 6, letterSpacing: 0.3, lineHeight: 15 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 14,
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  cardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardMeta:    { fontSize: 10, fontWeight: '700', color: RED, letterSpacing: 0.5, marginBottom: 4 },
  cardTitle:   { fontSize: 20, fontWeight: '900', color: '#111', lineHeight: 26 },
  cardDesc:    { fontSize: 12, color: '#555', marginTop: 6, lineHeight: 17 },
  activeBadge: { backgroundColor: '#f5c518', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  activeTxt:   { fontSize: 11, fontWeight: '900', color: '#111' },
  activeSubTxt:{ fontSize: 9, color: '#333', marginTop: 2 },

  waveform: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, marginBottom: 14, height: 80,
  },
  wavebar: { width: 6, borderRadius: 3, backgroundColor: RED },

  recordBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: RED, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  recordIco:  { fontSize: 18, color: '#fff', marginRight: 8 },
  recordTxt:  { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 },
  recordDesc: { fontSize: 11, color: '#555', lineHeight: 16 },

  connectRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  connectLabel:{ fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 6 },
  connectDesc: { fontSize: 11, color: '#666', lineHeight: 16, maxWidth: 200 },
  mtnBadge:    { backgroundColor: '#f5c518', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  mtnTop:      { fontSize: 12, fontWeight: '900', color: '#111' },
  mtnBot:      { fontSize: 9, color: '#555', marginTop: 2 },

  radiusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radiusLabel: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  radiusVal:   { fontSize: 16, fontWeight: '900', color: RED },
  radiusFr:    { fontSize: 10, color: '#aaa', marginBottom: 8 },
  sliderTrack: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, position: 'relative', marginBottom: 18 },
  sliderFill:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', backgroundColor: RED, borderRadius: 2 },
  sliderThumb: { position: 'absolute', left: '58%', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: RED },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 13, fontWeight: '800', color: '#111' },
  toggleDesc:  { fontSize: 11, color: '#888', marginTop: 2 },

  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  contactsTitle:  { fontSize: 18, fontWeight: '800', color: '#111', lineHeight: 24 },
  contactsFr:     { fontSize: 10, color: '#888', marginTop: 4, lineHeight: 14 },
  addBtn:         { alignItems: 'center' },
  addBtnTxt:      { fontSize: 11, fontWeight: '700', color: '#1565C0', textAlign: 'center', lineHeight: 16 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  contactAvatar:   { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactInitials: { fontSize: 14, fontWeight: '800', color: '#fff' },
  contactInfo:     { flex: 1 },
  contactNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName:     { fontSize: 14, fontWeight: '700', color: '#111' },
  primaryBadge:    { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  primaryTxt:      { fontSize: 9, fontWeight: '800', color: '#2e7d32' },
  contactPhone:    { fontSize: 11, color: '#888', marginTop: 2 },
  contactMenu:     { fontSize: 20, color: '#ccc' },

  /* Command card */
  commandCard: {
    backgroundColor: '#1a1a2e', marginHorizontal: 14, marginBottom: 14,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  commandAvatarWrap: { position: 'relative', marginBottom: 14 },
  commandAvatar:     {
    width: 80, height: 80, borderRadius: 18, backgroundColor: '#2a2a4a',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: RED,
  },
  commandAvatarTxt:  { fontSize: 44 },
  commandVerified: {
    position: 'absolute', bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#f5c518', alignItems: 'center', justifyContent: 'center',
  },
  commandVerifiedTxt: { fontSize: 13, fontWeight: '900', color: '#111' },
  commandTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 28, marginBottom: 4 },
  commandSub:   { fontSize: 11, color: '#aaa', marginBottom: 18 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  statBox:   { width: '48%', marginBottom: 12 },
  statLabel: { fontSize: 9, color: '#888', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  statVal:   { fontSize: 18, fontWeight: '900', color: '#fff' },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10,
  },
  navItemActive: { alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  navItem:       { alignItems: 'center' },
  navIcoActive:  { fontSize: 18, color: '#fff' },
  navTxtActive:  { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 2 },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 10, color: '#aaa', marginTop: 2 },
});
