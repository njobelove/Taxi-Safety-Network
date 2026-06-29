import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, Alert,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { loginDriver, loginPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function LoginScreen({ nav }) {
  const { login } = useAuth();
  const [role,       setRole]       = useState('driver');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const isDriver = role === 'driver';
  const accent   = isDriver ? RED : BLUE;

  const handleLogin = async () => {
    const id = identifier.trim();
    const pw = password.trim();
    if (!id) return Alert.alert('Missing Field', isDriver ? 'Please enter your Badge ID.' : 'Please enter your Station ID.');
    if (!pw) return Alert.alert('Missing Field', 'Please enter your password.');
    setLoading(true);
    try {
      const result = isDriver ? await loginDriver(id, pw) : await loginPoliceStation(id, pw);
      if (result && (result.token || result.user)) {
        login(result, isDriver ? 'driver' : 'police');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials.');
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('INVALID_CREDENTIALS') || msg.includes('401')) {
        Alert.alert('Login Failed',
          isDriver
            ? 'Wrong Badge ID or password.\n\nYour Badge ID looks like: TX-YDE-001\nNOT your vehicle plate.'
            : 'Wrong Station ID or password.\n\nStation ID format: YDE-PS-001'
        );
      } else {
        Alert.alert('Connection Error', 'Server may be waking up (~50 sec). Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: accent }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Top section with color */}
          <View style={s.topSection}>
            <View style={s.logoCircle}>
              <Ionicons name="shield-checkmark" size={52} color={accent} />
            </View>
            <Text style={s.appName}>TAXI SAFETY NETWORK</Text>
            <Text style={s.appSub}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
            <Text style={s.appCity}>Cameroon · TSN 2025</Text>
          </View>

          {/* White card */}
          <View style={s.formCard}>
            {/* Role selector */}
            <View style={s.roleRow}>
              <TouchableOpacity
                style={[s.roleBtn, role === 'driver' && { backgroundColor: RED }]}
                onPress={() => { setRole('driver'); setIdentifier(''); }}
              >
                <MaterialIcons name="directions-car" size={18} color={role === 'driver' ? '#fff' : '#555'} />
                <Text style={[s.roleTxt, role === 'driver' && { color: '#fff' }]}>TAXI DRIVER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, role === 'police' && { backgroundColor: BLUE }]}
                onPress={() => { setRole('police'); setIdentifier(''); }}
              >
                <MaterialIcons name="local-police" size={18} color={role === 'police' ? '#fff' : '#555'} />
                <Text style={[s.roleTxt, role === 'police' && { color: '#fff' }]}>POLICE STATION</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.cardTitle, { color: accent }]}>
              {isDriver ? 'DRIVER LOGIN' : 'POLICE LOGIN'}
            </Text>

            {/* ID field */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>{isDriver ? 'BADGE ID / DRIVER ID' : 'STATION ID'}</Text>
              <Text style={s.fieldHint}>
                {isDriver ? 'The ID you chose when registering (e.g. TX-YDE-001) — NOT your vehicle plate' : 'Your station ID (e.g. YDE-PS-001)'}
              </Text>
              <View style={s.inputWrap}>
                <MaterialIcons name="badge" size={20} color="#aaa" style={{ marginLeft: 12 }} />
                <TextInput
                  style={[s.input, { borderColor: accent }]}
                  placeholder={isDriver ? 'e.g. TX-YDE-001' : 'e.g. YDE-PS-001'}
                  placeholderTextColor="#aaa"
                  value={identifier}
                  onChangeText={t => setIdentifier(t.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <View style={s.passRow}>
                <View style={[s.inputWrap, { flex: 1 }]}>
                  <MaterialIcons name="lock" size={20} color="#aaa" style={{ marginLeft: 12 }} />
                  <TextInput
                    style={[s.input, { flex: 1, borderColor: accent }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity style={s.showBtn} onPress={() => setShowPass(!showPass)}>
                  <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={22} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.loginBtn, { backgroundColor: accent }, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="login" size={20} color="#fff" />
                  <Text style={s.loginBtnTxt}>{isDriver ? 'LOGIN AS DRIVER' : 'LOGIN AS POLICE'}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={[s.helpBox, { borderColor: accent + '44' }]}>
              <MaterialIcons name="help-outline" size={16} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={[s.helpTitle, { color: accent }]}>
                  {isDriver ? 'What is my Badge ID?' : 'What is my Station ID?'}
                </Text>
                <Text style={s.helpTxt}>
                  {isDriver
                    ? 'Your Badge ID is the unique ID you chose when registering.\n\nExample: TX-YDE-001\n\nIt is NOT your vehicle plate number.'
                    : 'Your Station ID was set during registration.\n\nExample: YDE-PS-001'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[s.registerBtn, { borderColor: accent }]} onPress={() => nav('signup')}>
              <MaterialIcons name="person-add" size={18} color={accent} />
              <Text style={[s.registerBtnTxt, { color: accent }]}>Don't have an account? REGISTER HERE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1 },
  topSection:    { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  logoCircle:    { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 8 },
  appName:       { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  appSub:        { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  appCity:       { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  formCard:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, flex: 1 },
  roleRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn:       { flex: 1, backgroundColor: '#e0e0e0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  roleTxt:       { fontSize: 12, fontWeight: '800', color: '#555' },
  cardTitle:     { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 20 },
  fieldWrap:     { marginBottom: 16 },
  fieldLabel:    { fontSize: 12, fontWeight: '800', color: '#333', marginBottom: 4 },
  fieldHint:     { fontSize: 10, color: '#888', marginBottom: 6, lineHeight: 14 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, backgroundColor: '#fafafa' },
  input:         { flex: 1, paddingHorizontal: 10, paddingVertical: 12, fontSize: 15, color: '#111', fontWeight: '600' },
  passRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  showBtn:       { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  loginBtn:      { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginBtnTxt:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  helpBox:       { borderWidth: 1, borderRadius: 12, padding: 14, backgroundColor: '#fafafa', flexDirection: 'row', gap: 10, marginBottom: 16 },
  helpTitle:     { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  helpTxt:       { fontSize: 12, color: '#666', lineHeight: 18 },
  registerBtn:   { borderWidth: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  registerBtnTxt:{ fontSize: 13, fontWeight: '800' },
});