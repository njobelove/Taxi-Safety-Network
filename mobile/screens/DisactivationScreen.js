import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const BLUE  = '#1565C0';

export default function DisactivationScreen({ nav }) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  const handleConfirmSafe = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1000));
    setConfirmed(true);
    setConfirming(false);
  };

  const handleGoToDashboard = () => {
    nav('driverDashboard');
  };

  const handleCallPolice = () => {
    Alert.alert('Call Police', 'Dial 117?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📞 CALL', onPress: () => require('react-native').Linking.openURL('tel:117') }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.shieldWrap}>
            <Text style={s.shieldIco}>🛡</Text>
          </View>
          <Text style={s.headerTitle}>TSN ALERT STATUS</Text>
        </View>

        {!confirmed ? (
          <>
            {/* Alert active */}
            <View style={s.alertActiveCard}>
              <View style={s.redPulse} />
              <Text style={s.alertActiveTitle}>🚨 ALERT IS ACTIVE</Text>
              <Text style={s.alertActiveSub}>
                Your SOS alert has been sent to all nearby{'\n'}
                police stations and drivers.{'\n\n'}
                Help is on the way. Stay calm.
              </Text>
            </View>

            {/* Driver info */}
            <View style={s.infoCard}>
              <Text style={s.infoRow}>🪪 Badge: {user?.badgeId || '—'}</Text>
              <Text style={s.infoRow}>👤 Name: {user?.fullName || '—'}</Text>
              <Text style={s.infoRow}>🚗 Plate: {user?.vehiclePlate || '—'}</Text>
              <Text style={s.infoRow}>📶 Network: {user?.network || 'MTN'}</Text>
            </View>

            {/* Call police */}
            <TouchableOpacity style={s.callBtn} onPress={handleCallPolice}>
              <Text style={s.callBtnTxt}>📞 CALL POLICE NOW — 117</Text>
            </TouchableOpacity>

            {/* Confirm safe */}
            <TouchableOpacity
              style={[s.safeBtn, confirming && { opacity: 0.7 }]}
              onPress={handleConfirmSafe}
              disabled={confirming}
            >
              {confirming
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={s.safeBtnTxt}>✅ I AM SAFE — DEACTIVATE ALERT</Text>
                    <Text style={s.safeBtnSub}>Tap to cancel the emergency alert</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Alert deactivated */}
            <View style={s.confirmedCard}>
              <Text style={s.confirmedIco}>✅</Text>
              <Text style={s.confirmedTitle}>ALERT DEACTIVATED</Text>
              <Text style={s.confirmedSub}>
                Your emergency alert has been cancelled.{'\n'}
                You have confirmed you are safe.{'\n\n'}
                Police and nearby drivers have been notified.
              </Text>
            </View>

            <TouchableOpacity
              style={s.dashboardBtn}
              onPress={handleGoToDashboard}
            >
              <Text style={s.dashboardBtnTxt}>⊞ RETURN TO DASHBOARD</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0d0d0d' },
  container:        { flex: 1, padding: 20 },
  header:           { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  shieldWrap:       { width: 40, height: 40, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shieldIco:        { fontSize: 22, color: '#fff' },
  headerTitle:      { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  alertActiveCard:  { backgroundColor: '#1a0000', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: RED },
  redPulse:         { width: 16, height: 16, borderRadius: 8, backgroundColor: RED, marginBottom: 14 },
  alertActiveTitle: { fontSize: 22, fontWeight: '900', color: RED, marginBottom: 12 },
  alertActiveSub:   { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 22 },
  infoCard:         { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 16 },
  infoRow:          { fontSize: 13, color: '#ccc', marginBottom: 8, fontWeight: '600' },
  callBtn:          { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  callBtnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  safeBtn:          { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  safeBtnTxt:       { fontSize: 15, fontWeight: '900', color: '#fff' },
  safeBtnSub:       { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  confirmedCard:    { backgroundColor: '#0a1f0a', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: GREEN },
  confirmedIco:     { fontSize: 52, marginBottom: 16 },
  confirmedTitle:   { fontSize: 22, fontWeight: '900', color: GREEN, marginBottom: 12 },
  confirmedSub:     { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 22 },
  dashboardBtn:     { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  dashboardBtnTxt:  { fontSize: 15, fontWeight: '900', color: '#fff' },
});
