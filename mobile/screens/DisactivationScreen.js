import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
  ScrollView, Linking,
} from 'react-native';
import { getAllAlerts, updateAlertStatus } from '../services/api';
import { voiceAlertService } from '../services/voiceAlertService';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const BLUE  = '#1565C0';
const GOLD  = '#f5c518';

export default function DisactivationScreen({ nav }) {
  const { user, token } = useAuth();
  const [myAlerts,   setMyAlerts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [resolving,  setResolving]  = useState(null);
  const [confirmed,  setConfirmed]  = useState(false);

  useEffect(() => {
    loadMyAlerts();
  }, []);

  const loadMyAlerts = async () => {
    try {
      const data = await getAllAlerts();
      // Show only THIS driver's active alerts
      const mine = (data.alerts || []).filter(
        a => a.driverId === user?.badgeId && a.status !== 'resolved'
      );
      setMyAlerts(mine);
    } catch (e) {
      console.log('Load alerts error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (alertId) => {
    Alert.alert(
      '✅ Confirm Safe',
      'Are you safe? This will deactivate your alert and notify police and nearby drivers that you are safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ YES — I AM SAFE',
          onPress: async () => {
            setResolving(alertId);
            try {
              await updateAlertStatus(alertId, 'resolved', user?.badgeId, token);
              // Remove from voice queue
              voiceAlertService.removeAlert(alertId);
              // Remove from local list
              setMyAlerts(prev => prev.filter(a => (a._id || a.id) !== alertId));
              if (myAlerts.length <= 1) {
                setConfirmed(true);
              }
              Alert.alert(
                '✅ Alert Deactivated',
                'Your emergency alert has been cancelled.\nPolice and drivers have been notified you are safe.'
              );
            } catch (e) {
              Alert.alert('Error', 'Could not deactivate alert. Try again.');
            } finally {
              setResolving(null);
            }
          }
        }
      ]
    );
  };

  const handleDeactivateAll = async () => {
    if (myAlerts.length === 0) return;
    Alert.alert(
      '✅ Deactivate All Alerts',
      'Deactivate ALL your active alerts? This confirms you are safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ YES — DEACTIVATE ALL',
          style: 'destructive',
          onPress: async () => {
            for (const alert of myAlerts) {
              const alertId = alert._id || alert.id;
              try {
                await updateAlertStatus(alertId, 'resolved', user?.badgeId, token);
                voiceAlertService.removeAlert(alertId);
              } catch (e) {}
            }
            setMyAlerts([]);
            setConfirmed(true);
          }
        }
      ]
    );
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    return Math.floor(diff / 60) + 'h ago';
  };

  const ALERT_COLORS = {
    robbery: RED, assault: '#e65100', accident: BLUE,
    medical: '#827717', theft: '#6a1b9a', sos: RED,
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav('driverDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🚨 MY ACTIVE ALERTS</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.container}>

          {loading ? (
            <View style={s.loadBox}>
              <ActivityIndicator size="large" color={RED} />
              <Text style={s.loadTxt}>Loading your alerts...</Text>
            </View>

          ) : confirmed || myAlerts.length === 0 ? (
            /* All clear */
            <View style={s.confirmedCard}>
              <Text style={s.confirmedIco}>✅</Text>
              <Text style={s.confirmedTitle}>ALL ALERTS DEACTIVATED</Text>
              <Text style={s.confirmedSub}>
                You have confirmed you are safe.{'\n'}
                Police and nearby drivers have been notified.{'\n\n'}
                Thank you for using TSN.
              </Text>
              <TouchableOpacity style={s.dashBtn} onPress={() => nav('driverDashboard')}>
                <Text style={s.dashBtnTxt}>⊞ RETURN TO DASHBOARD</Text>
              </TouchableOpacity>
            </View>

          ) : (
            <>
              {/* Active alert status */}
              <View style={s.statusCard}>
                <View style={s.redPulse} />
                <View style={{ flex: 1 }}>
                  <Text style={s.statusTitle}>
                    🚨 {myAlerts.length} ACTIVE ALERT{myAlerts.length > 1 ? 'S' : ''}
                  </Text>
                  <Text style={s.statusSub}>
                    Your alerts are broadcasting to police and nearby drivers.{'\n'}
                    Tap DEACTIVATE on each alert when you are safe.
                  </Text>
                </View>
              </View>

              {/* Driver info */}
              <View style={s.driverCard}>
                <Text style={s.driverLabel}>YOUR DETAILS</Text>
                <Text style={s.driverName}>{user?.fullName || '—'}</Text>
                <Text style={s.driverMeta}>
                  🪪 {user?.badgeId || '—'}  ·  🚗 {user?.vehiclePlate || '—'}
                </Text>
              </View>

              {/* Each alert with deactivate button */}
              {myAlerts.map((alert) => {
                const alertId = alert._id || alert.id;
                const col     = ALERT_COLORS[alert.alertType] || RED;
                const lat     = alert.location?.lat;
                const lng     = alert.location?.lng;

                return (
                  <View key={alertId} style={[s.alertCard, { borderLeftColor: col }]}>
                    <View style={s.alertTop}>
                      <View style={[s.alertTag, { backgroundColor: col }]}>
                        <Text style={s.alertTagTxt}>
                          {alert.alertType?.toUpperCase() || 'SOS'}
                        </Text>
                      </View>
                      <Text style={s.alertTime}>
                        {formatTime(alert.timestamp || alert.createdAt)}
                      </Text>
                      <View style={s.activeBadge}>
                        <Text style={s.activeTxt}>● ACTIVE</Text>
                      </View>
                    </View>

                    <Text style={s.alertLocation}>
                      📍 {alert.location?.address ||
                        (lat ? parseFloat(lat).toFixed(4) + '° N, ' + parseFloat(lng).toFixed(4) + '° E'
                             : 'Location not available')}
                    </Text>

                    <Text style={s.alertMethod}>
                      Triggered via: {alert.triggerMethod || 'manual'}
                    </Text>

                    {/* Action buttons */}
                    <View style={s.btnRow}>
                      {lat && (
                        <TouchableOpacity
                          style={s.mapsBtn}
                          onPress={() => Linking.openURL('https://maps.google.com?q=' + lat + ',' + lng)}
                        >
                          <Text style={s.mapsBtnTxt}>🗺 View</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[s.callBtn]}
                        onPress={() => Linking.openURL('tel:117')}
                      >
                        <Text style={s.callBtnTxt}>📞 117</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.deactivateBtn}
                        onPress={() => handleDeactivate(alertId)}
                        disabled={resolving === alertId}
                      >
                        {resolving === alertId
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={s.deactivateBtnTxt}>✅ I AM SAFE — DEACTIVATE</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Deactivate all button */}
              {myAlerts.length > 1 && (
                <TouchableOpacity style={s.deactivateAllBtn} onPress={handleDeactivateAll}>
                  <Text style={s.deactivateAllTxt}>
                    ✅ DEACTIVATE ALL {myAlerts.length} ALERTS — I AM SAFE
                  </Text>
                </TouchableOpacity>
              )}

              {/* Still in danger */}
              <View style={s.dangerBox}>
                <Text style={s.dangerTitle}>Still in danger?</Text>
                <View style={s.dangerBtns}>
                  <TouchableOpacity
                    style={[s.dangerBtn, { backgroundColor: RED }]}
                    onPress={() => Linking.openURL('tel:117')}
                  >
                    <Text style={s.dangerBtnTxt}>📞 Call Police 117</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.dangerBtn, { backgroundColor: BLUE }]}
                    onPress={() => Linking.openURL('tel:15')}
                  >
                    <Text style={s.dangerBtnTxt}>🚑 Call Ambulance 15</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0d0d0d' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  back:             { fontSize: 22, color: RED, fontWeight: '600' },
  headerTitle:      { fontSize: 15, fontWeight: '900', color: '#fff' },
  container:        { padding: 16 },
  loadBox:          { alignItems: 'center', paddingVertical: 60 },
  loadTxt:          { color: '#666', marginTop: 12 },
  confirmedCard:    { backgroundColor: '#0a1f0a', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 2, borderColor: GREEN },
  confirmedIco:     { fontSize: 64, marginBottom: 16 },
  confirmedTitle:   { fontSize: 22, fontWeight: '900', color: GREEN, marginBottom: 12, textAlign: 'center' },
  confirmedSub:     { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  dashBtn:          { backgroundColor: RED, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  dashBtnTxt:       { fontSize: 14, fontWeight: '900', color: '#fff' },
  statusCard:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1a0000', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: RED, gap: 12 },
  redPulse:         { width: 14, height: 14, borderRadius: 7, backgroundColor: RED, marginTop: 3 },
  statusTitle:      { fontSize: 16, fontWeight: '900', color: RED, marginBottom: 6 },
  statusSub:        { fontSize: 12, color: '#ccc', lineHeight: 18 },
  driverCard:       { backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 12 },
  driverLabel:      { fontSize: 10, color: '#666', fontWeight: '600', marginBottom: 6 },
  driverName:       { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  driverMeta:       { fontSize: 12, color: '#aaa' },
  alertCard:        { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  alertTop:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  alertTag:         { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  alertTagTxt:      { fontSize: 12, fontWeight: '800', color: '#fff' },
  alertTime:        { flex: 1, fontSize: 11, color: '#888' },
  activeBadge:      { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeTxt:        { fontSize: 10, fontWeight: '800', color: '#fff' },
  alertLocation:    { fontSize: 13, fontWeight: '700', color: '#90caf9', marginBottom: 6 },
  alertMethod:      { fontSize: 11, color: '#666', marginBottom: 12 },
  btnRow:           { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mapsBtn:          { backgroundColor: '#1a3a1a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  mapsBtnTxt:       { fontSize: 12, fontWeight: '700', color: '#4caf50' },
  callBtn:          { backgroundColor: '#1a1a3a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  callBtnTxt:       { fontSize: 12, fontWeight: '700', color: '#90caf9' },
  deactivateBtn:    { flex: 1, backgroundColor: GREEN, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deactivateBtnTxt: { fontSize: 12, fontWeight: '900', color: '#fff' },
  deactivateAllBtn: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  deactivateAllTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  dangerBox:        { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 20 },
  dangerTitle:      { fontSize: 13, fontWeight: '800', color: '#aaa', marginBottom: 10, textAlign: 'center' },
  dangerBtns:       { flexDirection: 'row', gap: 8 },
  dangerBtn:        { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerBtnTxt:     { fontSize: 12, fontWeight: '800', color: '#fff' },
});