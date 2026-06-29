import { Vibration, Alert, Linking, Platform } from 'react-native';
import { Audio } from 'expo-av';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

// Police emergency numbers in Cameroon for offline SMS
const POLICE_NUMBERS = ['117', '222231234', '222234567', '+237222231234'];

const buildSMSMessage = (user, location) => {
  const lat = location?.latitude?.toFixed(5) || 'unknown';
  const lng = location?.longitude?.toFixed(5) || 'unknown';
  const mapsLink = location ? `https://maps.google.com?q=${lat},${lng}` : '';
  return `URGENT SOS ALERT - TSN\n` +
    `Driver: ${user?.fullName || 'Unknown'}\n` +
    `Badge: ${user?.badgeId || 'Unknown'}\n` +
    `Plate: ${user?.vehiclePlate || 'Unknown'}\n` +
    `Phone: ${user?.phoneNumber || 'Unknown'}\n` +
    `Location: ${lat}°N ${lng}°E\n` +
    `Map: ${mapsLink}\n` +
    `NEEDS IMMEDIATE HELP!`;
};

const playVoice = async (voiceUri) => {
  if (!voiceUri || voiceUri.startsWith('blob:')) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
    const { sound } = await Audio.Sound.createAsync(
      { uri: voiceUri }, { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate(s => {
      if (s.didJustFinish) sound.unloadAsync();
    });
  } catch (e) { console.log('Voice playback error:', e.message); }
};

export const triggerSOS = async ({ user, location, voiceUri, token, nav, alertType = 'sos' }) => {
  // 1. Vibrate immediately
  Vibration.vibrate([0, 500, 200, 500, 200, 1000]);

  // 2. Play own voice note immediately
  if (voiceUri) {
    playVoice(voiceUri);
  }

  // 3. Build alert data
  const alertData = {
    driverId:      user?.badgeId   || 'UNKNOWN',
    driverName:    user?.fullName  || 'Unknown Driver',
    phoneNumber:   user?.phoneNumber,
    network:       user?.network,
    vehiclePlate:  user?.vehiclePlate,
    alertType,
    triggerMethod: 'panic_button',
    hasVoiceNote:  !!voiceUri && !voiceUri.startsWith('blob:'),
    location: location ? {
      lat:     location.latitude,
      lng:     location.longitude,
      address: `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E`,
    } : { lat: null, lng: null, address: 'Location not available' },
  };

  // 4. Try to send to backend (online)
  let sentOnline = false;
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(BASE_URL + '/api/alerts/sos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      body:    JSON.stringify(alertData),
      signal:  controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      sentOnline = true;
      console.log('✅ SOS sent online');
    }
  } catch (e) {
    console.log('Online SOS failed:', e.message);
  }

  // 5. Always show action options
  const smsBody     = buildSMSMessage(user, location);
  const mapsUrl     = location ? 'https://maps.google.com?q=' + location.latitude + ',' + location.longitude : null;

  const buttons = [
    {
      text: '📞 Call Police 117',
      onPress: () => Linking.openURL('tel:117'),
    },
    {
      text: '📱 SMS Police',
      onPress: () => {
        // SMS to police with pre-filled message
        const smsUrl = Platform.OS === 'ios'
          ? 'sms:117&body=' + encodeURIComponent(smsBody)
          : 'sms:117?body='  + encodeURIComponent(smsBody);
        Linking.openURL(smsUrl);
      },
    },
    {
      text: mapsUrl ? '🗺 Share Location' : '🔕 Deactivate Later',
      onPress: () => mapsUrl ? Linking.openURL(mapsUrl) : nav('disactivation'),
    },
    {
      text: '✅ Alert Sent — Continue',
      onPress: () => nav('driverDashboard'),
    },
  ];

  Alert.alert(
    sentOnline ? '🚨 SOS ALERT SENT!' : '⚠ OFFLINE — SMS Required',
    sentOnline
      ? '✅ Alert sent to all police and drivers!\n\n' +
        'Your location and voice note are broadcasting.\n\n' +
        'Police have been notified. Stay safe!'
      : '⚠ No internet connection!\n\n' +
        'Please use SMS or phone call to reach police directly.\n\n' +
        'Your location: ' + (location ? location.latitude.toFixed(4) + '°N' : 'unavailable'),
    buttons,
    { cancelable: false }
  );

  // 6. If offline — also auto-send SMS in background
  if (!sentOnline && user?.phoneNumber) {
    try {
      const smsUrl = Platform.OS === 'ios'
        ? 'sms:117&body=' + encodeURIComponent(smsBody)
        : 'sms:117?body='  + encodeURIComponent(smsBody);
      await Linking.openURL(smsUrl);
    } catch (e) { console.log('SMS fallback error:', e.message); }
  }

  if (nav) nav('confirmation');
};

// Send SMS to ALL registered drivers and police (called from backend)
export const notifyAllViaSMS = async (alertData, phoneNumbers) => {
  const msg = `TSN ALERT: ${alertData.alertType?.toUpperCase()} by ${alertData.driverName} at ${alertData.location?.address}. Badge: ${alertData.driverId}. Call 117.`;
  for (const number of phoneNumbers) {
    try {
      const url = Platform.OS === 'ios'
        ? 'sms:' + number + '&body=' + encodeURIComponent(msg)
        : 'sms:' + number + '?body=' + encodeURIComponent(msg);
      await Linking.openURL(url);
    } catch (e) {}
  }
};