import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { registerDriver, registerPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

// Field component OUTSIDE the main component so it never gets recreated
const Field = ({ label, value, onChange, placeholder, keyboard, auto, hint, secure, accent }) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    {hint ? <Text style={s.hint}>{hint}</Text> : null}
    <TextInput
      style={[s.input, { borderColor: accent }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      keyboardType={keyboard || 'default'}
      autoCapitalize={auto || 'words'}
      autoCorrect={false}
      autoComplete="off"
      secureTextEntry={!!secure}
      returnKeyType="next"
      blurOnSubmit={false}
    />
  </View>
);

export default function SignupScreen({ nav }) {
  const { login } = useAuth();
  const [role,        setRole]        = useState('driver');
  const [loading,     setLoading]     = useState(false);
  const [fullName,    setFullName]    = useState('');
  const [badgeId,     setBadgeId]     = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network,     setNetwork]     = useState('MTN');
  const [vehiclePlate,setVehiclePlate]= useState('');
  const [city,        setCity]        = useState('Yaoundé');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationId,   setStationId]   = useState('');
  const [district,    setDistrict]    = useState('');
  const [commanderName,setCommanderName]=useState('');
  const [emergencyLine,setEmergencyLine]=useState('');

  const isDriver = role === 'driver';
  const accent   = isDriver ? RED : BLUE;

  const handleRegister = async () => {
    if (isDriver) {
      if (!fullName.trim())     return Alert.alert('Missing', 'Enter your full name.');
      if (!badgeId.trim())      return Alert.alert('Missing', 'Enter your Badge ID e.g. TX-YDE-010');
      if (!phoneNumber.trim())  return Alert.alert('Missing', 'Enter your phone number.');
      if (!vehiclePlate.trim()) return Alert.alert('Missing', 'Enter your vehicle plate.');
      if (!password.trim())     return Alert.alert('Missing', 'Enter a password.');
      if (password.length < 6)  return Alert.alert('Weak', 'Password must be at least 6 characters.');
      if (password !== confirmPass) return Alert.alert('Mismatch', 'Passwords do not match.');
    } else {
      if (!stationName.trim())   return Alert.alert('Missing', 'Enter station name.');
      if (!stationId.trim())     return Alert.alert('Missing', 'Enter Station ID e.g. YDE-PS-010');
      if (!district.trim())      return Alert.alert('Missing', 'Enter your district.');
      if (!emergencyLine.trim()) return Alert.alert('Missing', 'Enter emergency line.');
      if (!password.trim())      return Alert.alert('Missing', 'Enter a password.');
      if (password !== confirmPass) return Alert.alert('Mismatch', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      let result;
      if (isDriver) {
        result = await registerDriver({
          fullName: fullName.trim(),
          badgeId: badgeId.trim().toUpperCase(),
          phoneNumber: phoneNumber.trim(),
          network,
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          city,
          password,
        });
      } else {
        result = await registerPoliceStation({
          stationName: stationName.trim(),
          stationId: stationId.trim().toUpperCase(),
          district: district.trim(),
          city,
          commanderName: commanderName.trim(),
          emergencyLine: emergencyLine.trim(),
          password,
        });
      }

      if (result && (result.token || result.user)) {
        login(result, isDriver ? 'driver' : 'police');
      } else {
        Alert.alert('Registered!',
          isDriver
            ? 'Account created! Login with Badge ID: ' + badgeId.toUpperCase()
            : 'Account created! Login with Station ID: ' + stationId.toUpperCase(),
          [{ text: 'LOGIN NOW', onPress: () => nav('login') }]
        );
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('duplicate') || msg.includes('11000') || msg.includes('EXISTS')) {
        Alert.alert('ID Taken',
          isDriver
            ? 'Badge ID "' + badgeId.toUpperCase() + '" already exists. Try TX-YDE-' + (Math.floor(Math.random()*900)+100)
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

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accent }]}>
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

        {/* Form Card */}
        <View style={s.card}>
          <Text style={[s.cardTitle, { color: accent }]}>
            {isDriver ? 'DRIVER REGISTRATION' : 'POLICE REGISTRATION'}
          </Text>

          {isDriver ? (
            <>
              <Field label="FULL NAME *"     value={fullName}     onChange={setFullName}     placeholder="e.g. Jean Paul Mbarga"  accent={accent} />
              <Field label="BADGE ID *"      value={badgeId}      onChange={v => setBadgeId(v.toUpperCase())}     placeholder="e.g. TX-YDE-010" auto="characters" hint="Your login ID — must be unique" accent={accent} />
              <Field label="PHONE NUMBER *"  value={phoneNumber}  onChange={setPhoneNumber}  placeholder="e.g. 677000000" keyboard="phone-pad" auto="none" accent={accent} />

              <View style={s.field}>
                <Text style={s.label}>NETWORK *</Text>
                <View style={s.chips}>
                  {['MTN','Orange','Camtel','Nexttel'].map(n => (
                    <TouchableOpacity key={n} style={[s.chip, network===n && {backgroundColor:accent}]} onPress={() => setNetwork(n)}>
                      <Text style={[s.chipTxt, network===n && {color:'#fff'}]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Field label="VEHICLE PLATE *" value={vehiclePlate} onChange={v => setVehiclePlate(v.toUpperCase())} placeholder="e.g. LT-1234-A" auto="characters" accent={accent} />

              <View style={s.field}>
                <Text style={s.label}>CITY *</Text>
                <View style={s.chips}>
                  {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                    <TouchableOpacity key={c} style={[s.chip, city===c && {backgroundColor:accent}]} onPress={() => setCity(c)}>
                      <Text style={[s.chipTxt, city===c && {color:'#fff'}]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              <Field label="STATION NAME *"   value={stationName}   onChange={setStationName}   placeholder="e.g. Yaoundé Central Police" accent={accent} />
              <Field label="STATION ID *"     value={stationId}     onChange={v => setStationId(v.toUpperCase())}     placeholder="e.g. YDE-PS-010" auto="characters" hint="Your login ID — must be unique" accent={accent} />
              <Field label="DISTRICT *"       value={district}      onChange={setDistrict}      placeholder="e.g. Centre Urbain" accent={accent} />
              <Field label="COMMANDER NAME"   value={commanderName} onChange={setCommanderName} placeholder="e.g. Commissaire Biya" accent={accent} />
              <Field label="EMERGENCY LINE *" value={emergencyLine} onChange={setEmergencyLine} placeholder="e.g. 222231234" keyboard="phone-pad" auto="none" accent={accent} />

              <View style={s.field}>
                <Text style={s.label}>CITY *</Text>
                <View style={s.chips}>
                  {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                    <TouchableOpacity key={c} style={[s.chip, city===c && {backgroundColor:accent}]} onPress={() => setCity(c)}>
                      <Text style={[s.chipTxt, city===c && {color:'#fff'}]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <Field label="PASSWORD *"         value={password}    onChange={setPassword}    placeholder="Minimum 6 characters" auto="none" secure accent={accent} />
          <Field label="CONFIRM PASSWORD *" value={confirmPass} onChange={setConfirmPass} placeholder="Re-enter password"    auto="none" secure accent={accent} />

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
