import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { updateAlertStatus, getNearbyResponders } from '../services/api';

const RED  = '#d32f2f';
const BLUE = '#1565C0';

export default function AlertDetailsScreen({ nav, alert: alertData, token }) {
  const [seconds,    setSeconds]    = useState(0);
  const [resolving,  setResolving]  = useState(false);
  const [responders, setResponders] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setSeconds(p => p + 1), 1000);
    fetchResponders();
    return () => clearInterval(t);
  }, []);

  const fetchResponders = async () => {
    try {
      const data = await getNearbyResponders(3.848, 11.502, 5);
      setResponders(data.responders || []);
    } catch (e) {
      console.log('Responders error:', e.message);
    }
  };

  const fmt = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleResolve = async () => {
    Alert.alert(
      'Resolve Alert',
      'Mark this alert as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          style: 'destructive',
          onPress: async () => {
            try {
              setResolving(true);
              if (alertData?._id) {
                await updateAlertStatus(alertData._id, 'resolved', null, token);
              }
              Alert.alert('Success', 'Alert marked as resolved!', [
                { text: 'OK', onPress: () => nav('policeDashboard') }
              ]);
            } catch (e) {
              Alert.alert('Error', 'Could not resolve alert. Try again.');
            } finally {
              setResolving(false);
            }
          }
        }
      ]
    );
  };

  const handleVoiceComm = () => {
    Alert.alert('Voice Communication', 'Connecting to driver...\n\nThis feature requires Africa\'s Talking Voice API integration.');
  };

  const handleDeploy = () => {
    Alert.alert(
      'Deploy Reinforcements',
      `${responders.length} units available nearby.\n\nSelect a unit to deploy:`,
      [
        ...responders.map(r => ({
          text: `${r.id} — ${r.type} (${r.eta})`,
          onPress: () => Alert.alert('Deployed', `${r.id} dispatched to location!`)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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
          <Text style={s.criticalFr}>ALERTE CRITIQUE - EN COURS D'EXÉCUTION</Text>
          <View style={s.elapsedRow}>
            <Text style={s.clockIco}>⏱</Text>
            <View style={s.elapsedBg}>
              <Text style={s.elapsedLabel}>ELAPSED TIME / TEMPS ÉCOULÉ</Text>
              <Text style={s.elapsedVal}>{fmt(seconds)}</Text>
            </View>
          </View>
        </View>

        {/* Map area */}
        <View style={s.mapCard}>
          <View style={s.mapLocationBadge}>
            <Text style={s.mapLocationIco}>📍</Text>
            <Text style={s.mapLocationTxt}>
              {alertData?.address || alertData?.location?.address || 'BASTOS / MVAN JUNCTION'}
            </Text>
          </View>
          <View style={s.mapArea}>
            <Text style={s.mapEmoji}>🗺</Text>
          </View>
          <View style={s.gpsRow}>
            <View style={s.gpsSignalRow}>
              <View style={s.gpsDot} />
              <Text style={s.gpsTxt}>GPS SIGNAL: OPTIMAL</Text>
            </View>
            <Text style={s.coords}>
              {alertData?.location?.lat?.toFixed(4) || '3.8485'}° N,{'\n'}
              {alertData?.location?.lng?.toFixed(4) || '11.5021'}° E
            </Text>
          </View>
        </View>

        {/* Incident info */}
        <View style={s.infoCard}>
          <View style={s.infoTopRow}>
            <View>
              <Text style={s.infoMeta}>INCIDENT TYPE / TYPE D'INCIDENT</Text>
              <Text style={s.incidentTitle}>
                {alertData?.alertType?.toUpperCase() || 'SOS TRIGGER / THEFT'}
              </Text>
              <Text style={s.incidentFr}>Déclenchement SOS / Vol</Text>
            </View>
            <View style={s.exclamBadge}><Text style={s.exclamTxt}>!</Text></View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Trigger Time</Text>
            <Text style={s.infoVal}>
              {alertData?.timestamp
                ? new Date(alertData.timestamp).toLocaleTimeString()
                : '—'}
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Network / Réseau</Text>
            <View style={s.mtnBadge}>
              <Text style={s.mtnTxt}>{alertData?.network || 'MTN'}</Text>
            </View>
          </View>
        </View>

        {/* Driver card */}
        <View style={s.driverCard}>
          <View style={s.driverTop}>
            <View style={s.driverAvatar}>
              <Text style={s.driverAvatarTxt}>👤</Text>
            </View>
            <View style={s.driverInfo}>
              <Text style={s.driverMeta}>DRIVER / CHAUFFEUR</Text>
              <Text style={s.driverName}>{alertData?.driverName || 'Jean-Paul Nguemo'}</Text>
              <Text style={s.driverId}>ID: {alertData?.driverId || 'TX-9928'}</Text>
            </View>
          </View>
          <Text style={s.vehicleLabel}>VEHICLE / VÉHICULE</Text>
          <View style={s.vehicleRow}>
            <Text style={s.vehicleIco}>🚖</Text>
            <Text style={s.vehicleTxt}>
              {alertData?.vehiclePlate || 'CE 482-XY'}
            </Text>
          </View>
        </View>

        {/* Nearby responders */}
        {responders.length > 0 && (
          <View style={s.respondersCard}>
            <Text style={s.respondersTitle}>NEARBY UNITS</Text>
            {responders.map((r) => (
              <View key={r.id} style={s.responderRow}>
                <View style={[s.responderDot, {
                  backgroundColor: r.status === 'available' ? '#4caf50' : '#ff9800'
                }]} />
                <Text style={s.responderName}>{r.id} — {r.type}</Text>
                <Text style={s.responderEta}>{r.eta}</Text>
                <Text style={s.responderDist}>{r.distance}km</Text>
              </View>
            ))}
          </View>
        )}

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
            <View style={s.etaShield}>
              <Text style={s.etaShieldIco}>🛡</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={s.voiceBtn} onPress={handleVoiceComm}>
          <View>
            <Text style={s.voiceTxt}>VOICE COMM WITH DRIVER</Text>
            <Text style={s.voiceFr}>Com. Vocale avec le Chauffeur</Text>
          </View>
          <Text style={s.voiceIco}>🎙</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deployBtn} onPress={handleDeploy}>
          <View>
            <Text style={s.deployTxt}>DEPLOY REINFORCEMENTS</Text>
            <Text style={s.deployFr}>Déployer des Renforts ({responders.length} available)</Text>
          </View>
          <Text style={s.deployIco}>👥</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.resolveBtn}
          onPress={handleResolve}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator color={RED} />
          ) : (
            <>
              <View>
                <Text style={s.resolveTxt}>MARK AS RESOLVED</Text>
                <Text style={s.resolveFr}>Marquer comme Résolu</Text>
              </View>
              <Text style={s.resolveIco}>✓</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { ico: '👁', lbl: 'Monitor',  to: 'policeDashboard' },
          { ico: '🗺', lbl: 'Map',      to: 'policeDashboard' },
          { ico: '⟲', lbl: 'History',  to: 'statistics'      },
          { ico: '⚙', lbl: 'Settings', to: 'profileSetup'    },
        ].map(({ ico, lbl, to }) => (
          <TouchableOpacity key={lbl} style={s.navItem} onPress={() => nav(to)}>
            <Text style={s.navIco}>{ico}</Text>
            <Text style={s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backArrow:       { fontSize: 22, color: RED, marginRight: 12, fontWeight: '600' },
  headerTitle:     { flex: 1 },
  headerMain:      { fontSize: 15, fontWeight: '800', color: '#111' },
  headerFr:        { fontSize: 10, color: '#888', marginTop: 1 },
  menuDots:        { fontSize: 22, color: '#555' },
  criticalBanner:  { backgroundColor: RED, margin: 14, borderRadius: 16, padding: 20 },
  criticalTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  criticalFr:      { fontSize: 12, color: '#ffc9c9', marginTop: 4, lineHeight: 18 },
  elapsedRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  clockIco:        { fontSize: 20, color: '#fff', marginRight: 10 },
  elapsedBg:       { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flex: 1 },
  elapsedLabel:    { fontSize: 9, color: '#ffc9c9', fontWeight: '600', letterSpacing: 0.5 },
  elapsedVal:      { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 2 },
  mapCard:         { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  mapLocationBadge:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  mapLocationIco:  { fontSize: 14, marginRight: 6 },
  mapLocationTxt:  { fontSize: 13, fontWeight: '800', color: '#111' },
  mapArea:         { height: 180, backgroundColor: '#c8dea6', alignItems: 'center', justifyContent: 'center' },
  mapEmoji:        { fontSize: 80, opacity: 0.3 },
  gpsRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  gpsSignalRow:    { flexDirection: 'row', alignItems: 'center' },
  gpsDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 8 },
  gpsTxt:          { fontSize: 11, color: '#333', fontWeight: '600' },
  coords:          { fontSize: 12, fontWeight: '700', color: '#333', textAlign: 'right', lineHeight: 18 },
  infoCard:        { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, padding: 16, marginBottom: 12 },
  infoTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoMeta:        { fontSize: 10, color: BLUE, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  incidentTitle:   { fontSize: 20, fontWeight: '900', color: '#111' },
  incidentFr:      { fontSize: 11, color: '#555', fontStyle: 'italic', marginTop: 2 },
  exclamBadge:     { width: 32, height: 32, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  exclamTxt:       { fontSize: 18, fontWeight: '900', color: '#fff' },
  divider:         { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  infoRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:       { fontSize: 12, color: '#666' },
  infoVal:         { fontSize: 14, fontWeight: '700', color: '#111' },
  mtnBadge:        { backgroundColor: '#f5c518', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  mtnTxt:          { fontSize: 12, fontWeight: '800', color: '#111' },
  driverCard:      { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, padding: 16, marginBottom: 12 },
  driverTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  driverAvatar:    { width: 52, height: 52, borderRadius: 14, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  driverAvatarTxt: { fontSize: 28 },
  driverInfo:      { flex: 1 },
  driverMeta:      { fontSize: 10, color: BLUE, fontWeight: '700', letterSpacing: 0.3 },
  driverName:      { fontSize: 18, fontWeight: '900', color: '#111', marginTop: 2 },
  driverId:        { fontSize: 12, color: '#666', marginTop: 2 },
  vehicleLabel:    { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.3, marginBottom: 8 },
  vehicleRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12 },
  vehicleIco:      { fontSize: 20, marginRight: 10 },
  vehicleTxt:      { fontSize: 13, fontWeight: '600', color: '#333' },
  respondersCard:  { backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 16, padding: 16, marginBottom: 12 },
  respondersTitle: { fontSize: 12, fontWeight: '800', color: '#111', marginBottom: 12, letterSpacing: 0.3 },
  responderRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  responderDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  responderName:   { flex: 1, fontSize: 13, fontWeight: '600', color: '#333' },
  responderEta:    { fontSize: 12, color: BLUE, fontWeight: '700', marginRight: 10 },
  responderDist:   { fontSize: 12, color: '#888' },
  responseCard:    { backgroundColor: '#1a1a2e', marginHorizontal: 14, borderRadius: 16, padding: 18, marginBottom: 12 },
  responseDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4caf50', marginBottom: 8 },
  responseLabel:   { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  responseUnit:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  responseFr:      { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginTop: 4 },
  etaRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  etaLabel:        { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.3 },
  etaVal:          { fontSize: 28, fontWeight: '900', color: '#4fc3f7', marginTop: 4 },
  etaShield:       { width: 48, height: 48, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  etaShieldIco:    { fontSize: 24 },
  voiceBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BLUE, marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10 },
  voiceTxt:        { fontSize: 14, fontWeight: '900', color: '#fff' },
  voiceFr:         { fontSize: 10, color: '#90caf9', marginTop: 2 },
  voiceIco:        { fontSize: 22 },
  deployBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10 },
  deployTxt:       { fontSize: 14, fontWeight: '900', color: '#fff' },
  deployFr:        { fontSize: 10, color: '#ffc9c9', marginTop: 2 },
  deployIco:       { fontSize: 22 },
  resolveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0' },
  resolveTxt:      { fontSize: 14, fontWeight: '700', color: '#333' },
  resolveFr:       { fontSize: 10, color: '#999', marginTop: 2 },
  resolveIco:      { fontSize: 22, color: '#555' },
  bottomNav:       { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10 },
  navItem:         { alignItems: 'center' },
  navIco:          { fontSize: 20, color: '#555' },
  navTxt:          { fontSize: 10, color: '#555', marginTop: 3 },
});
