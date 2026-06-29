/**
 * TSN Universal Audio Recorder
 * Works on iOS Safari, Android, and Web
 */
import { Audio } from 'expo-av';
import { Platform, Alert } from 'react-native';

export class AudioRecorder {
  constructor() {
    this.recording    = null;
    this.isRecording  = false;
    this.mediaRecorder = null; // for web
    this.chunks       = [];
  }

  // Request permissions properly for each platform
  async requestPermission() {
    try {
      if (Platform.OS === 'web') {
        // Web — use browser getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // stop immediately, just checking
        return true;
      }

      // iOS and Android
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access in your phone settings:\n\n' +
          'iOS: Settings → TSN → Microphone → Allow\n' +
          'Android: Settings → Apps → TSN → Permissions → Microphone',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Set audio mode for recording on iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         true,
        playsInSilentModeIOS:       true,
        staysActiveInBackground:    false,
        interruptionModeIOS:        1,
        interruptionModeAndroid:    1,
        shouldDuckAndroid:          true,
        playThroughEarpieceAndroid: false,
      });

      return true;
    } catch (e) {
      console.log('Permission error:', e.message);
      Alert.alert('Permission Error', e.message);
      return false;
    }
  }

  async start() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    try {
      if (Platform.OS === 'web') {
        return await this._startWeb();
      } else {
        return await this._startNative();
      }
    } catch (e) {
      console.log('Start recording error:', e.message);
      Alert.alert('Recording Error', 'Could not start recording: ' + e.message);
      return false;
    }
  }

  async _startNative() {
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync({
      android: {
        extension:             '.m4a',
        outputFormat:          Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder:          Audio.AndroidAudioEncoder.AAC,
        sampleRate:            44100,
        numberOfChannels:      1,
        bitRate:               128000,
      },
      ios: {
        extension:             '.m4a',
        outputFormat:          Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality:          Audio.IOSAudioQuality.HIGH,
        sampleRate:            44100,
        numberOfChannels:      1,
        bitRate:               128000,
        linearPCMBitDepth:     16,
        linearPCMIsBigEndian:  false,
        linearPCMIsFloat:      false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });
    await this.recording.startAsync();
    this.isRecording = true;
    return true;
  }

  async _startWeb() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate:       44100,
      }
    });

    // Try different MIME types for browser compatibility
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/ogg';

    this.chunks       = [];
    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(100); // collect data every 100ms
    this.isRecording = true;
    return true;
  }

  async stop() {
    try {
      if (Platform.OS === 'web') {
        return await this._stopWeb();
      } else {
        return await this._stopNative();
      }
    } catch (e) {
      console.log('Stop recording error:', e.message);
      return null;
    } finally {
      this.isRecording = false;
    }
  }

  async _stopNative() {
    if (!this.recording) return null;
    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;

    // Reset audio mode back to playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:   false,
      playsInSilentModeIOS: true,
    });

    // Convert to base64 for permanent storage
    const base64 = await this._toBase64(uri);
    return base64;
  }

  async _stopWeb() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) { resolve(null); return; }

      this.mediaRecorder.onstop = async () => {
        const blob   = new Blob(this.chunks, { type: this.mediaRecorder.mimeType });
        const base64 = await this._blobToBase64(blob);
        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        this.mediaRecorder = null;
        this.chunks        = [];
        resolve(base64);
      };
      this.mediaRecorder.stop();
    });
  }

  // Convert file URI to base64 (native)
  async _toBase64(uri) {
    try {
      const response = await fetch(uri);
      const blob     = await response.blob();
      return await this._blobToBase64(blob);
    } catch (e) {
      console.log('Base64 conversion error:', e.message);
      return uri; // fallback to URI
    }
  }

  // Convert blob to base64
  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Singleton instance
export const audioRecorder = new AudioRecorder();