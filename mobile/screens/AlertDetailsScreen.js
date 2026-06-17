import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';

const RED = '#d32f2f';

export default function AlertDetailsScreen({ nav, location }) {
  const [seconds, setSeconds] = useState(522); // 00:08:42

  useEffect(() => {
    const t = setInterval(() => setSeconds(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('policeDashboard')}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerTitle}>
          <Text style={s.headerMain}>Alert Detail</Text>
          <Text style={s.headerFr}>DÉTAILS DE L'ALERTE</Text>
        </View>
        <Text style={s.menuDots}>⋮</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Critical banner */}
        <View style={s.criticalBanner}>
          <Text style={s.criticalTitle}>CRITICAL ALERT - IN{'\n'}PROGRESS</Text>
          <Text style={s.criticalFr}>ALERTE CRITIQUE - EN COURS{'\n'}D'EXÉCUTION</Text>
          <View style={s.elapsedRow}>
            <Text style={s.clockIco}>⏱</Text>
            <View style={s.elapsedBg}>
              <Text style={s.elapsedLabel}>ELAPSED TIME / TEMPS ÉCOULÉ</Text>
              <Text style={s.elapsedVal}>{fmt(seconds)}</Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View style={s.mapCard}>
          <View style={s.mapLocationBadge}>
            <Text style={s.mapLocationIco}>📍</Text>
            <Text style={s.mapLocationTxt}>BASTOS / MVAN JUNCTION</Text>
          </View>
          <View style={s.mapArea}><Text style={s.mapEmoji}>🗺</Text></View>
          <View style={s.gpsRow}>
            <View style={s.gpsSignalRow}>
              <View style={s.gpsDot} />
              <Text style={s.gpsTxt}>GPS SIGNAL: OPTIMAL / SIGNAL{'\n'}GPS: OPTIMAL</Text>
            </View>
            <Text style={s.coords}>3.8485° N,{'\n'}11.5021° E</Text>
          </View>
        </View>

        {/* Incident info */}
        <View style={s.infoCard}>
          <View style={s.infoTopRow}>
            <View>
              <Text style={s.infoMeta}>INCIDENT TYPE / TYPE D'INCIDENT</Text>
              <Text style={s.incidentTitle}>SOS TRIGGER / THEFT</Text>
              <Text style={s.incidentFr}>Déclenchement SOS / Vol</Text>
            </View>
            <View style={s.exclamBadge}><Text style={s.exclamTxt}>!</Text></View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Trigger Time / Heure</Text>
            <Text style={s.infoVal}>02:14 PM</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Network / Réseau</Text>
            <View style={s.mtnBadge}><Text style={s.mtnTxt}>MTN</Text></View>
          </View>
        </View>

        {/* Driver card */}
        <View style={s.driverCard}>
          <View style={s.driverTop}>
            <View style={s.driverAvatar}><Text style={s.driverAvatarTxt}>👤</Text></View>
            <View style={s.driverInfo}>
              <Text style={s.driverMeta}>DRIVER / CHAUFFEUR</Text>
              <Text style={s.driverName}>Jean-Paul Nguemo</Text>
              <Text style={s.driverId}>ID: TX-9928</Text>
            </View>
          </View>
          <Text style={s.vehicleLabel}>VEHICLE / VÉHICULE</Text>
          <View style={s.vehicleRow}>
            <Text style={s.vehicleIco}>🚖</Text>
            <Text style={s.vehicleTxt}>Yellow Toyota Corolla • CE 482-XY</Text>
          </View>
        </View>

        {/* Response status */}
        <View style={s.responseCard}>
          <View style={s.responseDot} />
          <Text style={s.responseLabel}>RESPONSE STATUS / ÉTAT DE LA RÉPONSE</Text>
          <Text style={s.responseUnit}>Patrol Unit P-09 En Route</Text>
          <Text style={s.responseFr}>Unité de Patrouille P-09 en chemin</Text>
          <View style={s.etaRow}>
            <View>
              <Text style={s.etaLabel}>ETA / HEURE D'ARRIVÉE</Text>
              <Text style={s.etaVal}>3 MINS</Text>
            </View>
            <View style={s.etaShield}><Text style={s.etaShieldIco}>🛡</Text></View>
          </View>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={s.voiceBtn}>
          <Text style={s.voiceTxt}>VOICE COMM WITH DRIVER</Text>
          <Text style={s.voiceFr}>Com. Vocale avec le Chauffeur</Text>
          <Text style={s.voiceIco}>🎙</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deployBtn}>
          <Text style={s.deployTxt}>DEPLOY REINFORCEMENTS</Text>
          <Text style={s.deployFr}>Déployer des Renforts</Text>
          <Text style={s.deployIco}>👥</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.resolveBtn}>
          <Text style={s.resolveTxt}>MARK AS RESOLVED</Text>
          <Text style={s.resolveFr}>Marquer comme Résolu</Text>
          <Text style={s.resolveIco}>✓</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { ico: '👁', lbl: 'Monitor' },
          { ico: '🗺', lbl: 'Map' },
          { ico: '⟲', lbl: 'History' },
          { ico: '⚙', lbl: 'Settings' },
        ].map(({ ico, lbl }) => (
          <TouchableOpacity key={lbl} style={s.navItem}>
            <Text style={s.navIco}>{ico}</Text>
            <Text style={s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backArrow:   { fontSize: 22, color: RED, marginRight: 12, fontWeight: '600' },
  headerTitle: { flex: 1 },
  headerMain:  { fontSize: 15, fontWeight: '800', color: '#111' },
  headerFr:    { fontSize: 10, color: '#888', marginTop: 1 },
  menuDots:    { fontSize: 22, color: '#555' },

  /* Critical banner */
  criticalBanner: {
    backgroundColor: RED, margin: 14, borderRadius: 16, padding: 20,
  },
  criticalTitle: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  criticalFr:    { fontSize: 12, color: '#ffc9c9', marginTop: 4, lineHeight: 18 },
  elapsedRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  clockIco:      { fontSize: 20, color: '#fff', marginRight: 10 },
  elapsedBg: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, flex: 1,
  },
  elapsedLabel: { fontSize: 9, color: '#ffc9c9', fontWeight: '600', letterSpacing: 0.5 },
  elapsedVal:   { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 2 },

  /* Map */
  mapCard: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  mapLocationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  mapLocationIco: { fontSize: 14, marginRight: 6 },
  mapLocationTxt: { fontSize: 13, fontWeight: '800', color: '#111' },
  mapArea: {
    height: 180, backgroundColor: '#c8dea6',
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmoji: { fontSize: 80, opacity: 0.3 },
  gpsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  gpsSignalRow:{ flexDirection: 'row', alignItems: 'flex-start' },
  gpsDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 8, marginTop: 4 },
  gpsTxt:  { fontSize: 11, color: '#333', fontWeight: '600', lineHeight: 16 },
  coords:  { fontSize: 12, fontWeight: '700', color: '#333', textAlign: 'right', lineHeight: 18 },

  /* Info card */
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  infoTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoMeta:      { fontSize: 10, color: '#1565C0', fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  incidentTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  incidentFr:    { fontSize: 11, color: '#555', fontStyle: 'italic', marginTop: 2 },
  exclamBadge: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#1565C0',
    alignItems: 'center', justifyContent: 'center',
  },
  exclamTxt: { fontSize: 18, fontWeight: '900', color: '#fff' },
  divider:   { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#666' },
  infoVal:   { fontSize: 14, fontWeight: '700', color: '#111' },
  mtnBadge:  { backgroundColor: '#f5c518', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  mtnTxt:    { fontSize: 12, fontWeight: '800', color: '#111' },

  /* Driver */
  driverCard: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  driverTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  driverAvatar:    { width: 52, height: 52, borderRadius: 14, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  driverAvatarTxt: { fontSize: 28 },
  driverInfo:      { flex: 1 },
  driverMeta:      { fontSize: 10, color: '#1565C0', fontWeight: '700', letterSpacing: 0.3 },
  driverName:      { fontSize: 18, fontWeight: '900', color: '#111', marginTop: 2 },
  driverId:        { fontSize: 12, color: '#666', marginTop: 2 },
  vehicleLabel:    { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.3, marginBottom: 8 },
  vehicleRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12 },
  vehicleIco:      { fontSize: 20, marginRight: 10 },
  vehicleTxt:      { fontSize: 13, fontWeight: '600', color: '#333' },

  /* Response */
  responseCard: {
    backgroundColor: '#1a1a2e', marginHorizontal: 14, borderRadius: 16, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  responseDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#555', marginBottom: 8 },
  responseLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  responseUnit:  { fontSize: 20, fontWeight: '900', color: '#fff' },
  responseFr:    { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginTop: 4 },
  etaRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  etaLabel:      { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.3 },
  etaVal:        { fontSize: 28, fontWeight: '900', color: '#4fc3f7', marginTop: 4 },
  etaShield:     { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center' },
  etaShieldIco:  { fontSize: 24 },

  /* Action buttons */
  voiceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1565C0', marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10,
  },
  voiceTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  voiceFr:  { fontSize: 10, color: '#90caf9' },
  voiceIco: { fontSize: 22 },

  deployBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: RED, marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10,
  },
  deployTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  deployFr:  { fontSize: 10, color: '#ffc9c9' },
  deployIco: { fontSize: 22 },

  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#e0e0e0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  resolveTxt: { fontSize: 14, fontWeight: '700', color: '#333' },
  resolveFr:  { fontSize: 10, color: '#999' },
  resolveIco: { fontSize: 22, color: '#555' },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10,
  },
  navItem: { alignItems: 'center' },
  navIco:  { fontSize: 20, color: '#555' },
  navTxt:  { fontSize: 10, color: '#555', marginTop: 3 },
});
