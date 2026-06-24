import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Linking,
} from 'react-native';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const BLUE  = '#1565C0';

export default function ConfirmationScreen({ nav }) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        <View style={s.iconWrap}>
          <Text style={s.icon}>✅</Text>
        </View>

        <Text style={s.title}>ALERT CONFIRMED</Text>
        <Text style={s.titleFr}>ALERTE CONFIRMÉE</Text>

        <Text style={s.body}>
          Your emergency alert has been successfully sent to:{'\n\n'}
          👮 All nearby police stations{'\n'}
          🚖 All active TSN drivers{'\n'}
          📡 Central Command{'\n\n'}
          Help is on the way. Stay calm and stay safe.
        </Text>

        <View style={s.actionsCard}>
          <Text style={s.actionsTitle}>ADDITIONAL ACTIONS</Text>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => Linking.openURL('tel:117')}
          >
            <Text style={s.actionBtnTxt}>📞 Call Police — 117</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#1a5276' }]}
            onPress={() => Linking.openURL('tel:15')}
          >
            <Text style={s.actionBtnTxt}>🚑 Call Ambulance — 15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#7d6608' }]}
            onPress={() => Linking.openURL('tel:118')}
          >
            <Text style={s.actionBtnTxt}>🚒 Call Fire Brigade — 118</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.deactivateBtn}
          onPress={() => nav('disactivation')}
        >
          <Text style={s.deactivateTxt}>🔕 DEACTIVATE ALERT — I AM SAFE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.dashBtn}
          onPress={() => nav('driverDashboard')}
        >
          <Text style={s.dashBtnTxt}>⊞ RETURN TO DASHBOARD</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  container:       { flex: 1, padding: 24, alignItems: 'center' },
  iconWrap:        { width: 100, height: 100, borderRadius: 50, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 20 },
  icon:            { fontSize: 52 },
  title:           { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  titleFr:         { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 20 },
  body:            { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 22, marginBottom: 24, backgroundColor: '#111', borderRadius: 14, padding: 16, width: '100%' },
  actionsCard:     { width: '100%', marginBottom: 16 },
  actionsTitle:    { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' },
  actionBtn:       { backgroundColor: RED, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  actionBtnTxt:    { fontSize: 14, fontWeight: '800', color: '#fff' },
  deactivateBtn:   { width: '100%', backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  deactivateTxt:   { fontSize: 14, fontWeight: '900', color: '#fff' },
  dashBtn:         { width: '100%', backgroundColor: '#222', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  dashBtnTxt:      { fontSize: 13, fontWeight: '700', color: '#aaa' },
});
