import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { registerDriver, registerPoliceStation } from '../services/api';

const RED  = '#d32f2f';
const BLUE = '#1565C0';
const GOLD = '#f5c518';

export default function SignupScreen({ nav }) {
  const [role,         setRole]         = useState('driver');
  const [loading,      setLoading]      = useState(false);
  const [fullName,     setFullName]     = useState('');
  const [badgeId,      setBadgeId]      = useState('');
  const [phoneNumber,  setPhoneNumber]  = useState('');
  const [network,      setNetwork]      = useState('MTN');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [city,         setCity]         = useState('Yaoundé');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [stationName,  setStationName]  = useState('');
  const [stationId,    setStationId]    = useState('');
  const [district,     setDistrict]     = useState('');
  const [commanderName,setCommanderName]= useState('');
  const [emergencyLine,setEmergencyLine]= useState('');

  const isDriver = role === 'driver';
  const accent   = isDriver ? RED : BLUE;

  const validateAndRegister = async () => {
    if (isDriver) {
      if (!fullName.trim())     return Alert.alert('Missing Field', 'Please enter your full name.');
      if (!badgeId.trim())      return Alert.alert('Missing Field', 'Please enter your Badge ID (e.g. TX-YDE-001).');
      if (!phoneNumber.trim())  return Alert.alert('Missing Field', 'Please enter your phone number.');
      if (!vehiclePlate.trim()) return Alert.alert('Missing Field', 'Please enter your vehicle plate.');
      if (!password.trim())     return Alert.alert('Missing Field', 'Please enter a password.');
      if (password.length < 6)  return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      if (password !== confirmPass) return Alert.alert('Password Mismatch', 'Passwords do not match.');
    } else {
      if (!stationName.trim())   return Alert.alert('Missing Field', 'Please enter your station name.');
      if (!stationId.trim())     return Alert.alert('Missing Field', 'Please enter your Station ID.');
      if (!district.trim())      return Alert.alert('Missing Field', 'Please enter your district.');
      if (!emergencyLine.trim()) return Alert.alert('Missing Field', 'Please enter your emergency line.');
      if (!password.trim())      return Alert.alert('Missing Field', 'Please enter a password.');
      if (password !== confirmPass) return Alert.alert('Password Mismatch', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      if (isDriver) {
        await registerDriver({
          fullName, badgeId: badgeId.trim().toUpperCase(),
          phoneNumber, network, vehiclePlate: vehiclePlate.trim().toUpperCase(),
          city, password,
        });
      } else {
        await registerPoliceStation({
          stationName, stationId: stationId.trim().toUpperCase(),
          district, city, commanderName, emergencyLine, password,
        });
      }
      Alert.alert(
        '✅ Registration Successful!',
        isDriver
          ? 'Account created!\n\nYour Badge ID: ' + badgeId.toUpperCase() + '\n\nUse this ID to log in — NOT your vehicle plate.'
          : 'Account created!\n\nYour Station ID: ' + stationId.toUpperCase() + '\n\nUse this ID to log in.',
        [{ text: 'GO TO LOGIN', onPress: () => nav('login') }]
      );
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('BADGE_EXISTS') || msg.includes('STATION_EXISTS') || msg.includes('duplicate') || msg.includes('11000')) {
        Alert.alert(
          '⚠ ID Already Taken',
          isDriver
            ? 'Badge ID "' + badgeId.toUpperCase() + '" is already registered.\n\nPlease choose a different Badge ID.\n\nExample: TX-YDE-' + (Math.floor(Math.random()*900)+100)
            : 'Station ID "' + stationId.toUpperCase() + '" is already registered.\n\nPlease choose a different Station ID.'
        );
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect')) {
        Alert.alert('Connection Error', 'Server is waking up (~50 seconds). Please try again.');
      } else {
        Alert.alert('Registration Failed', msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, keyboard, auto, hint, secure }) => (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
      <TextInput
        style={[s.input, { borderColor: accent }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.5)"
        keyboardType={keyboard || 'default'}
        autoCapitalize={auto || 'words'}
        autoCorrect={false}
        secureTextEntry={!!secure}
      />
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accent }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* RED/BLUE Header */}
          <View style={s.topSection}>
            <TouchableOpacity onPress={() => nav('login')} style={s.backRow}>
              <Text style={s.backTxt}>← Back to Login</Text>
            </TouchableOpacity>
            <Text style={s.topTitle}>CREATE ACCOUNT</Text>
            <Text style={s.topSub}>TSN — Taxi Safety Network · Cameroon</Text>

            {/* Role selector */}
            <View style={s.roleRow}>
              <TouchableOpacity
                style={[s.roleBtn, role === 'driver' && s.roleBtnActive]}
                onPress={() => setRole('driver')}
              >
                <Text style={[s.roleTxt, role === 'driver' && s.roleTxtActive]}>🚖 TAXI DRIVER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, role === 'police' && s.roleBtnActive]}
                onPress={() => setRole('police')}
              >
                <Text style={[s.roleTxt, role === 'police' && s.roleTxtActive]}>🏛 POLICE STATION</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* White form card */}
          <View style={s.formCard}>
            <Text style={[s.formTitle, { color: accent }]}>
              {isDriver ? '🚖 DRIVER REGISTRATION' : '🏛 POLICE REGISTRATION'}
            </Text>

            {isDriver ? (
              <>
                <Field label="FULL NAME *"      value={fullName}     onChange={setFullName}     placeholder="e.g. Jean Paul Mbarga" />
                <Field label="BADGE ID *"       value={badgeId}      onChange={v => setBadgeId(v.toUpperCase())} placeholder="e.g. TX-YDE-001" auto="characters"
                  hint="This is your login ID — must be unique" />
                <Field label="PHONE NUMBER *"   value={phoneNumber}  onChange={setPhoneNumber}  placeholder="e.g. 677000000" keyboard="phone-pad" auto="none" />

                <View style={s.field}>
                  <Text style={s.fieldLabel}>MOBILE NETWORK *</Text>
                  <View style={s.chipRow}>
                    {['MTN', 'Orange', 'Camtel', 'Nexttel'].map(n => (
                      <TouchableOpacity key={n} style={[s.chip, network===n && { backgroundColor: accent }]} onPress={() => setNetwork(n)}>
                        <Text style={[s.chipTxt, network===n && { color: '#fff' }]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Field label="VEHICLE PLATE *"  value={vehiclePlate} onChange={v => setVehiclePlate(v.toUpperCase())} placeholder="e.g. LT-1234-A" auto="characters" />

                <View style={s.field}>
                  <Text style={s.fieldLabel}>CITY *</Text>
                  <View style={s.chipRow}>
                    {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                      <TouchableOpacity key={c} style={[s.chip, city===c && { backgroundColor: accent }]} onPress={() => setCity(c)}>
                        <Text style={[s.chipTxt, city===c && { color: '#fff' }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Field label="STATION NAME *"   value={stationName}   onChange={setStationName}   placeholder="e.g. Yaoundé Central Police Station" />
                <Field label="STATION ID *"     value={stationId}     onChange={v => setStationId(v.toUpperCase())} placeholder="e.g. YDE-PS-001" auto="characters"
                  hint="This is your login ID — must be unique" />
                <Field label="DISTRICT *"       value={district}      onChange={setDistrict}      placeholder="e.g. Centre Urbain" />
                <Field label="COMMANDER NAME"   value={commanderName} onChange={setCommanderName} placeholder="e.g. Commissaire Biya" />
                <Field label="EMERGENCY LINE *" value={emergencyLine} onChange={setEmergencyLine} placeholder="e.g. 222231234" keyboard="phone-pad" auto="none" />

                <View style={s.field}>
                  <Text style={s.fieldLabel}>CITY *</Text>
                  <View style={s.chipRow}>
                    {['Yaoundé','Douala','Bafoussam','Bamenda','Garoua'].map(c => (
                      <TouchableOpacity key={c} style={[s.chip, city===c && { backgroundColor: accent }]} onPress={() => setCity(c)}>
                        <Text style={[s.chipTxt, city===c && { color: '#fff' }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Field label="PASSWORD *"         value={password}     onChange={setPassword}     placeholder="Minimum 6 characters" auto="none" secure />
            <Field label="CONFIRM PASSWORD *" value={confirmPass}  onChange={setConfirmPass}  placeholder="Re-enter your password" auto="none" secure />

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: accent }, loading && { opacity: 0.7 }]}
              onPress={validateAndRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitTxt}>
                    {isDriver ? '🚖 CREATE DRIVER ACCOUNT' : '🏛 CREATE POLICE ACCOUNT'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => nav('login')} style={s.loginLink}>
              <Text style={[s.loginLinkTxt, { color: accent }]}>Already have an account? LOGIN HERE →</Text>
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
  topSection:   { padding: 20, paddingTop: 40, paddingBottom: 30 },
  backRow:      { marginBottom: 16 },
  backTxt:      { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  topTitle:     { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 },
  topSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  roleRow:      { flexDirection: 'row', gap: 10 },
  roleBtn:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleBtnActive:{ backgroundColor: '#fff' },
  roleTxt:      { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  roleTxtActive:{ color: '#333' },
  formCard:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, flex: 1, minHeight: 600 },
  formTitle:    { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 20 },
  field:        { marginBottom: 16 },
  fieldLabel:   { fontSize: 11, fontWeight: '800', color: '#555', marginBottom: 4, letterSpacing: 0.5 },
  fieldHint:    { fontSize: 10, color: '#aaa', marginBottom: 6 },
  input:        { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
  chipRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt:      { fontSize: 13, fontWeight: '600', color: '#555' },
  submitBtn:    { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  submitTxt:    { fontSize: 15, fontWeight: '900', color: '#fff' },
  loginLink:    { alignItems: 'center', paddingVertical: 10 },
  loginLinkTxt: { fontSize: 13, fontWeight: '700' },
});