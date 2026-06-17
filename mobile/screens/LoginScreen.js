import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';

const RED = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1976D2';

export default function LoginScreen({ nav }) {
  const [role, setRole]       = useState('driver');
  const [network, setNetwork] = useState('MTN');
  const [badge, setBadge]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#efefef" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Shield logo */}
        <View style={s.shieldWrap}>
          <View style={s.shield}><Text style={s.shieldTxt}>🛡</Text></View>
        </View>
        <Text style={s.appName}>Taxi Safety Network</Text>
        <Text style={s.appSub}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>

        {/* Card */}
        <View style={s.card}>

          {/* Driver / Police tabs */}
          <View style={s.tabs}>
            {[
              { id: 'driver', label: 'DRIVER', sub: 'Conducteur' },
              { id: 'police', label: 'POLICE', sub: 'Officier' },
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.tab, role === r.id && s.tabActive]}
                onPress={() => {
                  setRole(r.id);
                  if (r.id === 'police') nav('policeDashboard');
                }}
              >
                <Text style={[s.tabTxt, role === r.id && s.tabTxtA]}>{r.label}</Text>
                <Text style={[s.tabSub, role === r.id && s.tabSubA]}>{r.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.authTitle}>Driver Authentication</Text>
          <Text style={s.authFr}>Veuillez vous identifier pour continuer</Text>

          {/* Badge */}
          <Text style={s.lbl}>
            BADGE NUMBER{'  '}<Text style={s.lblFr}>N° DE BADGE</Text>
          </Text>
          <View style={s.inputRow}>
            <Text style={s.inputIco}>🪪</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., TX-YDE-001"
              placeholderTextColor="#bbb"
              value={badge}
              onChangeText={setBadge}
              autoCapitalize="characters"
            />
          </View>

          {/* Network selector */}
          <Text style={s.lbl}>
            ACTIVE NETWORK{'  '}<Text style={s.lblFr}>RÉSEAU ACTIF</Text>
          </Text>
          <View style={s.netRow}>
            {[
              { id: 'MTN',    dot: GOLD      },
              { id: 'ORANGE', dot: RED       },
              { id: 'CAMTEL', dot: '#42a5f5' },
            ].map(({ id, dot }) => (
              <TouchableOpacity
                key={id}
                style={[s.netBtn, network === id && s.netBtnActive]}
                onPress={() => setNetwork(id)}
              >
                <Text style={[s.netTxt, network === id && s.netTxtActive]}>{id}</Text>
                <View style={[s.netDot, { backgroundColor: dot }]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Password */}
          <Text style={s.lbl}>
            PASSWORD{'  '}<Text style={s.lblFr}>MOT DE PASSE</Text>
          </Text>
          <View style={s.inputRow}>
            <Text style={s.inputIco}>🔒</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={{ fontSize: 18 }}>👁</Text>
            </TouchableOpacity>
          </View>

          {/* Initialize button */}
          <TouchableOpacity
            style={s.initBtn}
            onPress={() => nav('driverDashboard')}
            activeOpacity={0.85}
          >
            <Text style={s.initTxt}>INITIALIZE SESSION  →</Text>
          </TouchableOpacity>

          {/* Links */}
          <View style={s.linksRow}>
            <TouchableOpacity><Text style={s.linkBlue}>HELP DESK</Text></TouchableOpacity>
            <TouchableOpacity><Text style={s.linkDark}>RESET CREDENTIALS</Text></TouchableOpacity>
          </View>

          <View style={s.createRow}>
            <Text style={s.createGrey}>New to the network?{'  '}</Text>
            <TouchableOpacity onPress={() => nav('signup')}>
              <Text style={s.createRed}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.version}>SYSTEM VERSION 4.2.0-ALPHA</Text>
          <Text style={s.cert}>🛡  DGSN CERTIFIED</Text>
          <Text style={s.cert}>🔒  END-TO-END ENCRYPTION</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#efefef' },
  scroll:    { alignItems: 'center', paddingTop: 36, paddingBottom: 50 },
  shieldWrap:{ marginBottom: 14 },
  shield:    { width: 68, height: 68, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  shieldTxt: { fontSize: 34 },
  appName:   { fontSize: 28, fontWeight: '800', color: '#111' },
  appSub:    { fontSize: 11, color: '#888', letterSpacing: 1, marginBottom: 28, marginTop: 2 },
  card:      { width: '92%', backgroundColor: '#fff', borderRadius: 22, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 5 },
  tabs:      { flexDirection: 'row', backgroundColor: '#f2f2f2', borderRadius: 14, padding: 4, marginBottom: 22 },
  tab:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  tabActive: { backgroundColor: RED },
  tabTxt:    { fontSize: 13, fontWeight: '800', color: '#666', letterSpacing: 0.8 },
  tabTxtA:   { color: '#fff' },
  tabSub:    { fontSize: 10, color: '#aaa', marginTop: 2 },
  tabSubA:   { color: '#ffc9c9' },
  authTitle: { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center' },
  authFr:    { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  lbl:       { fontSize: 11, fontWeight: '800', color: '#333', letterSpacing: 0.8, marginTop: 18 },
  lblFr:     { fontSize: 10, fontWeight: '400', color: '#aaa' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6f6f6', borderRadius: 13, paddingHorizontal: 14, height: 52, marginTop: 7 },
  inputIco:  { fontSize: 17, marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#222' },
  netRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  netBtn:    { flex: 0.31, alignItems: 'center', paddingVertical: 11, borderRadius: 13, backgroundColor: '#f6f6f6', borderWidth: 2, borderColor: 'transparent' },
  netBtnActive:{ backgroundColor: '#fffbea', borderColor: GOLD },
  netTxt:    { fontSize: 13, fontWeight: '700', color: '#666' },
  netTxtActive:{ color: '#222' },
  netDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  initBtn:   { backgroundColor: RED, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  initTxt:   { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  linksRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  linkBlue:  { fontSize: 12, fontWeight: '700', color: BLUE },
  linkDark:  { fontSize: 12, fontWeight: '600', color: '#444' },
  createRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  createGrey:{ fontSize: 13, color: '#777' },
  createRed: { fontSize: 13, fontWeight: '800', color: RED },
  version:   { fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 18, letterSpacing: 1 },
  cert:      { fontSize: 12, color: '#666', fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
