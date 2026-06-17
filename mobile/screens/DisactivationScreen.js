import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Vibration,
} from 'react-native';

const RED = '#d32f2f';

export default function DisactivationScreen({ nav, location }) {
  const [seconds, setSeconds] = useState(252); // 00:04:12

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

      {/* Top header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}><Text style={s.shieldIco}>🛡</Text></View>
          <Text style={s.brand}>SENTINEL</Text>
        </View>
        <Text style={s.network}>MTN 4G</Text>
        <Text style={s.globe}>🌐</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Live SOS card */}
        <View style={s.sosCard}>
          {/* Background overlay */}
          <View style={s.sosBg} />
          <View style={s.sosContent}>
            <View style={s.sosTopRow}>
              <View style={s.liveDot} />
              <Text style={s.liveLabel}>LIVE SOS / SOS EN D</Text>
              <Text style={s.elapsed}>{fmt(seconds)}</Text>
            </View>
            <View style={s.camRow}>
              <Text style={s.camTxt}>CAM ID: 49-X21</Text>
              <Text style={s.elapsedLabel}>ELAPSED / TEMPS ÉCOULÉ</Text>
            </View>
            <View style={s.sosBottom}>
              <View>
                <Text style={s.street}>Akwa, Rue</Text>
                <Text style={s.street}>Joffre</Text>
                <Text style={s.coords}>4.051° N, 9.7679° E</Text>
              </View>
              <View style={s.audioBadge}>
                <View style={s.audioDot} />
                <Text style={s.audioTxt}>AUDIO UPLINK{'\n'}ACTIVE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nearby responders */}
        <View style={s.section}>
          <View style={s.respHeaderRow}>
            <Text style={s.respTitle}>NEARBY RESPONDERS</Text>
            <View style={s.interveningBadge}>
              <Text style={s.interveningTxt}>INTERVENING</Text>
            </View>
          </View>

          {/* Responder 1 */}
          <View style={s.respCard}>
            <View style={s.respIconBlue}><Text style={s.respIconTxt}>⭐</Text></View>
            <View style={s.respInfo}>
              <Text style={s.respName}>RESPONDER #14</Text>
              <Text style={s.respType}>RAPID INTERVENTION FORCE</Text>
            </View>
            <View style={s.respDist}>
              <Text style={s.distNum}>200m</Text>
              <Text style={s.distEta}>EST. 1M</Text>
            </View>
          </View>

          {/* Responder 2 */}
          <View style={s.respCard}>
            <View style={s.respIconRed}><Text style={s.respIconTxt}>➕</Text></View>
            <View style={s.respInfo}>
              <Text style={s.respName}>MEDIC TEAM B</Text>
              <Text style={s.respType}>PUBLIC EMS</Text>
            </View>
            <View style={s.respDist}>
              <Text style={s.distNum}>850m</Text>
              <Text style={s.distEta}>EST. 4M</Text>
            </View>
          </View>

          {/* Mini map placeholder */}
          <View style={s.miniMap}>
            <Text style={s.miniMapTxt}>📍 Live Map — Responder Positions</Text>
          </View>
        </View>

        {/* Contacts notified */}
        <View style={s.contactCard}>
          <View style={s.contactIcon}><Text style={s.contactIconTxt}>✔</Text></View>
          <View style={s.contactInfo}>
            <Text style={s.contactTitle}>CONTACTS NOTIFIED</Text>
            <Text style={s.contactDesc}>
              Your emergency contacts have received your live location and audio feed.
            </Text>
          </View>
        </View>

        {/* Safe stop */}
        <View style={s.safeSection}>
          <Text style={s.safeLabel}>ARE YOU SAFE? / ÊTES-VOUS EN SÉCURITÉ?</Text>
          <TouchableOpacity
            style={s.stopBtn}
            onLongPress={() => { Vibration.vibrate(500); nav('DriverDashboard'); }}
            delayLongPress={3000}
            activeOpacity={0.88}
          >
            <Text style={s.stopIco}>✅</Text>
            <Text style={s.stopTxt}>SAFE - STOP SOS</Text>
          </TouchableOpacity>
          <Text style={s.stopHint}>Press and hold for 3 seconds to cancel emergency alert.</Text>
        </View>

      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <View style={s.navItemActive}>
          <Text style={s.navIco}>✱</Text>
          <Text style={[s.navTxt, { color: RED }]}>SOS</Text>
        </View>
        {[{ ico: '👥', lbl: 'RESPONDERS' }, { ico: '📊', lbl: 'REPORTS' }, { ico: '👤', lbl: 'PROFILE' }].map(({ ico, lbl }) => (
          <TouchableOpacity key={lbl} style={s.navItem}>
            <Text style={s.navIcoGrey}>{ico}</Text>
            <Text style={s.navTxtGrey}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#1a1a2e',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shieldWrap: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  shieldIco: { fontSize: 15, color: '#fff' },
  brand:     { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  network:   { fontSize: 13, fontWeight: '700', color: '#f5c518', marginRight: 10 },
  globe:     { fontSize: 18 },

  /* SOS Card */
  sosCard: {
    margin: 14, borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: RED, height: 200,
  },
  sosBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0d0d1a',
    opacity: 0.9,
  },
  sosContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
  sosTopRow: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4444', marginRight: 8 },
  liveLabel: { fontSize: 12, fontWeight: '700', color: '#fff', flex: 1 },
  elapsed:   { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  camRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  camTxt:    { fontSize: 11, color: '#aaa' },
  elapsedLabel: { fontSize: 10, color: '#f5c518', fontWeight: '700', letterSpacing: 1 },
  sosBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  street:    { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  coords:    { fontSize: 11, color: '#aaa', marginTop: 4 },
  audioBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30,30,50,0.8)', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: '#333',
  },
  audioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 8 },
  audioTxt: { fontSize: 11, fontWeight: '700', color: '#fff', lineHeight: 15 },

  /* Responders */
  section: {
    backgroundColor: '#252540', marginHorizontal: 14, borderRadius: 16,
    padding: 16, marginBottom: 12,
  },
  respHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  respTitle:     { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  interveningBadge: { backgroundColor: '#b7950b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  interveningTxt:   { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  respCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e1e36', borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  respIconBlue: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#1565C0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  respIconRed: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  respIconTxt: { fontSize: 20 },
  respInfo:    { flex: 1 },
  respName:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  respType:    { fontSize: 10, color: '#aaa', marginTop: 2 },
  respDist:    { alignItems: 'flex-end' },
  distNum:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  distEta:     { fontSize: 10, color: '#4caf50', fontWeight: '700', marginTop: 2 },

  miniMap: {
    backgroundColor: '#333', borderRadius: 10, height: 90,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  miniMapTxt: { color: '#aaa', fontSize: 12 },

  /* Contacts */
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1565C0', marginHorizontal: 14,
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  contactIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#0d47a1',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  contactIconTxt: { fontSize: 18, color: '#fff' },
  contactInfo:    { flex: 1 },
  contactTitle:   { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  contactDesc:    { fontSize: 11, color: '#90caf9', marginTop: 4, lineHeight: 16 },

  /* Safe stop */
  safeSection: {
    marginHorizontal: 14, marginBottom: 20,
    backgroundColor: '#252540', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#3a3a60',
  },
  safeLabel: { textAlign: 'center', fontSize: 11, color: '#aaa', letterSpacing: 0.5, marginBottom: 14 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 18,
  },
  stopIco: { fontSize: 22, marginRight: 10 },
  stopTxt: { fontSize: 20, fontWeight: '900', color: '#111' },
  stopHint: { textAlign: 'center', fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 10 },

  /* Bottom nav */
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#333',
    paddingVertical: 10,
  },
  navItemActive: { alignItems: 'center' },
  navItem:       { alignItems: 'center' },
  navIco:    { fontSize: 18, color: RED },
  navTxt:    { fontSize: 10, fontWeight: '800', marginTop: 2 },
  navIcoGrey: { fontSize: 18, color: '#555' },
  navTxtGrey: { fontSize: 10, color: '#555', marginTop: 2 },
});
