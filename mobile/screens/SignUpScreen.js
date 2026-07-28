import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { registerDriver, registerPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function SignupScreen({ nav }) {
  const { login } = useAuth();
  const [role,    setRole]    = useState('driver');
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    fullName: '', badgeId: '', phoneNumber: '', network: 'MTN',
    vehiclePlate: '', city: 'Yaoundé', password: '', confirmPass: '',
    stationName: '', stationId: '', district: '', commanderName: '', emergencyLine: '',
  });

  const isDriver = role === 'driver';
  const accent   = isDriver ? RED : BLUE;

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleRegister = async () => {
    if (isDriver) {
      if (!form.fullName.trim())     return Alert.alert('Missing', 'Enter your full name.');
      if (!form.badgeId.trim())      return Alert.alert('Missing', 'Enter your Badge ID (e.g. TX-YDE-010).');
      if (!form.phoneNumber.trim())  return Alert.alert('Missing', 'Enter your phone number.');
      if (!form.vehiclePlate.trim()) return Alert.alert('Missing', 'Enter your vehicle plate.');
      if (!form.password.trim())     return Alert.alert('Missing', 'Enter a password.');
      if (form.password.length < 6)  return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      if (form.password !== form.confirmPass) return Alert.alert('Mismatch', 'Passwords do not match.');
    } else {
      if (!form.stationName.trim())   return Alert.alert('Missing', 'Enter station name.');
      if (!form.stationId.trim())     return Alert.alert('Missing', 'Enter Station ID (e.g. YDE-PS-010).');
      if (!form.district.trim())      return Alert.alert('Missing', 'Enter your district.');
      if (!form.emergencyLine.trim()) return Alert.alert('Missing', 'Enter emergency line.');
      if (!form.password.trim())      return Alert.alert('Missing', 'Enter a password.');
      if (form.password !== form.confirmPass) return Alert.alert('Mismatch', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      let result;
      if (isDriver) {
        result = await registerDriver({
          fullName:     form.fullName.trim(),
          badgeId:      form.badgeId.trim().toUpperCase(),
          phoneNumber:  form.phoneNumber.trim(),
          network:      form.network,
          vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
          city:         form.city,
          password:     form.password,
        });
      } else {
        result = await registerPoliceStation({
          stationName:   form.stationName.trim(),
          stationId:     form.stationId.trim().toUpperCase(),
          district:      form.district.trim(),
          city:          form.city,
          commanderName: form.commanderName.trim(),
          emergencyLine: form.emergencyLine.trim(),
          password:      form.password,
        });
      }

      // Auto-login after successful registration
      if (result && (result.token || result.user)) {
        login(result, isDriver ? 'driver' : 'police');
      } else {
        Alert.alert(
          '✅ Registered!',
          isDriver
            ? 'Account created! Login with Badge ID: ' + form.badgeId.toUpperCase()
            : 'Account created! Login with Station ID: ' + form.stationId.toUpperCase(),
          [{ text: 'LOGIN NOW', onPress: () => nav('login') }]
        );
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('duplicate') || msg.includes('11000') || msg.includes('EXISTS')) {
        Alert.alert('ID Taken', isDriver
          ? 'Badge ID "' + form.badgeId.toUpperCase() + '" is already registered. Try TX-YDE-' + (Math.floor(Math.random()*900)+100)
          : 'Station ID already exists. Try a different one.'
        );
      } else if (msg.includes('network') || msg.includes('fetch')) {
        Alert.alert('Connection Error', 'Server is waking up. Please try again in 30 seconds.');
      } else {
        Alert.alert('Error', msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, k, placeholder, keyboard, auto, hint, secure }) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {hint && <Text style={s.hint}>{hint}</Text>}
      <TextInput
        style={[s.input, { borderColor: accent }]}
        value={form[k]}
        onChangeText={v => set(k, v)}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        keyboardType={keyboard || 'default'}
        autoCapitalize={auto || 'words'}
        autoCorrect={false}
        secureTextEntry={!!secure}
        returnKeyType="next"
        blurOnSubmit={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accent }]}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>

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

            {/* Role selector */}
            <View style={s.roleRow}>
              <TouchableOpacity
                style={[s.roleBtn, role === 'driver' && s.roleBtnActive]}
                onPress={() => setRole('driver')}
              >
                <MaterialIcons name="directions-car" size={16} color={role === 'driver' ? accent : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.roleTxt, role === 'driver' && { color: accent }]}>TAXI DRIVER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, role === 'police' && s.roleBtnActive]}
                onPress={() => setRole('police')}
              >
                <MaterialIcons name="local-police" size={16} color={role === 'police' ? accent : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.roleTxt, role === 'police' && { color: accent }]}>POLICE STATION</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={s.card}>
            <Text style={[s.cardTitle, { color: accent }]}>
              {isDriver ? 'DRIVER REGISTRATION' : 'POLICE REGISTRATION'}
            </Text>

            {isDriver ? (
              <>
                <F label="FULL NAME *"      k="fullName"     placeholder="e.g. Jean Paul Mbarga" />
                <F label="BADGE ID *"       k="badgeId"      placeholder="e.g. TX-YDE-010" auto="characters" hint="Your login ID — must be unique" />
                <F label="PHONE NUMBER *"   k="phoneNumber"  placeholder="e.g. 677000000" keyboard="phone-pad" auto="none" />
                <View style={s.field}>
                  <Text style={s.label}>NETWORK *</Text>
                  <View style={s.chips}>
                    {['MTN','Orange','Camtel','Nexttel'].map(n => (
                      <TouchableOpacity key={n} style={[s.chip, form.network===n && {backgroundColor: accent}]} onPress={() => set('network', n)}>
                        <Text style={[s.chipTxt, form.network===n && {color:'#fff'}]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <F label="VEHICLE PLATE *"  k="vehiclePlate" placeholder="e.g. LT-1234-A" auto="characters" />
                <View style={s.field}>
                  <Text style={s.label}>CITY *</Text>
                  <View style={s.chips}>
                    {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                      <TouchableOpacity key={c} style={[s.chip, form.city===c && {backgroundColor: accent}]} onPress={() => set('city', c)}>
                        <Text style={[s.chipTxt, form.city===c && {color:'#fff'}]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <F label="STATION NAME *"   k="stationName"   placeholder="e.g. Yaoundé Central Police" />
                <F label="STATION ID *"     k="stationId"     placeholder="e.g. YDE-PS-010" auto="characters" hint="Your login ID — must be unique" />
                <F label="DISTRICT *"       k="district"      placeholder="e.g. Centre Urbain" />
                <F label="COMMANDER NAME"   k="commanderName" placeholder="e.g. Commissaire Biya" />
                <F label="EMERGENCY LINE *" k="emergencyLine" placeholder="e.g. 222231234" keyboard="phone-pad" auto="none" />
                <View style={s.field}>
                  <Text style={s.label}>CITY *</Text>
                  <View style={s.chips}>
                    {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                      <TouchableOpacity key={c} style={[s.chip, form.city===c && {backgroundColor: accent}]} onPress={() => set('city', c)}>
                        <Text style={[s.chipTxt, form.city===c && {color:'#fff'}]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <F label="PASSWORD *"         k="password"    placeholder="Minimum 6 characters" auto="none" secure />
            <F label="CONFIRM PASSWORD *" k="confirmPass" placeholder="Re-enter password"    auto="none" secure />

            <TouchableOpacity
              style={[s.btn, { backgroundColor: accent }, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <MaterialIcons name={isDriver ? 'directions-car' : 'local-police'} size={20} color="#fff" />
                    <Text style={s.btnTxt}>{isDriver ? 'CREATE DRIVER ACCOUNT' : 'CREATE POLICE ACCOUNT'}</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => nav('login')} style={s.loginLink}>
              <MaterialIcons name="login" size={16} color={accent} />
              <Text style={[s.loginLinkTxt, { color: accent }]}>Already have an account? LOGIN</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
  roleRow:      { flexDirection: 'row', gap: 10 },
  roleBtn:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleBtnActive:{ backgroundColor: '#fff' },
  roleTxt:      { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  card:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, flex: 1 },
  cardTitle:    { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 20 },
  field:        { marginBottom: 16 },
  label:        { fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 4, letterSpacing: 0.5 },
  hint:         { fontSize: 10, color: '#aaa', marginBottom: 6 },
  input:        { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
  chips:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt:      { fontSize: 13, fontWeight: '600', color: '#555' },
  btn:          { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  loginLink:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  loginLinkTxt: { fontSize: 13, fontWeight: '700' },
});