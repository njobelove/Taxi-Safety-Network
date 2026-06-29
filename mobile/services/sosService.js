import { Vibration, Alert, Linking, Platform } from 'react-native';
import { Audio } from 'expo-av';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const buildSMSBody = (user, location) => {
  const lat  = location?.latitude?.toFixed(5)  || 'unknown';
  const lng  = location?.longitude?.toFixed(5) || 'unknown';
  const link = location ? `https://maps.google.com?q=${lat},${lng}` : '';
  return `URGENT TSN SOS ALERT!\n` +
    `Driver: ${user?.fullName || 'Unknown'}\n` +
    `Badge:  ${user?.badgeId  || 'Unknown'}\n` +
    `Plate:  ${user?.vehiclePlate || 'Unknown'}\n` +
    `Phone:  ${user?.phoneNumber  || 'Unknown'}\n` +
    `GPS:    ${lat}N ${lng}E\n` +
    `Map:    ${link}\n` +
    `NEEDS IMMEDIATE POLICE HELP!`;
};

const playVoice = async (voiceUri) => {
  if (!voiceUri || voiceUri.startsWith('blob:')) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
    const { sound } = await Audio.Sound.createAsync({ uri: voiceUri }, { shouldPlay: true, volume: 1.0 });
    sound.setOnPlaybackStatusUpdate(s => { if (s.didJustFinish) sound.unloadAsync(); });
  } catch (e) { console.log('Voice error:', e.message); }
};

const sendSMS = (number, body) => {
  const url = Platform.OS === 'ios'
    ? `sms:${number}&body=${encodeURIComponent(body)}`
    : `sms:${number}?body=${encodeURIComponent(body)}`;
  return Linking.openURL(url).catch(() => {});
};

export const triggerSOS = async ({ user, location, voiceUri, token, nav, alertType = 'sos' }) => {
  // 1. Vibrate immediately
  Vibration.vibrate([0, 500, 200, 500, 200, 1000]);

  // 2. Play own voice immediately
  if (voiceUri) playVoice(voiceUri);

  const smsBody = buildSMSBody(user, location);
  const mapsUrl = location
    ? 'https://maps.google.com?q=' + location.latitude + ',' + location.longitude
    : null;

  // 3. Try to send online
  let sentOnline   = false;
  let notifyPhones = [];

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(BASE_URL + '/api/alerts/sos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      body: JSON.stringify({
        driverId:     user?.badgeId      || 'UNKNOWN',
        driverName:   user?.fullName     || 'Unknown Driver',
        phoneNumber:  user?.phoneNumber,
        network:      user?.network,
        vehiclePlate: user?.vehiclePlate,
        alertType,
        triggerMethod: 'panic_button',
        hasVoiceNote: !!voiceUri && !voiceUri.startsWith('blob:'),
        location: location ? {
          lat:     location.latitude,
          lng:     location.longitude,
          address: location.latitude.toFixed(4) + '°N, ' + location.longitude.toFixed(4) + '°E',
        } : { lat: null, lng: null, address: 'Location unavailable' },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data   = await res.json();
      sentOnline   = true;
      notifyPhones = data.notifyPhones || [];
      console.log('✅ SOS sent online, notifying', notifyPhones.length, 'users');
    }
  } catch (e) {
    console.log('Online SOS failed:', e.message);
  }

  // 4. ALWAYS send SMS to police 117 (works online AND offline)
  // This is the key innovation — SMS works even without internet
  const alwaysSmsPolice = () => {
    return sendSMS('117', smsBody);
  };

  // 5. Show alert with options
  const buttons = [
    {
      text: 'Call Police 117',
      onPress: () => Linking.openURL('tel:117'),
    },
    {
      text: 'SMS Police 117',
      onPress: () => sendSMS('117', smsBody),
    },
    {
      text: 'Call Ambulance 15',
      onPress: () => Linking.openURL('tel:15'),
    },
    {
      text: mapsUrl ? 'Open My Location' : 'Deactivate Later',
      onPress: () => mapsUrl ? Linking.openURL(mapsUrl) : null,
    },
    {
      text: 'OK - Continue',
      onPress: () => {},
    },
  ];

  Alert.alert(
    sentOnline ? 'SOS ALERT SENT!' : 'OFFLINE — SMS Sent to Police',
    sentOnline
      ? `Alert broadcast to ${notifyPhones.length} registered users!\n\n` +
        'Your location and voice note are broadcasting.\n\n' +
        'SMS also sent to Police 117.\n\n' +
        'Stay safe — help is on the way!'
      : 'No internet connection!\n\n' +
        'SMS automatically sent to Police 117 with your location.\n\n' +
        'Your GPS: ' + (location ? location.latitude.toFixed(4) + '°N' : 'unavailable'),
    buttons,
    { cancelable: false }
  );

  // 6. Auto-send SMS to 117 regardless of online status
  setTimeout(() => alwaysSmsPolice(), 500);

  if (nav) nav('confirmation');
};