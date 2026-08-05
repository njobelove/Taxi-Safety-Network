/**
 * TSN Alert Sound Service
 * Plays urgent alarm when new SOS alert arrives
 * Works on web and native
 */
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

let lastAlertCount = 0;
let soundObj       = null;
let isPlaying      = false;

// Generate alarm tone using Web Audio API on web
const playWebAlarm = () => {
  try {
    const ctx       = new (window.AudioContext || window.webkitAudioContext)();
    const duration  = 0.3;
    const gaps      = [0, 0.4, 0.8, 1.2, 1.6];

    gaps.forEach(start => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime + start);
      osc.frequency.setValueAtTime(660, ctx.currentTime + start + 0.15);
      gain.gain.setValueAtTime(0.8, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime  + start + duration);
    });

    // Close context after sounds play
    setTimeout(() => ctx.close(), 2500);
  } catch (e) {
    console.log('Web alarm error:', e.message);
  }
};

const playNativeAlarm = async () => {
  try {
    if (soundObj) {
      await soundObj.stopAsync();
      await soundObj.unloadAsync();
      soundObj = null;
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS:    true,
      allowsRecordingIOS:      false,
      shouldDuckAndroid:       false,
    });
    // Use a built-in system sound if available, otherwise just vibrate
    const { Vibration } = require('react-native');
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
  } catch (e) {
    console.log('Native alarm error:', e.message);
  }
};

export const checkAndPlayAlarm = (currentAlerts, muted = false) => {
  if (muted) return;
  const count = currentAlerts?.filter(a => a.status !== 'resolved')?.length || 0;

  if (count > lastAlertCount) {
    console.log('🚨 NEW ALERT — playing alarm');
    if (Platform.OS === 'web') {
      playWebAlarm();
    } else {
      playNativeAlarm();
    }
  }
  lastAlertCount = count;
};

export const resetAlertCount = () => { lastAlertCount = 0; };