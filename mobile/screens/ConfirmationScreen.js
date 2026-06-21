import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';

const RED = '#d32f2f';

export default function ConfirmationScreen({ nav, location }) {
  const alerts = [
    { ico: '✱', icoBg: '#d32f2f', name: 'PASSENGER DISTRESS', loc: 'Bastos • 0.8km away' },
    { ico: '⚠', icoBg: '#e65100', name: 'ACCIDENT REPORT', loc: 'Mvan • 4.2km away' },
    { ico: '🚓', icoBg: '#1565C0', name: 'TRAFFIC DISRUPTION', loc: 'Omnisport • 2.5km away' },
  ];

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <View>
            <Text style={s.headerTitle}>TAXI SAFETY NETWORK</Text>
            <Text style={s.headerSub}>SENTINEL CAMEROON</Text>
          </View>
        </View>
        <Text style={s.signalIco}>📶</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Map area */}
        <View style={s.mapArea}>
          <View style={s.mapBg}>
            <Text style={s.mapLabel}>🗺</Text>
            {/* SOS marker */}
            <View style={s.sosMarker}>
              <View style={s.sosMarkerInner}><Text style={s.sosMarkerTxt}>⚠</Text></View>
            </View>
          </View>
          {/* Location badge */}
          <View style={s.locationBadge}>
            <View style={s.redDot} />
            <Text style={s.locationTxt}>BASTOS DISTRICT</Text>
          </View>
          {/* Network pills */}
          <View style={s.networkRow}>
            <View style={s.mtnPill}><Text style={s.mtnTxt}>MTN ACTIVE</Text></View>
            <View style={s.orangePill}><Text style={s.orangeTxt}>ORANGE STANDBY</Text></View>
          </View>
        </View>

        {/* Active SOS Alert card */}
        <View style={s.sosCard}>
          <Text style={s.sosTitle}>ACTIVE SOS ALERT</Text>
          <Text style={s.sosFr}>Alerte SOS Active</Text>
          <View style={s.addrRow}>
            <Text style={s.addrIco}>📍</Text>
            <View>
              <Text style={s.addrMain}>Rue de Bastos, Near Embassy</Text>
              <Text style={s.addrSub}>Yaoundé, Cameroon</Text>
            </View>
          </View>
          <TouchableOpacity style={s.confirmBtn}>
            <Text style={s.confirmTxt}>CONFIRM RESPONSE</Text>
          </TouchableOpacity>
        </View>

        {/* Credibility score */}
        <View style={s.scoreCard}>
          <View style={s.scoreLeft}>
            <Text style={s.scoreTitle}>CREDIBILITY SCORE</Text>
            <Text style={s.scoreFr}>Score de Crédibilité</Text>
            <View style={s.scoreBar}>
              <View style={s.scoreBarFill} />
            </View>
            <Text style={s.eliteLabel}>ELITE RESPONDER STATUS</Text>
          </View>
          <Text style={s.scoreNum}>98</Text>
        </View>

        {/* Active alerts */}
        <View style={s.alertsCard}>
          <View style={s.alertsHeader}>
            <View>
              <Text style={s.alertsTitle}>ACTIVE ALERTS</Text>
              <Text style={s.alertsFr}>Alertes Actives dans le Rayon</Text>
            </View>
            <View style={s.liveBadge}><Text style={s.liveTxt}>LIVE</Text></View>
          </View>

          {alerts.map((a, i) => (
            <TouchableOpacity key={i} style={s.alertItem}>
              <View style={[s.alertIcoBg, { backgroundColor: a.icoBg }]}>
                <Text style={s.alertIco}>{a.ico}</Text>
              </View>
              <View style={s.alertInfo}>
                <Text style={s.alertName}>{a.name}</Text>
                <Text style={s.alertLoc}>{a.loc}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Command row */}
          <View style={s.commandRow}>
            <View style={s.commandAvatar}>
              <Text style={s.commandAvatarTxt}>👤</Text>
            </View>
            <View style={s.commandInfo}>
              <Text style={s.commandName}>CENTRAL COMMAND</Text>
              <Text style={s.commandSub}>ACTIVE DISPATCHER</Text>
            </View>
            <View style={s.onlineDot} />
          </View>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  shieldWrap: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  shieldIco:   { fontSize: 17, color: '#fff' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#111' },
  headerSub:   { fontSize: 10, color: '#888', marginTop: 1 },
  signalIco:   { fontSize: 20 },

  /* Map */
  mapArea: { position: 'relative', height: 240, backgroundColor: '#c8dea6' },
  mapBg:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c8dea6' },
  mapLabel:{ fontSize: 60, opacity: 0.3 },
  sosMarker: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    top: '40%', left: '45%',
  },
  sosMarkerInner: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: RED, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  sosMarkerTxt: { fontSize: 24, color: '#fff' },
  locationBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  redDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: RED, marginRight: 6 },
  locationTxt: { fontSize: 12, fontWeight: '800', color: '#111' },
  networkRow: {
    position: 'absolute', bottom: 14, left: 14,
    flexDirection: 'row', gap: 8,
  },
  mtnPill: {
    backgroundColor: '#f5c518', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  mtnTxt:    { fontSize: 11, fontWeight: '800', color: '#111' },
  orangePill: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#e65100',
  },
  orangeTxt: { fontSize: 11, fontWeight: '700', color: '#e65100' },

  /* SOS Card */
  sosCard: {
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sosTitle: { fontSize: 18, fontWeight: '900', color: RED },
  sosFr:    { fontSize: 12, fontStyle: 'italic', color: RED, marginBottom: 12 },
  addrRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  addrIco:  { fontSize: 16, marginRight: 8, marginTop: 2 },
  addrMain: { fontSize: 15, fontWeight: '700', color: '#111' },
  addrSub:  { fontSize: 12, color: '#888', marginTop: 2 },
  confirmBtn: {
    backgroundColor: RED, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  confirmTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },

  /* Score */
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: 10,
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  scoreLeft:  { flex: 1 },
  scoreTitle: { fontSize: 15, fontWeight: '800', color: '#1565C0' },
  scoreFr:    { fontSize: 11, color: '#888', marginBottom: 10 },
  scoreBar:   { height: 5, backgroundColor: '#e0e0e0', borderRadius: 3 },
  scoreBarFill: { width: '98%', height: 5, backgroundColor: '#1565C0', borderRadius: 3 },
  eliteLabel: { fontSize: 10, fontWeight: '700', color: '#555', marginTop: 8, letterSpacing: 0.5 },
  scoreNum:   { fontSize: 52, fontWeight: '900', color: '#1565C0', marginLeft: 16 },

  /* Alerts */
  alertsCard: {
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: 10, marginBottom: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  alertsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  alertsTitle:  { fontSize: 15, fontWeight: '900', color: '#111' },
  alertsFr:     { fontSize: 10, color: '#888', marginTop: 2 },
  liveBadge:    { backgroundColor: '#d32f2f', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  liveTxt:      { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  alertItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  alertIcoBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertIco:   { fontSize: 18, color: '#fff' },
  alertInfo:  { flex: 1 },
  alertName:  { fontSize: 13, fontWeight: '700', color: '#111' },
  alertLoc:   { fontSize: 11, color: '#888', marginTop: 2 },
  chevron:    { fontSize: 22, color: '#ccc' },

  commandRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12,
  },
  commandAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#333',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  commandAvatarTxt: { fontSize: 20 },
  commandInfo:  { flex: 1 },
  commandName:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  commandSub:   { fontSize: 10, color: '#aaa', marginTop: 2 },
  onlineDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4caf50' },

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
