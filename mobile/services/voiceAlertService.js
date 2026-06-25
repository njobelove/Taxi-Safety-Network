/**
 * TSN Voice Alert Service
 * Fixed version - handles blob URLs and base64 storage
 */
import { Audio } from 'expo-av';

class VoiceAlertService {
  constructor() {
    this.queue        = [];
    this.currentIdx   = 0;
    this.isLooping    = false;
    this.isMuted      = false;
    this.isPlaying    = false;
    this.currentSound = null;
    this.onPlaying    = null;
  }

  // Get voice URI - handles both blob and base64
  getVoiceUri(driverId) {
    try {
      const uri = localStorage.getItem('tsn_voice_' + driverId);
      if (!uri) return null;
      // blob: URLs expire after page reload - skip them
      if (uri.startsWith('blob:')) {
        console.log('Skipping expired blob URL for:', driverId);
        return null;
      }
      return uri;
    } catch (e) { return null; }
  }

  buildQueue(alerts) {
    const q = [];
    (alerts || []).forEach(alert => {
      if (!alert?.driverId) return;
      const voiceUri = this.getVoiceUri(alert.driverId);
      if (voiceUri) {
        q.push({
          alertId:    alert._id || alert.id,
          driverId:   alert.driverId,
          driverName: alert.driverName || 'Unknown',
          alertType:  alert.alertType  || 'SOS',
          voiceUri,
        });
      }
    });
    return q;
  }

  async start(alerts, onPlaying) {
    this.onPlaying  = onPlaying || null;
    this.isLooping  = true;
    this.isMuted    = false;
    this.queue      = this.buildQueue(alerts);
    this.currentIdx = 0;
    if (this.queue.length === 0) {
      console.log('No valid voice notes for alerts (blob URLs expire on reload)');
      return;
    }
    console.log('Starting voice queue:', this.queue.length, 'notes');
    await this._playNext();
  }

  async _playNext() {
    if (!this.isLooping || this.isMuted || this.queue.length === 0) return;
    if (this.currentIdx >= this.queue.length) this.currentIdx = 0;
    const item = this.queue[this.currentIdx++];
    if (!item?.voiceUri) {
      setTimeout(() => this._playNext(), 100);
      return;
    }
    try {
      this.isPlaying = true;
      if (this.onPlaying) this.onPlaying(item.alertId);
      await this._stopCurrent();
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS:   false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.voiceUri },
        { shouldPlay: true, volume: 1.0 }
      );
      this.currentSound = sound;
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.didJustFinish || s.error) {
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
          this.isPlaying    = false;
          if (this.onPlaying) this.onPlaying(null);
          if (this.isLooping && !this.isMuted) {
            setTimeout(() => this._playNext(), 500);
          }
        }
      });
    } catch (e) {
      console.log('Voice error:', e.message);
      this.isPlaying = false;
      if (this.isLooping && !this.isMuted) {
        setTimeout(() => this._playNext(), 500);
      }
    }
  }

  async _stopCurrent() {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (e) {}
      this.currentSound = null;
    }
  }

  async stop() {
    this.isLooping = false;
    this.isPlaying = false;
    this.queue     = [];
    if (this.onPlaying) this.onPlaying(null);
    await this._stopCurrent();
  }

  async mute() {
    this.isMuted = true;
    await this._stopCurrent();
    this.isPlaying = false;
    if (this.onPlaying) this.onPlaying(null);
  }

  async unmute(alerts) {
    this.isMuted    = false;
    this.queue      = this.buildQueue(alerts);
    this.currentIdx = 0;
    if (this.queue.length > 0) await this._playNext();
  }

  removeAlert(alertId) {
    this.queue = this.queue.filter(q => q.alertId !== alertId);
    if (this.queue.length === 0) this.stop();
  }

  addAlert(alert) {
    if (!alert?.driverId) return;
    const voiceUri = this.getVoiceUri(alert.driverId);
    if (!voiceUri) return;
    const exists = this.queue.find(q => q.alertId === (alert._id || alert.id));
    if (exists) return;
    this.queue.push({
      alertId:    alert._id || alert.id,
      driverId:   alert.driverId,
      driverName: alert.driverName || 'Unknown',
      alertType:  alert.alertType  || 'SOS',
      voiceUri,
    });
    if (!this.isPlaying && this.isLooping && !this.isMuted) this._playNext();
  }
}

export const voiceAlertService = new VoiceAlertService();