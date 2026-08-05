import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { registerDriver, registerPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function SignupScreen({ nav }) {
  const { login }  = useAuth();
  const [role,     setRole]    = useState('driver');
  const [network,  setNetwork] = useState('MTN');
  const [city,     setCity]    = useState('Yaoundé');
  const [loading,  setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDriver = role === 'driver';
  const accent   = isDriver ? RED : BLUE;

  // useRef for all text values — NO re-render on typing
  const fullName     = useRef('');
  const badgeId      = useRef('');
  const phoneNumber  = useRef('');
  const vehiclePlate = useRef('');
  const password     = useRef('');
  const confirmPass  = useRef('');
  const stationName  = useRef('');
  const stationId    = useRef('');
  const district     = useRef('');
  const commanderName= useRef('');
  const emergencyLine= useRef('');

  const handleRegister = async () => {
    setErrorMsg('');
    if (isDriver) {
      if (!fullName.current.trim())     return setErrorMsg('Enter your full name.');
      if (!badgeId.current.trim())      return setErrorMsg('Enter your Badge ID e.g. TX-YDE-010');
      if (!phoneNumber.current.trim())  return setErrorMsg('Enter your phone number.');
      if (!vehiclePlate.current.trim()) return setErrorMsg('Enter your vehicle plate.');
      if (!password.current.trim())     return setErrorMsg('Enter a password.');
      if (password.current.length < 6)  return setErrorMsg('Password must be at least 6 characters.');
      if (password.current !== confirmPass.current) return setErrorMsg('Passwords do not match.');
    } else {
      if (!stationName.current.trim())   return setErrorMsg('Enter station name.');
      if (!stationId.current.trim())     return setErrorMsg('Enter Station ID e.g. YDE-PS-010');
      if (!district.current.trim())      return setErrorMsg('Enter your district.');
      if (!emergencyLine.current.trim()) return setErrorMsg('Enter emergency line.');
      if (!password.current.trim())      return setErrorMsg('Enter a password.');
      if (password.current !== confirmPass.current) return setErrorMsg('Passwords do not match.');
    }

    setLoading(true);
    try {
      let result;
      if (isDriver) {
        result = await registerDriver({
          fullName:     fullName.current.trim(),
          badgeId:      badgeId.current.trim().toUpperCase(),
          phoneNumber:  phoneNumber.current.trim(),
          network,
          vehiclePlate: vehiclePlate.current.trim().toUpperCase(),
          city,
          password:     password.current,
        });
      } else {
        result = await registerPoliceStation({
          stationName:   stationName.current.trim(),
          stationId:     stationId.current.trim().toUpperCase(),
          district:      district.current.trim(),
          city,
          commanderName: commanderName.current.trim(),
          emergencyLine: emergencyLine.current.trim(),
          password:      password.current,
        });
      }

      if (result && (result.token || result.user)) {
        login(result, isDriver ? 'driver' : 'police');
      } else {
        Alert.alert('✅ Registered!',
          isDriver
            ? 'Login with Badge ID: ' + badgeId.current.toUpperCase()
            : 'Login with Station ID: ' + stationId.current.toUpperCase(),
          [{ text: 'LOGIN', onPress: () => nav('login') }]
        );
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('duplicate') || msg.includes('11000') || msg.includes('EXISTS')) {
        setErrorMsg(isDriver
          ? 'Badge ID "' + badgeId.current.toUpperCase() + '" already taken. Try TX-YDE-' + (Math.floor(Math.random()*900)+100)
          : 'Station ID already taken. Try a different one.'
        );
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect')) {
        setErrorMsg('Server waking up. Please wait 30 seconds and try again.');
      } else {
        setErrorMsg(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accent }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.top}>
            <TouchableOpacity onPress={() => nav('login')} style={s.backRow}>
              <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
              <Text style={s.backTxt}>Back to Login</Text>
            </TouchableOpacity>
            <View style={s.logoRow}>
              <View style={s.logoCircle}>
                <Ionicons name="shield-checkmark" size={36} color={accent} />
              </View>
              <View>
                <Text style={s.topTitle}>CREATE ACCOUNT</Text>
                <Text style={s.topSub}>TSN — Cameroon</Text>
              </View>
            </View>
            <View style={s.roleRow}>
              <TouchableOpacity style={[s.roleBtn, isDriver && s.roleBtnActive]} onPress={() => setRole('driver')}>
                <MaterialIcons name="directions-car" size={16} color={isDriver ? accent : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.roleTxt, isDriver && { color: accent }]}>TAXI DRIVER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.roleBtn, !isDriver && s.roleBtnActive]} onPress={() => setRole('police')}>
                <MaterialIcons name="local-police" size={16} color={!isDriver ? accent : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.roleTxt, !isDriver && { color: accent }]}>POLICE STATION</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: accent }]}>
              {isDriver ? 'DRIVER REGISTRATION' : 'POLICE REGISTRATION'}
            </Text>

            {errorMsg ? (
              <View style={s.errorBox}>
                <MaterialIcons name="warning" size={16} color={RED} />
                <Text style={s.errorTxt}>{errorMsg}</Text>
              </View>
            ) : null}

            {isDriver ? (
              <>
                <Text style={s.lbl}>FULL NAME *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { fullName.current = v; }}
                  placeholder="e.g. Jean Paul Mbarga"
                  placeholderTextColor="#aaa" autoCorrect={false} />

                <Text style={s.lbl}>BADGE ID * <Text style={s.hint}>(your login ID, e.g. TX-YDE-010)</Text></Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { badgeId.current = v.toUpperCase(); }}
                  placeholder="e.g. TX-YDE-010"
                  placeholderTextColor="#aaa" autoCapitalize="characters" autoCorrect={false} />

                <Text style={s.lbl}>PHONE NUMBER *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { phoneNumber.current = v; }}
                  placeholder="e.g. 677000000"
                  placeholderTextColor="#aaa" keyboardType="phone-pad" autoCorrect={false} />

                <Text style={s.lbl}>NETWORK *</Text>
                <View style={s.chips}>
                  {['MTN','Orange','Camtel','Nexttel'].map(n => (
                    <TouchableOpacity key={n} style={[s.chip, network===n && {backgroundColor:accent}]} onPress={() => setNetwork(n)}>
                      <Text style={[s.chipTxt, network===n && {color:'#fff'}]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.lbl}>VEHICLE PLATE *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { vehiclePlate.current = v.toUpperCase(); }}
                  placeholder="e.g. LT-1234-A"
                  placeholderTextColor="#aaa" autoCapitalize="characters" autoCorrect={false} />
              </>
            ) : (
              <>
                <Text style={s.lbl}>STATION NAME *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { stationName.current = v; }}
                  placeholder="e.g. Yaoundé Central Police"
                  placeholderTextColor="#aaa" autoCorrect={false} />

                <Text style={s.lbl}>STATION ID * <Text style={s.hint}>(your login ID, e.g. YDE-PS-010)</Text></Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { stationId.current = v.toUpperCase(); }}
                  placeholder="e.g. YDE-PS-010"
                  placeholderTextColor="#aaa" autoCapitalize="characters" autoCorrect={false} />

                <Text style={s.lbl}>DISTRICT *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { district.current = v; }}
                  placeholder="e.g. Centre Urbain"
                  placeholderTextColor="#aaa" autoCorrect={false} />

                <Text style={s.lbl}>COMMANDER NAME</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { commanderName.current = v; }}
                  placeholder="e.g. Commissaire Biya"
                  placeholderTextColor="#aaa" autoCorrect={false} />

                <Text style={s.lbl}>EMERGENCY LINE *</Text>
                <TextInput style={[s.inp, { borderColor: accent }]}
                  onChangeText={v => { emergencyLine.current = v; }}
                  placeholder="e.g. 222231234"
                  placeholderTextColor="#aaa" keyboardType="phone-pad" autoCorrect={false} />
              </>
            )}

            <Text style={s.lbl}>CITY *</Text>
            <View style={s.chips}>
              {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                <TouchableOpacity key={c} style={[s.chip, city===c && {backgroundColor:accent}]} onPress={() => setCity(c)}>
                  <Text style={[s.chipTxt, city===c && {color:'#fff'}]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.lbl}>PASSWORD *</Text>
            <TextInput style={[s.inp, { borderColor: accent }]}
              onChangeText={v => { password.current = v; }}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#aaa" secureTextEntry autoCorrect={false} autoCapitalize="none" />

            <Text style={s.lbl}>CONFIRM PASSWORD *</Text>
            <TextInput style={[s.inp, { borderColor: accent }]}
              onChangeText={v => { confirmPass.current = v; }}
              placeholder="Re-enter password"
              placeholderTextColor="#aaa" secureTextEntry autoCorrect={false} autoCapitalize="none" />

            <TouchableOpacity
              style={[s.btn, { backgroundColor: accent }, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name={isDriver ? 'directions-car' : 'local-police'} size={20} color="#fff" />
                  <Text style={s.btnTxt}>{isDriver ? 'CREATE DRIVER ACCOUNT' : 'CREATE POLICE ACCOUNT'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => nav('login')} style={s.loginLink}>
              <MaterialIcons name="login" size={16} color={accent} />
              <Text style={[s.loginLinkTxt, { color: accent }]}>Already have an account? LOGIN</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1 },
  top:          { padding: 20, paddingTop: 16, paddingBottom: 24 },
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backTxt:      { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  logoCircle:   { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  topTitle:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  topSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  roleRow:      { flexDirection: 'row', gap: 10, marginTop: 8 },
  roleBtn:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleBtnActive:{ backgroundColor: '#fff' },
  roleTxt:      { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  card:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, flex: 1 },
  cardTitle:    { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 16 },
  lbl:          { fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 4, letterSpacing: 0.5 },
  hint:         { fontSize: 10, color: '#aaa', fontWeight: '400' },
  inp:          { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111', backgroundColor: '#fafafa', marginBottom: 14 },
  chips:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  chip:         { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt:      { fontSize: 13, fontWeight: '600', color: '#555' },
  btn:          { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  loginLink:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  loginLinkTxt: { fontSize: 13, fontWeight: '700' },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8e8', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorTxt:     { fontSize: 13, color: RED, fontWeight: '600', flex: 1 },
});