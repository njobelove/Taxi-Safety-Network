import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';

const RED = '#d32f2f';

export default function StatisticsScreen({ nav, location }) {
  const triggers = [
    { ico: '✱', icoBg: RED,       name: 'PANIC BUTTON (SOS)',     pct: 48, barW: '48%' },
    { ico: '📹', icoBg: '#1a237e', name: 'CITIZEN SURVEILLANCE',  pct: 31, barW: '31%' },
    { ico: '📡', icoBg: '#e65100', name: 'NETWORK PINGS',         pct: 21, barW: '21%' },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <Text style={s.brand}>SENTINEL</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.networkTxt}>MTN 4G</Text>
          <Text style={s.secureIco}>🔒</Text>
          <Text style={s.secureTxt}>Secure Uplink Active</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Page title */}
        <View style={s.titleBlock}>
          <View style={s.intelRow}>
            <Text style={s.intelTxt}>STRATEGIC</Text>
            <View style={{ flex: 1 }} />
            <Text style={s.commandTxt}>Command Center</Text>
          </View>
          <Text style={s.intelSub}>INTELLIGENCE</Text>
          <Text style={s.pageTitle}>CRIME LOCATION{'\n'}STATISTICS</Text>
          <Text style={s.pageFr}>Statistiques sur la localisation de la criminalité</Text>
        </View>

        {/* Date filter + Export */}
        <View style={s.filterRow}>
          <TouchableOpacity style={s.filterBtn}>
            <Text style={s.filterIco}>📅</Text>
            <Text style={s.filterTxt}>LAST 30 DAYS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.exportBtn}>
            <Text style={s.exportIco}>⬇</Text>
            <Text style={s.exportTxt}>EXPORT{'\n'}REPORT</Text>
          </TouchableOpacity>
        </View>

        {/* Heatmap */}
        <View style={s.heatCard}>
          <View style={s.heatLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: RED }]} />
              <Text style={s.legendTxt}>HIGH INTENSITY</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#ff9800' }]} />
              <Text style={s.legendTxt}>MODERATE</Text>
            </View>
          </View>
          <View style={s.mapArea}>
            {/* Live badge */}
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE INCIDENT HEATMAP</Text>
            </View>
            <Text style={s.mapEmoji}>🗺</Text>
          </View>
          <View style={s.zoomBtns}>
            <TouchableOpacity style={s.zoomBtn}><Text style={s.zoomTxt}>+</Text></TouchableOpacity>
            <TouchableOpacity style={s.zoomBtn}><Text style={s.zoomTxt}>−</Text></TouchableOpacity>
          </View>
        </View>

        {/* Response time */}
        <View style={s.card}>
          <View style={s.responseHeader}>
            <Text style={s.cardTitle}>AVG. RESPONSE TIME</Text>
            <Text style={s.infoIco}>ℹ</Text>
          </View>
          <View style={s.responseRow}>
            <Text style={s.responseLabel}>CENTRALIZED (HQ)</Text>
            <Text style={s.responseVal}>14.2m</Text>
          </View>
          <View style={s.barTrack}><View style={[s.barFill, { width: '70%', backgroundColor: '#1565C0' }]} /></View>

          <View style={s.responseRow}>
            <Text style={s.responseLabel}>DECENTRALIZED (SUB-STATION)</Text>
            <Text style={[s.responseVal, { color: RED }]}>06.8m</Text>
          </View>
          <View style={s.barTrack}><View style={[s.barFill, { width: '34%', backgroundColor: RED }]} /></View>

          <Text style={s.responseNote}>
            Decentralised response in Douala IV shows 52% efficiency gain over traditional dispatch models.
          </Text>
        </View>

        {/* Most used triggers */}
        <View style={s.card}>
          <Text style={s.cardTitle}>MOST USED TRIGGERS</Text>
          {triggers.map((t) => (
            <View key={t.name} style={s.triggerRow}>
              <View style={[s.triggerIcoBg, { backgroundColor: t.icoBg }]}>
                <Text style={s.triggerIco}>{t.ico}</Text>
              </View>
              <View style={s.triggerInfo}>
                <View style={s.triggerTopRow}>
                  <Text style={s.triggerName}>{t.name}</Text>
                  <Text style={s.triggerPct}>{t.pct}%</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: t.barW, backgroundColor: t.icoBg }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* City stats */}
        <View style={s.card}>
          <Text style={s.cityName}>YAOUNDÉ CENTRAL</Text>
          <View style={s.cityRow}>
            <Text style={s.cityNum}>1,204</Text>
            <View style={s.cityChange}><Text style={s.cityChangeTxt}>↑12% VS LY</Text></View>
          </View>
          <View style={s.cityBar}>
            <View style={[s.cityBarFill, { width: '42%', backgroundColor: RED }]} />
          </View>

          <Text style={[s.cityName, { marginTop: 16 }]}>DOUALA LITTORAL</Text>
          <View style={s.cityRow}>
            <Text style={s.cityNum}>2,891</Text>
            <View style={[s.cityChange, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[s.cityChangeTxt, { color: '#2e7d32' }]}>STABLE</Text>
            </View>
          </View>
          <View style={s.cityBar}>
            <View style={[s.cityBarFill, { width: '65%', backgroundColor: '#1565C0' }]} />
          </View>
        </View>

        {/* Active responders */}
        <View style={s.card}>
          <Text style={s.responderLabel}>ACTIVE RESPONDERS</Text>
          <Text style={s.responderNum}>458</Text>
          <Text style={s.responderSub}>ON PATROL NOW</Text>
          <View style={s.avatarRow}>
            {['👮','👮','👮'].map((a, i) => (
              <View key={i} style={[s.avatarCircle, { marginLeft: i > 0 ? -8 : 0 }]}>
                <Text style={s.avatarTxt}>{a}</Text>
              </View>
            ))}
            <Text style={s.avatarMore}>+455</Text>
          </View>
        </View>

        {/* Emergency level */}
        <View style={s.emergencyCard}>
          <Text style={s.emergencyLabel}>EMERGENCY LEVEL</Text>
          <Text style={s.emergencyVal}>ALPHA 1</Text>
          <Text style={s.emergencyFr}>CRITICAL PRIORITY</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { ico: '✱', lbl: 'SOS', active: false },
          { ico: '👥', lbl: 'RESPONDERS', active: false },
          { ico: '📊', lbl: 'REPORTS', active: false },
          { ico: '👤', lbl: 'PROFILE', active: false },
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#111', 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  shieldWrap: { width: 28, height: 28, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  shieldIco:  { fontSize: 14, color: '#fff' },
  brand:      { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  networkTxt: { fontSize: 11, fontWeight: '700', color: '#f5c518' },
  secureIco:  { fontSize: 13 },
  secureTxt:  { fontSize: 10, color: '#aaa' },

  titleBlock: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  intelRow:   { flexDirection: 'row', marginBottom: 0 },
  intelTxt:   { fontSize: 11, fontWeight: '700', color: '#1565C0', letterSpacing: 0.5 },
  commandTxt: { fontSize: 11, color: '#888' },
  intelSub:   { fontSize: 11, fontWeight: '700', color: '#1565C0', letterSpacing: 0.5, marginBottom: 6 },
  pageTitle:  { fontSize: 30, fontWeight: '900', color: '#111', lineHeight: 36 },
  pageFr:     { fontSize: 11, color: '#888', marginTop: 6, lineHeight: 16 },

  filterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 14 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  filterIco: { fontSize: 14, marginRight: 6 },
  filterTxt: { fontSize: 12, fontWeight: '600', color: '#333' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: RED, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  exportIco: { fontSize: 14, color: '#fff', marginRight: 6 },
  exportTxt: { fontSize: 11, fontWeight: '800', color: '#fff', lineHeight: 15 },

  heatCard: {
    marginHorizontal: 14, marginBottom: 14, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  heatLegend: { flexDirection: 'row', gap: 16, backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontSize: 10, color: '#ccc', fontWeight: '600' },
  mapArea:    { height: 200, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  liveBadge:  {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 6 },
  liveTxt: { fontSize: 10, color: '#fff', fontWeight: '700' },
  mapEmoji: { fontSize: 80, opacity: 0.15 },
  zoomBtns: { position: 'absolute', bottom: 14, right: 14, gap: 6 },
  zoomBtn:  { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  zoomTxt:  { fontSize: 18, color: '#fff', fontWeight: '300' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 12,
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle:  { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: 0.3, marginBottom: 14 },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  infoIco:    { fontSize: 18 },
  responseRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  responseLabel: { fontSize: 11, color: '#555', fontWeight: '600' },
  responseVal:   { fontSize: 18, fontWeight: '900', color: '#1565C0' },
  barTrack: { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 12 },
  barFill:  { height: 5, borderRadius: 3 },
  responseNote: { fontSize: 10, color: '#888', fontStyle: 'italic', lineHeight: 15 },

  triggerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  triggerIcoBg:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  triggerIco:  { fontSize: 18, color: '#fff' },
  triggerInfo: { flex: 1 },
  triggerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  triggerName: { fontSize: 12, fontWeight: '700', color: '#111' },
  triggerPct:  { fontSize: 12, fontWeight: '800', color: '#555' },

  cityName:    { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.3 },
  cityRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 },
  cityNum:     { fontSize: 32, fontWeight: '900', color: '#111' },
  cityChange:  { backgroundColor: '#fde8e8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cityChangeTxt: { fontSize: 10, fontWeight: '700', color: RED },
  cityBar:     { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3 },
  cityBarFill: { height: 5, borderRadius: 3 },

  responderLabel: { fontSize: 11, color: '#555', fontWeight: '600', letterSpacing: 0.3 },
  responderNum:   { fontSize: 42, fontWeight: '900', color: '#111', marginTop: 4 },
  responderSub:   { fontSize: 11, color: '#888', marginBottom: 10 },
  avatarRow:      { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarTxt:  { fontSize: 18 },
  avatarMore: { fontSize: 12, fontWeight: '700', color: '#888', marginLeft: 8 },

  emergencyCard: {
    backgroundColor: RED, marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 20,
    shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  emergencyLabel: { fontSize: 11, color: '#ffc9c9', fontWeight: '600', letterSpacing: 0.5 },
  emergencyVal:   { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 4 },
  emergencyFr:    { fontSize: 12, color: '#ffc9c9', marginTop: 2 },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10,
  },
  navItem: { alignItems: 'center' },
  navIco:  { fontSize: 18, color: '#aaa' },
  navTxt:  { fontSize: 10, color: '#aaa', marginTop: 2 },
});
