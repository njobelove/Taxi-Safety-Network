import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function SignupScreen({ nav }) {
  const [role, setRole] = useState('driver');

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.shieldSm}><Text style={{ fontSize: 14, color: '#fff' }}>🛡</Text></View>
          <Text style={s.topTitle}>PUBLIC SAFETY | SÉCURITÉ PUBLIQUE</Text>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.cameroonBadge}>
            <Text style={s.cameroonTxt}>🇨🇲  CAMEROON NETWORK</Text>
          </View>
          <Text style={s.heroTitle}>Taxi Safety{'\n'}Network</Text>
          <Text style={s.heroFr}>Sûreté des Taxis du Cameroun</Text>
          <Text style={s.heroDesc}>
            Join the unified security infrastructure. Your registration ensures rapid tactical
            response and verified digital identity for public transport safety.
          </Text>
          <Text style={s.heroDescFr}>Rejoignez l'infrastructure de sécurité unifiée.</Text>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statNumRed}>24/7</Text>
              <Text style={s.statLbl}>TACTICAL WATCH</Text>
              <Text style={s.statFr}>Veille Tactique</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statBox}>
              <Text style={s.statNumBlue}>GPS</Text>
              <Text style={s.statLbl}>REAL-TIME DATA</Text>
              <Text style={s.statFr}>Données en Temps{'\n'}Réel</Text>
            </View>
          </View>
        </View>

        {/* Login link */}
        <View style={s.loginRow}>
          <Text style={s.loginGrey}>Already have an account?{'  '}</Text>
          <TouchableOpacity onPress={() => nav('login')}>
            <Text style={s.loginLink}>Log In / Connexion</Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <View>
              <Text style={s.formTitle}>PERSONNEL{'\n'}REGISTRATION</Text>
              <Text style={s.formFr}>Enregistrement du Personnel</Text>
            </View>
            <Text style={s.formDots}>⠿⠿⠿</Text>
          </View>

          {/* Step 1 — Role */}
          <Text style={s.stepLbl}>01. SELECT AUTHORITY ROLE / CHOISIR LE RÔLE</Text>
          {[
            { id: 'driver', ico: '🚖', lbl: 'Driver',  sub: 'Conducteur'       },
            { id: 'police', ico: '🛡', lbl: 'Police',  sub: "Forces de l'ordre" },
          ].map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[s.roleBtn, role === r.id && s.roleBtnA]}
              onPress={() => setRole(r.id)}
            >
              <Text style={s.roleIco}>{r.ico}</Text>
              <View>
                <Text style={[s.roleTxt, role === r.id && { color: '#fff' }]}>{r.lbl}</Text>
                <Text style={[s.roleSub, role === r.id && { color: '#ffc9c9' }]}>{r.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Step 2 — Details */}
          <Text style={s.stepLbl}>02. PERSONNEL DETAILS / DÉTAILS DU PERSONNEL</Text>
          {[
            { lbl: 'Full Name',         fr: 'NOM COMPLET',                   ph: 'e.g. Jean-Paul Biya',  kbType: 'default'    },
            { lbl: 'Badge Number / ID', fr: 'NUMÉRO DE BADGE / MATRICULE',   ph: 'TX-9982-CP',           kbType: 'default'    },
            { lbl: 'Phone Number',      fr: 'NUMÉRO DE TÉLÉPHONE',           ph: '+237 6XX XXX XXX',     kbType: 'phone-pad'  },
          ].map(({ lbl, fr, ph, kbType }) => (
            <View key={lbl}>
              <Text style={s.fieldLbl}>{lbl}</Text>
              <Text style={s.fieldFr}>{fr}</Text>
              <TextInput style={s.inp} placeholder={ph} placeholderTextColor="#ccc" keyboardType={kbType} />
            </View>
          ))}

          {role === 'driver' && (
            <View>
              <Text style={s.fieldLbl}>Vehicle Plate</Text>
              <Text style={s.fieldFr}>PLAQUE D'IMMATRICULATION</Text>
              <TextInput style={s.inp} placeholder="CE 000 AA" placeholderTextColor="#ccc" autoCapitalize="characters" />
            </View>
          )}

          {/* Note */}
          <View style={s.noteBox}>
            <Text style={s.noteIco}>ℹ</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.noteEn}>
                Note: For Law Enforcement, your district and rank will be verified against
                the National Police Database.
              </Text>
              <Text style={s.noteFr}>
                Note : Pour les forces de l'ordre, votre district et votre grade seront vérifiés
                par rapport à la base de données de la police nationale.
              </Text>
            </View>
          </View>

          {/* Register button */}
          <TouchableOpacity style={s.regBtn} onPress={() => nav('login')} activeOpacity={0.85}>
            <Text style={s.regTxt}>INITIALIZE SECURE{'\n'}ACCOUNT</Text>
            <Text style={s.regArrow}>›</Text>
          </TouchableOpacity>
          <Text style={s.regFr}>INITIALISER LE COMPTE SÉCURISÉ</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>SENTINEL CORE STATUS:  </Text>
          <View style={s.footerBadge}><Text style={s.footerBadgeTxt}>🔴 PRC-GDRN</Text></View>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f5f5f5' },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  shieldSm:    { width: 32, height: 32, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  topTitle:    { fontSize: 12, fontWeight: '800', color: '#111', flexShrink: 1 },
  hero:        { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  cameroonBadge:{ alignSelf: 'flex-start', backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  cameroonTxt: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  heroTitle:   { fontSize: 34, fontWeight: '900', color: '#111', lineHeight: 38 },
  heroFr:      { fontSize: 14, color: '#555', fontStyle: 'italic', marginTop: 4, marginBottom: 14 },
  heroDesc:    { fontSize: 13, color: '#333', lineHeight: 20 },
  heroDescFr:  { fontSize: 13, fontWeight: '700', color: '#111', marginTop: 8 },
  statsRow:    { flexDirection: 'row', marginTop: 20, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statBox:     { flex: 1, padding: 16 },
  statDiv:     { width: 2, backgroundColor: BLUE, marginVertical: 12 },
  statNumRed:  { fontSize: 22, fontWeight: '900', color: RED },
  statNumBlue: { fontSize: 22, fontWeight: '900', color: BLUE },
  statLbl:     { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 0.5, marginTop: 4 },
  statFr:      { fontSize: 10, color: '#888', marginTop: 2 },
  loginRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  loginGrey:   { fontSize: 13, color: '#666' },
  loginLink:   { fontSize: 13, fontWeight: '800', color: BLUE },
  formCard:    { backgroundColor: RED, marginHorizontal: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  formTitle:   { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  formFr:      { fontSize: 11, color: '#ffc9c9', marginTop: 4 },
  formDots:    { fontSize: 22, color: '#fff', opacity: 0.4 },
  stepLbl:     { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginTop: 18, marginBottom: 10, lineHeight: 16 },
  roleBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0' },
  roleBtnA:    { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)' },
  roleIco:     { fontSize: 20, marginRight: 12 },
  roleTxt:     { fontSize: 15, fontWeight: '700', color: '#222' },
  roleSub:     { fontSize: 11, color: '#888', marginTop: 1 },
  fieldLbl:    { fontSize: 12, fontWeight: '600', color: '#fff', marginTop: 14 },
  fieldFr:     { fontSize: 10, color: '#ffc9c9', marginBottom: 6, letterSpacing: 0.5 },
  inp:         { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e8e8e8', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#222' },
  noteBox:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, marginTop: 16 },
  noteIco:     { fontSize: 16, marginRight: 8, color: '#fff' },
  noteEn:      { fontSize: 11, color: '#fff', lineHeight: 16 },
  noteFr:      { fontSize: 10, color: '#ffc9c9', fontStyle: 'italic', marginTop: 6, lineHeight: 15 },
  regBtn:      { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, marginTop: 22 },
  regTxt:      { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 22 },
  regArrow:    { color: '#fff', fontSize: 28, fontWeight: '300' },
  regFr:       { textAlign: 'center', fontSize: 10, color: '#ffc9c9', marginTop: 8, letterSpacing: 0.5, marginBottom: 10 },
  footer:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  footerTxt:   { fontSize: 11, color: '#888' },
  footerBadge: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  footerBadgeTxt:{ fontSize: 10, color: '#fff' },
});
