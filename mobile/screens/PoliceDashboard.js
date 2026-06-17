import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';

const RED = '#d32f2f';

export default function PoliceDashboard({ nav, location }) {
  const incidents = [
    {
      tag: 'CRITICAL ALERT', tagColor: '#fde8e8', tagTxt: RED,
      time: '02:14 PM', status: 'PENDING', statusBg: RED,
      title: 'SOS Trigger: Route de Mvolyé',
      id: 'TX-9928', network: 'MTN Network', networkIco: '📡',
      driver: 'Jean-Paul Nguemo', driverImg: '👤',
      unit: null, resolved: false,
      accentColor: RED,
    },
    {
      tag: 'MEDICAL NEED', tagColor: '#e8f0fe', tagTxt: '#1565C0',
      time: '01:58 PM', status: 'RESPONDING', statusBg: '#1565C0',
      title: 'Station Mobile - Douala Road',
      id: 'DL-4412', network: 'Orange Network', networkIco: '📡',
      driver: null, driverImg: null,
      unit: 'PATROL UNIT P-09 EN ROUTE', resolved: false,
      accentColor: '#1565C0',
    },
    {
      tag: 'ENGINE FAILURE', tagColor: '#f5f5f5', tagTxt: '#555',
      time: '01:30 PM', status: 'RESOLVED', statusBg: '#b8b8b8',
      title: 'Mokolo Market Perimeter',
      id: null, network: null, networkIco: null,
      driverLine: 'DRIVER: SAMUEL ETO\'O FIL',
      driver: null, unit: null, resolved: true,
      accentColor: '#ccc',
    },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <View>
            <Text style={s.headerTitle}>TAXI SAFETY NETWORK</Text>
            <Text style={s.headerSub}>YAOUNDÉ DISTRICT COMMAND</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={s.bellWrap}><Text style={s.bell}>🔔</Text><View style={s.bellDot}/></View>
          <Text style={s.signalIco}>📶</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Map area */}
        <View style={s.mapArea}>
          <View style={s.liveSignalBadge}>
            <View style={s.liveYellow}/><Text style={s.liveSignalTxt}>LIVE SIGNAL: ACTIVE</Text>
          </View>
          <View style={s.mapBg}><Text style={s.mapIco}>🗺</Text></View>
          <View style={s.sectorRow}>
            <View>
              <Text style={s.sectorLabel}>CURRENT SECTOR</Text>
              <Text style={s.sectorName}>Bastos / Mvan Junction</Text>
            </View>
            <View style={s.zoomBtns}>
              <TouchableOpacity style={s.zoomBtn}><Text style={s.zoomTxt}>+</Text></TouchableOpacity>
              <TouchableOpacity style={s.zoomBtn}><Text style={s.zoomTxt}>−</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statLeft}>
            <Text style={s.statLabel}>ACTIVE ALERTS</Text>
            <View style={s.statRow}>
              <Text style={s.statNum}>14</Text>
              <View style={s.newBadge}><Text style={s.newTxt}>+2 New</Text></View>
            </View>
          </View>
          <View style={s.statRight}>
            <Text style={[s.statLabel, { color: '#fff' }]}>RESPONDERS</Text>
            <Text style={[s.statNum, { color: '#fff', fontSize: 42 }]}>08</Text>
            <Text style={s.inFieldTxt}>In Field</Text>
          </View>
        </View>

        {/* Incident logs */}
        <View style={s.logsSection}>
          <Text style={s.logsTitle}>ACTIVE INCIDENT LOGS</Text>
          <Text style={s.logsFr}>CHRONOLOGICAL ORDER / ORDRE CHRONOLOGIQUE</Text>

          {incidents.map((inc, i) => (
            <TouchableOpacity
              key={i}
              style={[s.incCard, { borderLeftColor: inc.accentColor }]}
              onPress={() => !inc.resolved && nav('AlertDetails')}
              activeOpacity={0.82}
            >
              <View style={s.incTop}>
                <View style={[s.incTagWrap, { backgroundColor: inc.tagColor }]}>
                  <Text style={[s.incTag, { color: inc.tagTxt }]}>{inc.tag}</Text>
                </View>
                <Text style={s.incTime}>{inc.time}</Text>
                <View style={[s.statusBadge, { backgroundColor: inc.statusBg }]}>
                  <Text style={s.statusTxt}>{inc.status}</Text>
                </View>
              </View>

              <Text style={s.incTitle}>{inc.title}</Text>

              {inc.id && (
                <View style={s.incMetaRow}>
                  <Text style={s.incMeta}>🪪 ID: {inc.id}</Text>
                  <Text style={s.incMeta}>  {inc.networkIco} {inc.network}</Text>
                </View>
              )}
              {inc.driverLine && <Text style={s.incMeta}>{inc.driverLine}</Text>}

              {inc.driver && (
                <View style={s.driverRow}>
                  <View style={s.driverAvatar}><Text style={s.driverAvatarTxt}>👤</Text></View>
                  <View style={s.driverInfo}>
                    <Text style={s.driverLabel}>DRIVER / CHAUFFEUR</Text>
                    <Text style={s.driverName}>{inc.driver}</Text>
                  </View>
                  <TouchableOpacity style={s.callBtn}>
                    <Text style={s.callIco}>📞</Text>
                  </TouchableOpacity>
                </View>
              )}

              {inc.unit && (
                <View style={s.unitRow}>
                  <Text style={s.unitIco}>🛡</Text>
                  <Text style={s.unitTxt}>{inc.unit}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navItemActive}>
          <Text style={s.navIcoActive}>⊞</Text>
          <Text style={s.navTxtActive}>DASHBOARD</Text>
        </View>
        {[{ ico: '⚠', lbl: 'ALERTS' }, { ico: '👥', lbl: 'CONTACTS' }, { ico: '👤', lbl: 'PROFILE' }].map(({ ico, lbl }) => (
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center' },
  shieldWrap:  {
    width: 34, height: 34, borderRadius: 9, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  shieldIco:   { fontSize: 17, color: '#fff' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:   { fontSize: 10, color: '#888', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellWrap:    { position: 'relative' },
  bell:        { fontSize: 22 },
  bellDot:     { position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: 5, backgroundColor: RED },
  signalIco:   { fontSize: 20 },

  /* Map */
  mapArea: { backgroundColor: '#b8cfae', height: 220, position: 'relative' },
  liveSignalBadge: {
    position: 'absolute', top: 14, left: 14, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  liveYellow:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f5c518', marginRight: 6 },
  liveSignalTxt: { fontSize: 11, fontWeight: '700', color: '#333' },
  mapBg:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapIco: { fontSize: 80, opacity: 0.2 },
  sectorRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  sectorLabel: { fontSize: 10, color: '#fff', fontWeight: '600', opacity: 0.8 },
  sectorName:  { fontSize: 20, fontWeight: '900', color: '#fff' },
  zoomBtns: { flexDirection: 'row', gap: 6 },
  zoomBtn:  { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  zoomTxt:  { fontSize: 20, fontWeight: '300', color: '#333' },

  /* Stats */
  statsRow: { flexDirection: 'row', margin: 14, gap: 12 },
  statLeft: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statRight: { flex: 1, backgroundColor: '#1565C0', borderRadius: 16, padding: 16 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  statRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statNum:   { fontSize: 42, fontWeight: '900', color: RED },
  newBadge:  { backgroundColor: '#fde8e8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 10 },
  newTxt:    { fontSize: 10, fontWeight: '700', color: RED },
  inFieldTxt:{ fontSize: 12, color: '#90caf9', marginTop: 4 },

  /* Logs */
  logsSection: { paddingHorizontal: 14, paddingBottom: 14 },
  logsTitle: { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: 0.3 },
  logsFr:    { fontSize: 10, color: '#888', marginBottom: 12 },

  incCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  incTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  incTagWrap: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  incTag:     { fontSize: 11, fontWeight: '700' },
  incTime:    { fontSize: 11, color: '#666', flex: 1 },
  statusBadge:{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:  { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  incTitle:   { fontSize: 17, fontWeight: '900', color: '#111', marginBottom: 6 },
  incMetaRow: { flexDirection: 'row', marginBottom: 4 },
  incMeta:    { fontSize: 11, color: '#666' },

  driverRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10,
  },
  driverAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#ddd',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  driverAvatarTxt: { fontSize: 20 },
  driverInfo:  { flex: 1 },
  driverLabel: { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 0.3 },
  driverName:  { fontSize: 14, fontWeight: '800', color: '#111' },
  callBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9',
    alignItems: 'center', justifyContent: 'center',
  },
  callIco: { fontSize: 18 },

  unitRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8f0fe', borderRadius: 10, padding: 10, marginTop: 8,
  },
  unitIco: { fontSize: 14, marginRight: 8 },
  unitTxt: { fontSize: 12, fontWeight: '700', color: '#1565C0' },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10,
  },
  navItemActive: { alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 },
  navItem:       { alignItems: 'center' },
  navIcoActive:  { fontSize: 18, color: '#fff' },
  navTxtActive:  { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 2 },
  navIco:        { fontSize: 18, color: '#aaa' },
  navTxt:        { fontSize: 10, color: '#aaa', marginTop: 2 },
});
