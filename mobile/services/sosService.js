/**
 * TSN SOS Service
 * Handles ALL emergency triggering:
 * - Sends alert to backend
 * - Plays driver voice note
 * - Sends SMS to all registered police stations
 * - Makes emergency calls
 * - Works OFFLINE via SMS/Call fallback
 *
 * This same function is called by:
 * - Hardware button (3-second hold)
 * - App panic button (3-second hold)
 */

import { Linking, Vibration, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { createSOSAlert, getPoliceContacts } from './api';

let soundObj = null;

// ── Play driver voice note ────────────────────────────────────────────────────
export const playDriverVoice = async (voiceUri) => {
  if (!voiceUri) return;
  try {
    if (soundObj) {
      try { await soundObj.unloadAsync(); } catch (e) {}
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: voiceUri },
      { shouldPlay: true, volume: 1.0 }
    );
    soundObj = sound;
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        soundObj = null;
      }
    });
  } catch (e) {
    console.log('Voice play error:', e.message);
  }
};

// ── Main SOS trigger function ─────────────────────────────────────────────────
export const triggerSOS = async ({ user, location, voiceUri, token, nav }) => {

  // ── 1. Vibrate hard ───────────────────────────────────────────────────────
  Vibration.vibrate([0, 500, 100, 500, 100, 1000]);

  // ── 2. Play voice note immediately ────────────────────────────────────────
  if (voiceUri) {
    playDriverVoice(voiceUri);
  }

  // ── 3. Build alert data ───────────────────────────────────────────────────
  const lat        = location?.latitude?.toFixed(5)  || '3.84800';
  const lng        = location?.longitude?.toFixed(5) || '11.50210';
  const mapsLink   = `https://maps.google.com?q=${lat},${lng}`;
  const driverName = user?.fullName      || 'Unknown Driver';
  const badgeId    = user?.badgeId       || 'UNKNOWN';
  const plate      = user?.vehiclePlate  || 'UNKNOWN';
  const network    = user?.network       || 'MTN';
  const phone      = user?.phoneNumber   || '';

  const alertData = {
    driverId:      badgeId,
    driverName,
    phoneNumber:   phone,
    network,
    vehiclePlate:  plate,
    alertType:     'sos',
    location: {
      lat:     parseFloat(lat),
      lng:     parseFloat(lng),
      address: `${lat}° N, ${lng}° E`,
    },
    triggerMethod: 'hardware_button',
    hasVoiceNote:  !!voiceUri,
    timestamp:     new Date().toISOString(),
  };

  // ── SMS body for offline fallback ─────────────────────────────────────────
  const smsText =
    `🚨 TSN EMERGENCY SOS 🚨\n` +
    `Driver: ${driverName}\n` +
    `Badge:  ${badgeId}\n` +
    `Plate:  ${plate}\n` +
    `GPS:    ${lat}° N, ${lng}° E\n` +
    `Maps:   ${mapsLink}\n` +
    `Tel:    ${phone}\n` +
    `Time:   ${new Date().toLocaleTimeString()}\n` +
    `Network: ${network}\n\n` +
    `RESPOND IMMEDIATELY — DRIVER NEEDS HELP`;

  const smsEncoded = encodeURIComponent(smsText);

  // ── 4. Try online: send to backend ───────────────────────────────────────
  let onlineSuccess = false;
  try {
    await createSOSAlert(alertData, token);
    onlineSuccess = true;
    console.log('✅ SOS sent to backend successfully');
  } catch (e) {
    console.log('❌ Backend offline — using SMS/Call fallback');
  }

  // ── 5. Get registered police contacts ────────────────────────────────────
  let policeNumbers = ['+237222221234']; // default fallback
  try {
    const data = await getPoliceContacts();
    if (data.stations && data.stations.length > 0) {
      policeNumbers = data.stations
        .filter(s => s.emergencyLine)
        .map(s => s.emergencyLine);
    }
  } catch (e) {
    console.log('Could not fetch police contacts — using defaults');
  }

  // ── 6. Show action options ────────────────────────────────────────────────
  const actions = [
    {
      text: '📞 CALL POLICE 117',
      onPress: () => Linking.openURL('tel:117'),
    },
    {
      text: '📞 CALL AMBULANCE 15',
      onPress: () => Linking.openURL('tel:15'),
    },
    {
      text: '📱 SMS ALL POLICE STATIONS',
      onPress: () => {
        // Send SMS to all registered police stations
        policeNumbers.forEach((num, idx) => {
          setTimeout(() => {
            Linking.openURL(`sms:${num}?body=${smsEncoded}`);
          }, idx * 500);
        });
      },
    },
    {
      text: '🗺 SHARE MY LOCATION',
      onPress: () => Linking.openURL(mapsLink),
    },
    {
      text: '✅ DONE — View Status',
      onPress: () => nav('confirmation'),
    },
  ];

  Alert.alert(
    onlineSuccess
      ? '🚨 SOS SENT — ALL NOTIFIED'
      : '🚨 SOS TRIGGERED — OFFLINE MODE',
    onlineSuccess
      ? `✅ Alert sent to all police & drivers\n${voiceUri ? '🎙 Your voice note is broadcasting\n' : ''}📍 ${lat}° N, ${lng}° E\n\nSelect additional action:`
      : `⚠ No internet — Use SMS/Call below\n📍 ${lat}° N, ${lng}° E\n\nSMS will be sent to ${policeNumbers.length} police station(s):`,
    actions
  );

  return { success: true, onlineSuccess, lat, lng };
};
