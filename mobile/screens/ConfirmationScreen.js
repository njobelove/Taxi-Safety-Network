import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const GREEN = '#2e7d32';
const BLUE  = '#1565C0';
const GOLD  = '#f5c518';

export default function ConfirmationScreen({ nav, location }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Success icon */}
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={80} color="#fff" />
        </View>

        <Text style={s.title}>SOS ALERT SENT!</Text>
        <Text style={s.sub}>
          Your emergency alert has been broadcast to all nearby police stations and drivers.
        </Text>

        {/* Status items */}
        {[
          { icon: 'notifications-active', text: 'All police stations notified',   color: GREEN },
          { icon: 'directions-car',       text: 'Nearby drivers alerted',         color: GOLD  },
          { icon: 'location-on',          text: location ? 'GPS location shared' : 'Location unavailable', color: location ? GREEN : '#888' },
          { icon: 'mic',                  text: 'Voice note broadcasting',        color: GREEN },
        ].map(({ icon, text, color }) => (
          <View key={text} style={s.statusRow}>
            <MaterialIcons name={icon} size={22} color={color} />
            <Text style={[s.statusTxt, { color }]}>{text}</Text>
          </View>
        ))}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, { backgroundColor: RED }]} onPress={() => Linking.openURL('tel:117')}>
            <MaterialIcons name="local-phone" size={20} color="#fff" />
            <Text style={s.btnTxt}>CALL POLICE 117</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, { backgroundColor: BLUE }]} onPress={() => Linking.openURL('tel:15')}>
            <MaterialIcons name="medical-services" size={20} color="#fff" />
            <Text style={s.btnTxt}>CALL AMBULANCE 15</Text>
          </TouchableOpacity>

          {location && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: GREEN }]}
              onPress={() => Linking.openURL('https://maps.google.com?q=' + location.latitude + ',' + location.longitude)}
            >
              <MaterialIcons name="map" size={20} color="#fff" />
              <Text style={s.btnTxt}>SHARE MY LOCATION</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.btn, { backgroundColor: '#555' }]} onPress={() => nav('disactivation')}>
            <MaterialIcons name="notifications-off" size={20} color="#fff" />
            <Text style={s.btnTxt}>DEACTIVATE ALERT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.dashBtn} onPress={() => nav('driverDashboard')}>
            <MaterialIcons name="dashboard" size={20} color={RED} />
            <Text style={s.dashBtnTxt}>RETURN TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0d0d0d' },
  container:  { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  iconWrap:   { width: 130, height: 130, borderRadius: 65, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 10 },
  title:      { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 10, textAlign: 'center' },
  sub:        { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, width: '100%', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  statusTxt:  { fontSize: 14, fontWeight: '600' },
  actions:    { width: '100%', marginTop: 24, gap: 10 },
  btn:        { borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnTxt:     { fontSize: 14, fontWeight: '900', color: '#fff' },
  dashBtn:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#111', borderWidth: 1, borderColor: RED },
  dashBtnTxt: { fontSize: 14, fontWeight: '700', color: RED },
});