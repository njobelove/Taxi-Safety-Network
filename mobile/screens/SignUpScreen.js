import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { registerDriver, registerPoliceStation } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

// ── Reusable field component ──────────────────────────────────────────────────
const Field = ({ label, labelFr, placeholder, value, onChange, secure, keyboard, autoCapitalize, error }) => {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={f.lbl}>{label}</Text>
      {labelFr ? <Text style={f.lblFr}>{labelFr}</Text> : null}
      <View style={[f.inputRow, error && f.inputErr]}>
        <TextInput
          style={f.input}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          secureTextEntry={secure && !show}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow(!show)}>
            <Text style={{ fontSize: 18 }}>👁</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={f.errTxt}>⚠  {error}</Text> : null}
    </View>
  );
};
const f = StyleSheet.create({
  lbl:      { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  lblFr:    { fontSize: 10, color: '#ffc9c9', marginBottom: 4, marginTop: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 50, borderWidth: 1.5, borderColor: 'transparent' },
  inputErr: { borderColor: '#ff8a80' },
  input:    { flex: 1, fontSize: 15, color: '#222' },
  errTxt:   { fontSize: 11, color: '#ff8a80', marginTop: 4 },
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function SignupScreen({ nav }) {
  const { login } = useAuth();
  const [role, setRole] = useState('driver');

  // ── Driver fields ────────────────────────────────────────────────────────────
  const [dFullName,   setDFullName]   = useState('');
  const [dBadgeId,    setDBadgeId]    = useState('');
  const [dPhone,      setDPhone]      = useState('');
  const [dNetwork,    setDNetwork]    = useState('MTN');
  const [dPlate,      setDPlate]      = useState('');
  const [dCity,       setDCity]       = useState('Yaoundé');
  const [dPassword,   setDPassword]   = useState('');
  const [dConfirm,    setDConfirm]    = useState('');

  // ── Police station fields ────────────────────────────────────────────────────
  const [pStationName,  setPStationName]  = useState('');
  const [pStationId,    setPStationId]    = useState('');
  const [pDistrict,     setPDistrict]     = useState('');
  const [pCity,         setPCity]         = useState('Yaoundé');
  const [pEmergLine,    setPEmergLine]    = useState('');
  const [pSecondLine,   setPSecondLine]   = useState('');
  const [pCommander,    setPCommander]    = useState('');
  const [pPassword,     setPPassword]     = useState('');
  const [pConfirm,      setPConfirm]      = useState('');

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const cities = ['Yaoundé','Douala','Bafoussam','Bamenda','Garoua','Buea','Limbé'];
  const networks = [
    { id: 'MTN',    dot: '#f5c518' },
    { id: 'ORANGE', dot: RED       },
    { id: 'CAMTEL', dot: '#42a5f5' },
  ];

  // ── Validate driver ──────────────────────────────────────────────────────────
  const validateDriver = () => {
    const e = {};
    if (!dFullName.trim())         e.dFullName  = 'Full name is required';
    if (!dBadgeId.trim())          e.dBadgeId   = 'Badge ID is required';
    else if (!/^[A-Z]{2}-[A-Z]{2,4}-\d{3,}$/i.test(dBadgeId)) e.dBadgeId = 'Format: TX-YDE-001';
    if (!dPhone.trim())            e.dPhone     = 'Phone number is required';
    else if (!/^\+237\s?6/.test(dPhone)) e.dPhone = 'Use format +237 6XX XXX XXX';
    if (!dPlate.trim())            e.dPlate     = 'Vehicle plate is required';
    if (!dPassword)                e.dPassword  = 'Password is required';
    else if (dPassword.length < 6) e.dPassword  = 'Minimum 6 characters';
    if (dPassword !== dConfirm)    e.dConfirm   = 'Passwords do not match';
    return e;
  };

  // ── Validate police station ──────────────────────────────────────────────────
  const validatePolice = () => {
    const e = {};
    if (!pStationName.trim())  e.pStationName = 'Station name is required';
    if (!pStationId.trim())    e.pStationId   = 'Station ID is required';
    else if (!/^[A-Z]{2,4}-PS-\d{3,}$/i.test(pStationId)) e.pStationId = 'Format: YDE-PS-001';
    if (!pDistrict.trim())     e.pDistrict    = 'District is required';
    if (!pEmergLine.trim())    e.pEmergLine   = 'Emergency contact is required';
    else if (!/^\+237/.test(pEmergLine)) e.pEmergLine = 'Use format +237 XXX XXX XXX';
    if (!pCommander.trim())    e.pCommander   = 'Commander name is required';
    if (!pPassword)            e.pPassword    = 'Password is required';
    else if (pPassword.length < 6) e.pPassword = 'Minimum 6 characters';
    if (pPassword !== pConfirm) e.pConfirm   = 'Passwords do not match';
    return e;
  };

  const handleRegister = async () => {
    const errs = role === 'driver' ? validateDriver() : validatePolice();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      if (role === 'driver') {
        await registerDriver({
          fullName:     dFullName,
          badgeId:      dBadgeId,
          phoneNumber:  dPhone,
          network:      dNetwork,
          vehiclePlate: dPlate,
          city:         dCity,
          password:     dPassword,
        });
        // auto-login after register
        const { loginDriver } = require('../services/api');
        const driver = await loginDriver(dBadgeId, dPassword);
        login(driver, 'driver');
        nav('driverDashboard');
      } else {
        await registerPoliceStation({
          stationName:   pStationName,
          stationId:     pStationId,
          district:      pDistrict,
          city:          pCity,
          emergencyLine: pEmergLine,
          secondaryLine: pSecondLine,
          commanderName: pCommander,
          password:      pPassword,
        });
        const { loginPoliceStation } = require('../services/api');
        const station = await loginPoliceStation(pStationId, pPassword);
        login(station, 'police');
        nav('policeDashboard');
      }
    } catch (e) {
      if (e.message === 'BADGE_EXISTS') {
        setErrors({ dBadgeId: 'This Badge ID is already registered.' });
      } else if (e.message === 'STATION_EXISTS') {
        setErrors({ pStationId: 'This Station ID is already registered.' });
      } else {
        setErrors({ general: 'Connection error. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

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
          <View style={s.cameroonBadge}><Text style={s.cameroonTxt}>🇨🇲  CAMEROON NETWORK</Text></View>
          <Text style={s.heroTitle}>Taxi Safety{'\n'}Network</Text>
          <Text style={s.heroFr}>Sûreté des Taxis du Cameroun</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}><Text style={s.statNumRed}>24/7</Text><Text style={s.statLbl}>TACTICAL WATCH</Text><Text style={s.statFr}>Veille Tactique</Text></View>
            <View style={s.statDiv} />
            <View style={s.statBox}><Text style={s.statNumBlue}>GPS</Text><Text style={s.statLbl}>REAL-TIME DATA</Text><Text style={s.statFr}>Données en Temps Réel</Text></View>
          </View>
        </View>

        <View style={s.loginRow}>
          <Text style={s.loginGrey}>Already have an account?{'  '}</Text>
          <TouchableOpacity onPress={() => nav('login')}><Text style={s.loginLink}>Log In / Connexion</Text></TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={s.formCard}>

          {/* Role header */}
          <View style={s.formHeader}>
            <View>
              <Text style={s.formTitle}>PERSONNEL{'\n'}REGISTRATION</Text>
              <Text style={s.formFr}>Enregistrement du Personnel</Text>
            </View>
            <Text style={s.formDots}>⠿⠿⠿</Text>
          </View>

          {/* Role selector */}
          <Text style={s.stepLbl}>01. SELECT AUTHORITY ROLE / CHOISIR LE RÔLE</Text>
          {[
            { id: 'driver', ico: '🚖', lbl: 'Taxi Driver',     sub: 'Conducteur de taxi'         },
            { id: 'police', ico: '🏛',  lbl: 'Police Station', sub: 'Station de police'           },
          ].map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[s.roleBtn, role === r.id && s.roleBtnA]}
              onPress={() => { setRole(r.id); setErrors({}); }}
            >
              <Text style={s.roleIco}>{r.ico}</Text>
              <View>
                <Text style={[s.roleTxt, role === r.id && { color: '#fff' }]}>{r.lbl}</Text>
                <Text style={[s.roleSub, role === r.id && { color: '#ffc9c9' }]}>{r.sub}</Text>
              </View>
              {role === r.id && <View style={s.roleCheck}><Text style={{ color: '#fff', fontSize: 14 }}>✓</Text></View>}
            </TouchableOpacity>
          ))}

          {/* General error */}
          {errors.general ? (
            <View style={s.errorBox}><Text style={s.errorTxt}>⚠  {errors.general}</Text></View>
          ) : null}

          {/* ── DRIVER FORM ───────────────────────────────────────────────── */}
          {role === 'driver' && (
            <>
              <Text style={s.stepLbl}>02. DRIVER DETAILS / DÉTAILS DU CONDUCTEUR</Text>

              <Field label="Full Name" labelFr="NOM COMPLET" placeholder="e.g. Jean-Paul Nguemo"
                value={dFullName} onChange={setDFullName} autoCapitalize="words" error={errors.dFullName} />

              <Field label="Badge ID" labelFr="NUMÉRO DE BADGE"
                placeholder="e.g. TX-YDE-001"
                value={dBadgeId} onChange={setDBadgeId} autoCapitalize="characters" error={errors.dBadgeId} />
              {!errors.dBadgeId && <Text style={s.hint}>Format: TX-[CITY CODE]-[NUMBER]  e.g. TX-YDE-001</Text>}

              <Field label="Phone Number" labelFr="NUMÉRO DE TÉLÉPHONE"
                placeholder="+237 6XX XXX XXX"
                value={dPhone} onChange={setDPhone} keyboard="phone-pad" error={errors.dPhone} />

              <Text style={s.stepLbl}>03. MOBILE NETWORK / RÉSEAU MOBILE</Text>
              <View style={s.netRow}>
                {networks.map(({ id, dot }) => (
                  <TouchableOpacity
                    key={id}
                    style={[s.netBtn, dNetwork === id && s.netBtnA]}
                    onPress={() => setDNetwork(id)}
                  >
                    <Text style={[s.netTxt, dNetwork === id && s.netTxtA]}>{id}</Text>
                    <View style={[s.netDot, { backgroundColor: dot }]} />
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="Vehicle Plate" labelFr="PLAQUE D'IMMATRICULATION"
                placeholder="CE 000 AA"
                value={dPlate} onChange={setDPlate} autoCapitalize="characters" error={errors.dPlate} />

              <Text style={s.stepLbl}>04. CITY OF OPERATION / VILLE D'OPÉRATION</Text>
              <View style={s.cityGrid}>
                {cities.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.cityBtn, dCity === c && s.cityBtnA]}
                    onPress={() => setDCity(c)}
                  >
                    <Text style={[s.cityTxt, dCity === c && s.cityTxtA]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.stepLbl}>05. SECURE PASSWORD / MOT DE PASSE</Text>
              <Field label="Password" labelFr="MOT DE PASSE (min. 6 characters)"
                placeholder="Create a password"
                value={dPassword} onChange={setDPassword} secure error={errors.dPassword} />
              <Field label="Confirm Password" labelFr="CONFIRMER LE MOT DE PASSE"
                placeholder="Repeat your password"
                value={dConfirm} onChange={setDConfirm} secure error={errors.dConfirm} />
            </>
          )}

          {/* ── POLICE STATION FORM ───────────────────────────────────────── */}
          {role === 'police' && (
            <>
              <Text style={s.stepLbl}>02. STATION DETAILS / DÉTAILS DE LA STATION</Text>

              <Field label="Station Name" labelFr="NOM DE LA STATION"
                placeholder="e.g. Commissariat Central de Yaoundé"
                value={pStationName} onChange={setPStationName} autoCapitalize="words" error={errors.pStationName} />

              <Field label="Station ID" labelFr="IDENTIFIANT DE LA STATION"
                placeholder="e.g. YDE-PS-001"
                value={pStationId} onChange={setPStationId} autoCapitalize="characters" error={errors.pStationId} />
              {!errors.pStationId && <Text style={s.hint}>Format: [CITY]-PS-[NUMBER]  e.g. YDE-PS-001</Text>}

              <Field label="District / Zone" labelFr="DISTRICT / ZONE"
                placeholder="e.g. Bastos, Mvan, Centre-ville"
                value={pDistrict} onChange={setPDistrict} autoCapitalize="words" error={errors.pDistrict} />

              <Text style={s.stepLbl}>03. CITY / VILLE</Text>
              <View style={s.cityGrid}>
                {cities.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.cityBtn, pCity === c && s.cityBtnA]}
                    onPress={() => setPCity(c)}
                  >
                    <Text style={[s.cityTxt, pCity === c && s.cityTxtA]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.stepLbl}>04. EMERGENCY CONTACTS / CONTACTS D'URGENCE</Text>

              <Field label="Primary Emergency Line" labelFr="LIGNE D'URGENCE PRINCIPALE"
                placeholder="+237 XXX XXX XXX"
                value={pEmergLine} onChange={setPEmergLine} keyboard="phone-pad" error={errors.pEmergLine} />

              <Field label="Secondary Emergency Line (optional)" labelFr="LIGNE SECONDAIRE (OPTIONNEL)"
                placeholder="+237 XXX XXX XXX"
                value={pSecondLine} onChange={setPSecondLine} keyboard="phone-pad" error={errors.pSecondLine} />

              <Field label="Station Commander Name" labelFr="NOM DU COMMANDANT DE STATION"
                placeholder="e.g. Commissaire Jean Mballa"
                value={pCommander} onChange={setPCommander} autoCapitalize="words" error={errors.pCommander} />

              <Text style={s.stepLbl}>05. SECURE PASSWORD / MOT DE PASSE</Text>
              <Field label="Password" labelFr="MOT DE PASSE (min. 6 characters)"
                placeholder="Create a password"
                value={pPassword} onChange={setPPassword} secure error={errors.pPassword} />
              <Field label="Confirm Password" labelFr="CONFIRMER LE MOT DE PASSE"
                placeholder="Repeat your password"
                value={pConfirm} onChange={setPConfirm} secure error={errors.pConfirm} />

              <View style={s.noteBox}>
                <Text style={s.noteIco}>ℹ</Text>
                <Text style={s.noteEn}>
                  Your station will receive ALL alerts from taxi drivers across Cameroon.
                  Emergency contact numbers entered here will be used to receive SMS alerts.
                  Note: Ce sont les lignes d'urgence de la station, pas un numéro personnel.
                </Text>
              </View>
            </>
          )}

          {/* Register button */}
          <TouchableOpacity
            style={[s.regBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.regTxt}>
                    {role === 'driver' ? 'INITIALIZE SECURE ACCOUNT' : 'REGISTER POLICE STATION'}
                  </Text>
                  <Text style={s.regArrow}>›</Text>
                </>
            }
          </TouchableOpacity>
          <Text style={s.regFr}>INITIALISER LE COMPTE SÉCURISÉ</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f5f5f5' },
  topBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  shieldSm:       { width: 32, height: 32, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  topTitle:       { fontSize: 12, fontWeight: '800', color: '#111', flexShrink: 1 },
  hero:           { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  cameroonBadge:  { alignSelf: 'flex-start', backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  cameroonTxt:    { fontSize: 11, fontWeight: '700', color: '#b45309' },
  heroTitle:      { fontSize: 34, fontWeight: '900', color: '#111', lineHeight: 38 },
  heroFr:         { fontSize: 14, color: '#555', fontStyle: 'italic', marginTop: 4, marginBottom: 14 },
  statsRow:       { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statBox:        { flex: 1, padding: 16 },
  statDiv:        { width: 2, backgroundColor: BLUE, marginVertical: 12 },
  statNumRed:     { fontSize: 22, fontWeight: '900', color: RED },
  statNumBlue:    { fontSize: 22, fontWeight: '900', color: BLUE },
  statLbl:        { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 0.5, marginTop: 4 },
  statFr:         { fontSize: 10, color: '#888', marginTop: 2 },
  loginRow:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  loginGrey:      { fontSize: 13, color: '#666' },
  loginLink:      { fontSize: 13, fontWeight: '800', color: BLUE },
  formCard:       { backgroundColor: RED, marginHorizontal: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  formTitle:      { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  formFr:         { fontSize: 11, color: '#ffc9c9', marginTop: 4 },
  formDots:       { fontSize: 22, color: '#fff', opacity: 0.4 },
  stepLbl:        { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginTop: 22, marginBottom: 10, lineHeight: 16 },
  roleBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0' },
  roleBtnA:       { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.6)' },
  roleIco:        { fontSize: 22, marginRight: 12 },
  roleTxt:        { fontSize: 15, fontWeight: '700', color: '#222' },
  roleSub:        { fontSize: 11, color: '#888', marginTop: 1 },
  roleCheck:      { marginLeft: 'auto', width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  hint:           { fontSize: 10, color: '#ffc9c9', marginTop: 4, fontStyle: 'italic' },
  netRow:         { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  netBtn:         { flex: 0.31, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'transparent' },
  netBtnA:        { backgroundColor: '#fff', borderColor: '#f5c518' },
  netTxt:         { fontSize: 13, fontWeight: '700', color: '#fff' },
  netTxtA:        { color: '#222' },
  netDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cityGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  cityBtn:        { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cityBtnA:       { backgroundColor: '#fff' },
  cityTxt:        { fontSize: 12, fontWeight: '600', color: '#fff' },
  cityTxtA:       { color: RED },
  errorBox:       { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, marginTop: 14 },
  errorTxt:       { fontSize: 12, color: '#ff8a80', fontWeight: '600' },
  noteBox:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, marginTop: 16 },
  noteIco:        { fontSize: 16, marginRight: 8, color: '#fff' },
  noteEn:         { flex: 1, fontSize: 11, color: '#fff', lineHeight: 16 },
  regBtn:         { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, marginTop: 26 },
  regTxt:         { color: '#fff', fontSize: 15, fontWeight: '900', lineHeight: 22 },
  regArrow:       { color: '#fff', fontSize: 28, fontWeight: '300' },
  regFr:          { textAlign: 'center', fontSize: 10, color: '#ffc9c9', marginTop: 8, letterSpacing: 0.5 },
});
