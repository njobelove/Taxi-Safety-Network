import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import { loginDriver, loginPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const GOLD = '#f5c518';
const BLUE = '#1976D2';

export default function LoginScreen({ nav }) {
  const { login } = useAuth();

  const [role, setRole]         = useState('driver');
  const [network, setNetwork]   = useState('MTN');
  const [identifier, setId]     = useState('');   // badge_id or station_id
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (role === 'driver') {
        const driver = await loginDriver(identifier.trim(), password);
        login(driver, 'driver');
        nav('driverDashboard');
      } else {
        const station = await loginPoliceStation(identifier.trim(), password);
        login(station, 'police');
        nav('policeDashboard');
      }
    } catch (e) {
      if (e.message === 'INVALID_CREDENTIALS') {
        setError(
          role === 'driver'
            ? 'Invalid Badge ID or password. Please check and try again.'
            : 'Invalid Station ID or password. Please check and try again.'
        );
      } else {
        setError('Connection error. Check your internet and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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

        <View style={s.card}>

          {/* Driver / Police tabs */}
          <View style={s.tabs}>
            {[
              { id: 'driver', label: 'DRIVER',  sub: 'Conducteur' },
              { id: 'police', label: 'POLICE',  sub: 'Officier'   },
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.tab, role === r.id && s.tabActive]}
                onPress={() => { setRole(r.id); setError(''); setId(''); setPassword(''); }}
              >
                <Text style={[s.tabTxt, role === r.id && s.tabTxtA]}>{r.label}</Text>
                <Text style={[s.tabSub, role === r.id && s.tabSubA]}>{r.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.authTitle}>
            {role === 'driver' ? 'Driver Authentication' : 'Station Authentication'}
          </Text>
          <Text style={s.authFr}>
            {role === 'driver'
              ? 'Veuillez vous identifier pour continuer'
              : 'Authentification de la station de police'}
          </Text>

          {/* Badge ID / Station ID */}
          <Text style={s.lbl}>
            {role === 'driver' ? 'BADGE ID' : 'STATION ID'}
            {'  '}
            <Text style={s.lblFr}>
              {role === 'driver' ? 'N° DE BADGE' : 'ID DE LA STATION'}
            </Text>
          </Text>
          <View style={[s.inputRow, error && !password ? s.inputError : null]}>
            <Text style={s.inputIco}>{role === 'driver' ? '🪪' : '🏛'}</Text>
            <TextInput
              style={s.input}
              placeholder={role === 'driver' ? 'e.g., TX-YDE-001' : 'e.g., YDE-PS-001'}
              placeholderTextColor="#bbb"
              value={identifier}
              onChangeText={(t) => { setId(t); setError(''); }}
              autoCapitalize="characters"
            />
          </View>

          {/* Network selector — driver only */}
          {role === 'driver' && (
            <>
              <Text style={s.lbl}>ACTIVE NETWORK{'  '}<Text style={s.lblFr}>RÉSEAU ACTIF</Text></Text>
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
            </>
          )}

          {/* Password */}
          <Text style={s.lbl}>PASSWORD{'  '}<Text style={s.lblFr}>MOT DE PASSE</Text></Text>
          <View style={[s.inputRow, error && s.inputError]}>
            <Text style={s.inputIco}>🔒</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Text style={{ fontSize: 18 }}>👁</Text>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorIco}>⚠</Text>
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Login button */}
          <TouchableOpacity
            style={[s.initBtn, loading && s.initBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.initTxt}>INITIALIZE SESSION  →</Text>
            }
          </TouchableOpacity>

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
  safe:         { flex: 1, backgroundColor: '#efefef' },
  scroll:       { alignItems: 'center', paddingTop: 36, paddingBottom: 50 },
  shieldWrap:   { marginBottom: 14 },
  shield:       { width: 68, height: 68, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  shieldTxt:    { fontSize: 34 },
  appName:      { fontSize: 28, fontWeight: '800', color: '#111' },
  appSub:       { fontSize: 11, color: '#888', letterSpacing: 1, marginBottom: 28, marginTop: 2 },
  card:         { width: '92%', backgroundColor: '#fff', borderRadius: 22, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 5 },
  tabs:         { flexDirection: 'row', backgroundColor: '#f2f2f2', borderRadius: 14, padding: 4, marginBottom: 22 },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  tabActive:    { backgroundColor: RED },
  tabTxt:       { fontSize: 13, fontWeight: '800', color: '#666', letterSpacing: 0.8 },
  tabTxtA:      { color: '#fff' },
  tabSub:       { fontSize: 10, color: '#aaa', marginTop: 2 },
  tabSubA:      { color: '#ffc9c9' },
  authTitle:    { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center' },
  authFr:       { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  lbl:          { fontSize: 11, fontWeight: '800', color: '#333', letterSpacing: 0.8, marginTop: 18 },
  lblFr:        { fontSize: 10, fontWeight: '400', color: '#aaa' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6f6f6', borderRadius: 13, paddingHorizontal: 14, height: 52, marginTop: 7, borderWidth: 1.5, borderColor: 'transparent' },
  inputError:   { borderColor: RED },
  inputIco:     { fontSize: 17, marginRight: 10 },
  input:        { flex: 1, fontSize: 15, color: '#222' },
  netRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  netBtn:       { flex: 0.31, alignItems: 'center', paddingVertical: 11, borderRadius: 13, backgroundColor: '#f6f6f6', borderWidth: 2, borderColor: 'transparent' },
  netBtnActive: { backgroundColor: '#fffbea', borderColor: GOLD },
  netTxt:       { fontSize: 13, fontWeight: '700', color: '#666' },
  netTxtActive: { color: '#222' },
  netDot:       { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fde8e8', borderRadius: 10, padding: 12, marginTop: 14 },
  errorIco:     { fontSize: 16, color: RED, marginRight: 8 },
  errorTxt:     { flex: 1, fontSize: 12, color: RED, fontWeight: '600', lineHeight: 18 },
  initBtn:      { backgroundColor: RED, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  initBtnDisabled:{ backgroundColor: '#e88' },
  initTxt:      { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  linksRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  linkBlue:     { fontSize: 12, fontWeight: '700', color: BLUE },
  linkDark:     { fontSize: 12, fontWeight: '600', color: '#444' },
  createRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  createGrey:   { fontSize: 13, color: '#777' },
  createRed:    { fontSize: 13, fontWeight: '800', color: RED },
  version:      { fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 18, letterSpacing: 1 },
  cert:         { fontSize: 12, color: '#666', fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
