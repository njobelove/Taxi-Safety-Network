import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, Alert,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '../services/Icon';
import { loginDriver, loginPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';
const GOLD = '#f5c518';

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
    if (!id || !pw) {
      Alert.alert('Missing Fields', isDriver
        ? 'Please enter your Badge ID and password.'
        : 'Please enter your Station ID and password.'
      );
      return;
    }
    setLoading(true);
    try {
      if (isDriver) {
        const result = await loginDriver(id, pw);
        if (result && (result.token || result.user)) {
          login(result, 'driver');
        } else {
          Alert.alert('Login Failed', 'Invalid Badge ID or password.');
        }
      } else {
        const result = await loginPoliceStation(id, pw);
        if (result && (result.token || result.user)) {
          login(result, 'police');
        } else {
          Alert.alert('Login Failed', 'Invalid Station ID or password.');
        }
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('INVALID_CREDENTIALS') || msg.includes('401')) {
        Alert.alert('Login Failed',
          isDriver
            ? 'Wrong Badge ID or password.\n\nYour Badge ID looks like: TX-YDE-001'
            : 'Wrong Station ID or password.\n\nYour Station ID looks like: YDE-PS-001'
        );
      } else {
        Alert.alert('Connection Error', 'Could not connect to server. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.container}>

            {/* Logo */}
            <View style={s.logoSection}>
              <View style={[s.logoCircle, { backgroundColor: accent }]}>
                <Ionicons name="shield-checkmark" size={52} color="#fff" />
              </View>
              <Text style={s.appName}>TAXI SAFETY NETWORK</Text>
              <Text style={s.appSub}>RÉSEAU DE SÉCURITÉ DES TAXIS</Text>
              <Text style={s.appCity}>Cameroon · TSN 2025</Text>
            </View>

            {/* Role selector */}
            <View style={s.roleRow}>
              <TouchableOpacity
                style={[s.roleBtn, role === 'driver' && { backgroundColor: RED }]}
                onPress={() => { setRole('driver'); setIdentifier(''); }}
              >
                <MaterialIcons name="directions-car" size={20} color={role === 'driver' ? '#fff' : '#555'} />
                <Text style={[s.roleTxt, role === 'driver' && { color: '#fff' }]}>TAXI DRIVER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.roleBtn, role === 'police' && { backgroundColor: BLUE }]}
                onPress={() => { setRole('police'); setIdentifier(''); }}
              >
                <MaterialIcons name="local-police" size={20} color={role === 'police' ? '#fff' : '#555'} />
                <Text style={[s.roleTxt, role === 'police' && { color: '#fff' }]}>POLICE STATION</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={s.card}>
              <Text style={[s.cardTitle, { color: accent }]}>
                {isDriver ? 'DRIVER LOGIN' : 'POLICE LOGIN'}
              </Text>

              {/* ID field */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>
                  {isDriver ? 'BADGE ID / DRIVER ID' : 'STATION ID'}
                </Text>
                <Text style={s.fieldHint}>
                  {isDriver
                    ? 'The ID you used when registering (e.g. TX-YDE-001)'
                    : 'Your station ID (e.g. YDE-PS-001)'}
                </Text>
                <View style={s.inputWrap}>
                  <MaterialIcons name="badge" size={20} color="#aaa" style={s.inputIcon} />
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
                    <MaterialIcons name="lock" size={20} color="#aaa" style={s.inputIcon} />
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

              {/* Login button */}
              <TouchableOpacity
                style={[s.loginBtn, { backgroundColor: accent }, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="#fff" />
                    <Text style={s.loginBtnTxt}>
                      {isDriver ? 'LOGIN AS DRIVER' : 'LOGIN AS POLICE'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Help */}
              <View style={[s.helpBox, { borderColor: accent + '44' }]}>
                <MaterialIcons name="help-outline" size={16} color={accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.helpTitle, { color: accent }]}>
                    {isDriver ? 'What is my Badge ID?' : 'What is my Station ID?'}
                  </Text>
                  <Text style={s.helpTxt}>
                    {isDriver
                      ? 'Your Badge ID is the unique ID you entered when you registered.\n\nExample: TX-YDE-001\n\nNOT your vehicle plate — it is the ID you chose during sign up.'
                      : 'Your Station ID was entered during registration.\n\nExample: YDE-PS-001'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Register */}
            <TouchableOpacity
              style={[s.registerBtn, { borderColor: accent }]}
              onPress={() => nav('signup')}
            >
              <MaterialIcons name="person-add" size={18} color={accent} />
              <Text style={[s.registerBtnTxt, { color: accent }]}>
                Don't have an account? REGISTER HERE
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  container:     { flex: 1, padding: 20 },
  logoSection:   { alignItems: 'center', paddingVertical: 30 },
  logoCircle:    { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 8 },
  appName:       { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 1 },
  appSub:        { fontSize: 11, color: '#888', marginTop: 4 },
  appCity:       { fontSize: 11, color: '#aaa', marginTop: 2 },
  roleRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn:       { flex: 1, backgroundColor: '#e0e0e0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  roleTxt:       { fontSize: 13, fontWeight: '800', color: '#555' },
  card:          { backgroundColor: '#fff', borderRadius: 18, padding: 20, elevation: 3, marginBottom: 16 },
  cardTitle:     { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 20 },
  fieldWrap:     { marginBottom: 16 },
  fieldLabel:    { fontSize: 12, fontWeight: '800', color: '#333', marginBottom: 4 },
  fieldHint:     { fontSize: 10, color: '#888', marginBottom: 6, lineHeight: 14 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center' },
  inputIcon:     { position: 'absolute', left: 12, zIndex: 1 },
  input:         { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingLeft: 40, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fafafa', fontWeight: '600' },
  passRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  showBtn:       { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  loginBtn:      { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginBtnTxt:   { fontSize: 16, fontWeight: '900', color: '#fff' },
  helpBox:       { borderWidth: 1, borderRadius: 12, padding: 14, backgroundColor: '#fafafa', flexDirection: 'row', gap: 10 },
  helpTitle:     { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  helpTxt:       { fontSize: 12, color: '#666', lineHeight: 18 },
  registerBtn:   { borderWidth: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  registerBtnTxt:{ fontSize: 13, fontWeight: '800' },
});