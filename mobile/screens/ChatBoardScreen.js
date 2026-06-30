import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, TextInput,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAuth } from '../services/AuthContext';
import { audioRecorder } from '../services/AudioRecorder';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

const COLORS = [RED, BLUE, GREEN, '#8B4513', '#6a1b9a', '#e65100', '#1a5276'];
const getColor = (id) => {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) h = (id.charCodeAt(i) + ((h << 5) - h));
  return COLORS[Math.abs(h) % COLORS.length];
};
const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
};
const formatTime = (ts) => {
  if (!ts) return '';
  const d    = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString();
};

export default function ChatBoardScreen({ nav, location }) {
  const { user, role } = useAuth();
  const myId   = user?.badgeId || user?.stationId || 'me';
  const myName = user?.fullName || user?.stationName || 'Me';

  const [messages,    setMessages]    = useState([]);
  const [tips,        setTips]        = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [recSecs,     setRecSecs]     = useState(0);
  const [playingId,   setPlayingId]   = useState(null);
  const [error,       setError]       = useState(null);

  const scrollRef    = useRef(null);
  const recordingRef = useRef(null);
  const soundRef     = useRef(null);
  const webAudioRef  = useRef(null);
  const timerRef     = useRef(null);
  const intervalRef  = useRef(null);
  const voiceStore   = useRef({});

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(loadMessages, 8000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  const loadAll = async () => {
    await Promise.all([loadMessages(), loadTips()]);
    setLoading(false);
  };

  const loadMessages = async () => {
    try {
      setError(null);
      const res  = await fetch(BASE_URL + '/api/chat/messages');
      const data = await res.json();
      const msgs = (data.messages || []).map(msg => {
        // Restore voiceUri from local store if server doesn't have it
        const id = msg.id || msg._id;
        const storedUri = voiceStore.current[id];
        if (msg.type === 'voice' && storedUri && !msg.voiceUri) {
          return { ...msg, voiceUri: storedUri };
        }
        // Also store server voiceUri in local store for future use
        if (msg.type === 'voice' && msg.voiceUri && !msg.voiceUri.startsWith('blob:')) {
          voiceStore.current[id] = msg.voiceUri;
        }
        return msg;
      });
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (e) { setError('Could not load messages. Check connection.'); }
  };

  const loadTips = async () => {
    try {
      const res  = await fetch(BASE_URL + '/api/chat/tips');
      const data = await res.json();
      setTips(data.tips || []);
    } catch (e) {}
  };

  const blobToBase64 = async (uri) => {
    try {
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        const response = await fetch(uri);
        const blob     = await response.blob();
        return new Promise((resolve, reject) => {
          const reader   = new FileReader();
          reader.onload  = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      return uri;
    } catch (e) { return uri; }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const local = { id: 'local_' + Date.now(), senderId: myId, senderName: myName, senderType: role || 'driver', message: text, type: role === 'police' ? 'tip' : 'text', timestamp: new Date().toISOString(), likes: 0 };
    setMessages(prev => [...prev, local]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res  = await fetch(BASE_URL + '/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: myId, senderName: myName, senderType: role || 'driver', message: text, type: role === 'police' ? 'tip' : 'text' }) });
      const saved = await res.json();
      setMessages(prev => prev.map(m => m.id === local.id ? { ...saved, senderName: myName, senderType: role } : m));
    } catch (e) {}
  };

  const handleShareLocation = async () => {
    if (!location) { Alert.alert('Location not available', 'Please enable location access first.'); return; }
    const lat  = location.latitude.toFixed(5);
    const lng  = location.longitude.toFixed(5);
    const url  = 'https://maps.google.com?q=' + lat + ',' + lng;
    const text = 'My Live Location\n' + lat + '° N, ' + lng + '° E\n' + url;
    const local = { id: 'local_' + Date.now(), senderId: myId, senderName: myName, senderType: role || 'driver', message: text, type: 'location', timestamp: new Date().toISOString(), likes: 0 };
    setMessages(prev => [...prev, local]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try { await fetch(BASE_URL + '/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: myId, senderName: myName, senderType: role, message: text, type: 'location' }) }); } catch (e) {}
  };

  const startRecording = async () => {
    const started = await audioRecorder.start();
    if (started) {
      setIsRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    const secs = recSecs;
    setIsRecording(false);
    setRecSecs(0);

    const base64Uri = await audioRecorder.stop();
    if (!base64Uri || secs < 1) return;

    const msgId = 'local_' + Date.now();
    voiceStore.current[msgId] = base64Uri;

    const local = {
      id: msgId, senderId: myId, senderName: myName,
      senderType: role || 'driver',
      message: 'Voice note (' + secs + 's)',
      type: 'voice', voiceUri: base64Uri,
      timestamp: new Date().toISOString(), likes: 0,
    };
    setMessages(prev => [...prev, local]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res   = await fetch(BASE_URL + '/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: myId, senderName: myName, senderType: role,
          message: 'Voice note (' + secs + 's)',
          type: 'voice', voiceUri: base64Uri,
        }),
      });
      const saved = await res.json();
      voiceStore.current[saved.id || saved._id] = base64Uri;
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...saved, senderName: myName, senderType: role, voiceUri: base64Uri } : m
      ));
    } catch (e) {
      console.log('Voice send error:', e.message);
    }
  };

  const playVoice = async (msg) => {
    const id  = msg.id || msg._id;
    const uri = voiceStore.current[id] || msg.voiceUri;

    // Stop if already playing this one
    if (playingId === id) {
      if (Platform.OS === 'web' && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current = null;
      } else {
        try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch(e){}
        soundRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    if (!uri) { Alert.alert('No Voice', 'Voice note not available.'); return; }
    if (uri.startsWith('blob:')) { Alert.alert('Expired', 'This voice note expired. New ones are permanent.'); return; }

    // Stop any current playback first
    if (Platform.OS === 'web' && webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current = null;
    }
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch(e){}
    soundRef.current = null;

    // ── WEB: use native browser Audio element — more reliable codec support ──
    if (Platform.OS === 'web') {
      try {
        const audioEl = new window.Audio(uri);
        webAudioRef.current = audioEl;
        setPlayingId(id);
        audioEl.onended = () => { webAudioRef.current = null; setPlayingId(null); };
        audioEl.onerror = (e) => {
          console.log('Web audio error:', audioEl.error);
          webAudioRef.current = null;
          setPlayingId(null);
          Alert.alert('Playback Error', 'Could not play this voice note. Code: ' + (audioEl.error?.code || 'unknown'));
        };
        await audioEl.play();
      } catch (e) {
        setPlayingId(null);
        console.log('Web audio play error:', e.message);
        Alert.alert('Cannot Play', e.message);
      }
      return;
    }

    // ── NATIVE (iOS/Android): use expo-av ──
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS:       true,
        allowsRecordingIOS:         false,
        staysActiveInBackground:    false,
        interruptionModeIOS:        1,
        interruptionModeAndroid:    1,
        shouldDuckAndroid:          true,
        playThroughEarpieceAndroid: false,
      });

      setPlayingId(id);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0, isMuted: false, isLooping: false }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish || status.error) {
          try { sound.unloadAsync(); } catch(e){}
          soundRef.current = null;
          setPlayingId(null);
        }
      });

    } catch (e) {
      soundRef.current = null;
      setPlayingId(null);
      console.log('Voice play error:', e.message);
      // Show which URI failed for debugging
      Alert.alert(
        'Playback Failed',
        'Error: ' + e.message + '\n\nMake sure:\n• Volume is turned up\n• Not on silent mode (iPhone)\n• Try removing headphones'
      );
    }
  };

  const handleLike = async (id) => {
    setMessages(prev => prev.map(m => (m.id===id||m._id===id) ? {...m, likes:(m.likes||0)+1} : m));
    try { await fetch(BASE_URL + '/api/chat/messages/' + id + '/like', { method: 'POST' }); } catch (e) {}
  };

  const handleDeleteMessage = (msg) => {
    const id = msg.id || msg._id;
    if (msg.senderId !== myId) {
      Alert.alert('Cannot Delete', 'You can only delete your own messages.');
      return;
    }
    Alert.alert(
      'Delete Message',
      'Delete this message for everyone? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for Everyone',
          style: 'destructive',
          onPress: async () => {
            // Remove locally immediately
            setMessages(prev => prev.filter(m => (m.id || m._id) !== id));
            voiceStore.current[id] && delete voiceStore.current[id];
            try {
              await fetch(BASE_URL + '/api/chat/messages/' + id, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: myId }),
              });
            } catch (e) {
              console.log('Delete error:', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(role === 'police' ? 'policeDashboard' : 'driverDashboard')}>
          <MaterialIcons name="arrow-back" size={24} color={RED} />
        </TouchableOpacity>
        <View style={s.hAvatar}><Ionicons name="shield-checkmark" size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.hName}>TSN Community Group</Text>
          <Text style={s.hSub}>{messages.length} messages · All drivers & police</Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); loadMessages(); }}>
          <MaterialIcons name="refresh" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'chat' && s.tabOn]} onPress={() => setTab('chat')}>
          <MaterialIcons name="chat" size={16} color={tab === 'chat' ? '#fff' : '#666'} />
          <Text style={[s.tabTxt, tab === 'chat' && s.tabTxtOn]}>Group Chat ({messages.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'tips' && { ...s.tabOn, backgroundColor: BLUE }]} onPress={() => setTab('tips')}>
          <MaterialIcons name="security" size={16} color={tab === 'tips' ? '#fff' : '#666'} />
          <Text style={[s.tabTxt, tab === 'tips' && s.tabTxtOn]}>Safety Tips</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={s.errBanner}>
          <MaterialIcons name="wifi-off" size={16} color="#ff8a80" />
          <Text style={s.errTxt}>{error}</Text>
          <TouchableOpacity onPress={loadMessages}>
            <Text style={s.retryTxt}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={{ color: '#666', marginTop: 12 }}>Loading messages...</Text>
        </View>
      ) : tab === 'chat' ? (
        <View style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} style={s.list} showsVerticalScrollIndicator={false}>
            <View style={s.notice}>
              <MaterialIcons name="lock" size={12} color="#666" />
              <Text style={s.noticeTxt}>Messages saved permanently · Hold mic to record voice · Tap pin to share location</Text>
            </View>

            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <MaterialIcons name="chat-bubble-outline" size={52} color="#555" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#555', marginTop: 12 }}>No messages yet</Text>
              </View>
            ) : messages.map((msg, idx) => {
              const id        = msg.id || msg._id || String(idx);
              const isMe      = msg.senderId === myId;
              const isPolice  = msg.senderType === 'police';
              const isVoice   = msg.type === 'voice';
              const isLoc     = msg.type === 'location';
              const isPlaying = playingId === id;
              const col       = getColor(msg.senderId || '');
              const prev      = messages[idx - 1];
              const next      = messages[idx + 1];
              const showDate  = !prev || new Date(msg.timestamp).toDateString() !== new Date(prev.timestamp).toDateString();
              const showName  = !isMe && (!prev || prev.senderId !== msg.senderId);
              const isLast    = !next || next.senderId !== msg.senderId;
              const voiceUri  = voiceStore.current[id] || msg.voiceUri;
              const canPlay   = !!voiceUri && !voiceUri.startsWith('blob:');

              return (
                <View key={id}>
                  {showDate && (
                    <View style={s.dateSep}>
                      <View style={s.dateLine} />
                      <View style={s.datePill}>
                        <Text style={s.dateTxt}>{new Date(msg.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      </View>
                      <View style={s.dateLine} />
                    </View>
                  )}
                  <View style={[s.row, isMe && s.rowMe]}>
                    {!isMe && (
                      <View style={s.aCol}>
                        {isLast
                          ? <View style={[s.av, { backgroundColor: isPolice ? BLUE : col }]}>
                              <Text style={s.avTxt}>{isPolice ? 'P' : getInitials(msg.senderName)}</Text>
                            </View>
                          : <View style={{ width: 34 }} />
                        }
                      </View>
                    )}
                    <View style={[s.block, isMe && { alignItems: 'flex-end' }]}>
                      {showName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3, marginLeft: 4, gap: 4 }}>
                          <MaterialIcons name={isPolice ? 'local-police' : 'directions-car'} size={12} color={isPolice ? '#90caf9' : col} />
                          <Text style={[s.name, { color: isPolice ? '#90caf9' : col }]}>{msg.senderName || 'Unknown'}</Text>
                          <Text style={s.nameId}>{isPolice ? '· Police' : '· ' + msg.senderId}</Text>
                        </View>
                      )}
                      <View style={[s.bubble, isMe ? s.bMe : isPolice ? s.bPolice : s.bOther]}>
                        {isMe && (
                          <TouchableOpacity
                            style={s.deleteBtn}
                            onPress={() => handleDeleteMessage(msg)}
                          >
                            <MaterialIcons name="delete-outline" size={14} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                        )}
                        {msg.type === 'tip' && (
                          <View style={s.polBadge}>
                            <MaterialIcons name="verified" size={12} color="#90caf9" />
                            <Text style={s.polBadgeTxt}>OFFICIAL TIP</Text>
                          </View>
                        )}
                        {isVoice ? (
                          <TouchableOpacity style={s.voiceRow} onPress={() => playVoice({ ...msg, voiceUri })}>
                            <View style={[s.playBtn, isPlaying && { backgroundColor: GOLD }, !canPlay && { backgroundColor: '#444' }]}>
                              <MaterialIcons name={!canPlay ? 'mic-off' : isPlaying ? 'pause' : 'play-arrow'} size={18} color="#fff" />
                            </View>
                            <View style={s.wave}>
                              {[3,7,11,8,13,9,6,12,8,5,10,7,4,9,11,6,8,10,5,7].map((h, i) => (
                                <View key={i} style={[s.bar, { height: h, backgroundColor: !canPlay ? '#444' : isPlaying ? GOLD : isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)' }]} />
                              ))}
                            </View>
                            <Text style={{ fontSize: 10, color: canPlay ? '#aaa' : '#555', minWidth: 70 }}>
                              {!canPlay ? 'Expired' : isPlaying ? 'Playing...' : msg.message.replace('Voice note', '').trim()}
                            </Text>
                          </TouchableOpacity>
                        ) : isLoc ? (
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                              <MaterialIcons name="location-on" size={16} color="#90caf9" />
                              <Text style={{ fontSize: 13, color: '#90caf9', flex: 1 }}>
                                {msg.message.split('\n').slice(0, 2).join('\n')}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                              onPress={() => { const url = msg.message.split('\n').find(l => l.startsWith('http')); if (url) Linking.openURL(url); }}
                            >
                              <MaterialIcons name="open-in-new" size={14} color={GOLD} />
                              <Text style={{ fontSize: 12, color: GOLD, fontWeight: '700' }}>Open in Google Maps</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={s.msgTxt}>{msg.message}</Text>
                        )}
                        <View style={s.footer}>
                          <Text style={s.time}>{formatTime(msg.timestamp)}</Text>
                          {isMe && <MaterialIcons name="done-all" size={14} color="#4caf50" />}
                          {(msg.likes || 0) > 0 && (
                            <TouchableOpacity onPress={() => handleLike(id)}>
                              <Text style={{ fontSize: 11, color: '#666' }}>👍 {msg.likes}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                    {isMe && (
                      <View style={s.aCol}>
                        {isLast
                          ? <View style={[s.av, { backgroundColor: role === 'police' ? BLUE : RED }]}>
                              <Text style={s.avTxt}>{role === 'police' ? 'P' : getInitials(myName)}</Text>
                            </View>
                          : <View style={{ width: 34 }} />
                        }
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 12 }} />
          </ScrollView>

          {isRecording && (
            <View style={s.recBar}>
              <MaterialIcons name="fiber-manual-record" size={14} color={RED} />
              <Text style={{ fontSize: 13, color: RED, fontWeight: '700' }}>Recording... {recSecs}s — Release mic to send</Text>
            </View>
          )}

          {role === 'police' && !isRecording && (
            <View style={{ backgroundColor: '#0d1b4a', paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <MaterialIcons name="local-police" size={14} color="#90caf9" />
              <Text style={{ fontSize: 10, color: '#90caf9', fontWeight: '600' }}>Posting as Police Officer — marked as official</Text>
            </View>
          )}

          <View style={s.inputBar}>
            <View style={s.inputRow}>
              <TouchableOpacity style={s.iconBtn} onPress={handleShareLocation}>
                <MaterialIcons name="location-on" size={22} color={BLUE} />
              </TouchableOpacity>
              <TextInput
                style={s.input}
                placeholder="Message TSN Community..."
                placeholderTextColor="#555"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.iconBtn, isRecording && { backgroundColor: RED }]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.8}
              >
                <MaterialIcons name="mic" size={22} color={isRecording ? '#fff' : '#aaa'} />
              </TouchableOpacity>
              {input.trim() !== '' && (
                <TouchableOpacity
                  style={[s.sendBtn, role === 'police' && { backgroundColor: BLUE }]}
                  onPress={handleSend}
                >
                  <MaterialIcons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 9, color: '#444', textAlign: 'center', marginTop: 5 }}>
              Tap pin for location · Hold mic to record voice · Tap send for text
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 14 }}>
          <View style={{ backgroundColor: BLUE, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name="security" size={24} color="#fff" />
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Official Police Safety Guidelines</Text>
              <Text style={{ fontSize: 11, color: '#90caf9', marginTop: 2 }}>TSN Command · Cameroon</Text>
            </View>
          </View>
          {tips.map(tip => (
            <View key={tip.id} style={s.tipCard}>
              <View style={s.tipIco}><Text style={{ fontSize: 22 }}>{tip.ico}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#90caf9', marginBottom: 4 }}>{tip.category}</Text>
                <Text style={{ fontSize: 12, color: '#bbb', lineHeight: 18 }}>{tip.tip}</Text>
              </View>
            </View>
          ))}
          {role === 'police' && (
            <TouchableOpacity style={{ backgroundColor: BLUE, borderRadius: 12, padding: 14, alignItems: 'center', margin: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => setTab('chat')}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Post Safety Tip in Chat</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <View style={s.nav}>
        {(role === 'driver' ? [
          { icon: 'dashboard',  lbl: 'DASHBOARD', to: 'driverDashboard' },
          { icon: 'warning',    lbl: 'ALERTS',    to: 'emergency'       },
          { icon: 'chat',       lbl: 'CHAT',       to: 'chatBoard'       },
          { icon: 'person',     lbl: 'PROFILE',    to: 'profileSetup'    },
        ] : [
          { icon: 'dashboard',  lbl: 'DASHBOARD', to: 'policeDashboard' },
          { icon: 'map',        lbl: 'LIVE MAP',  to: 'liveMap'         },
          { icon: 'chat',       lbl: 'CHAT',       to: 'chatBoard'       },
          { icon: 'person',     lbl: 'PROFILE',    to: 'profileSetup'    },
        ]).map(({ icon, lbl, to }) => (
          <TouchableOpacity key={lbl} style={lbl === 'CHAT' ? s.navActive : s.navItem} onPress={() => nav(to)}>
            <MaterialIcons name={icon} size={22} color={lbl === 'CHAT' ? '#fff' : '#555'} />
            <Text style={lbl === 'CHAT' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#0a0a0a' },
  header:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1c1c1c' },
  hAvatar:   { width: 42, height: 42, borderRadius: 21, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  hName:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  hSub:      { fontSize: 10, color: '#888', marginTop: 2 },
  tabs:      { flexDirection: 'row', backgroundColor: '#111', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  tab:       { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabOn:     { backgroundColor: RED },
  tabTxt:    { fontSize: 12, fontWeight: '700', color: '#666' },
  tabTxtOn:  { color: '#fff' },
  errBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d0000', padding: 10, paddingHorizontal: 16, gap: 8 },
  errTxt:    { fontSize: 12, color: '#ff8a80', flex: 1 },
  retryTxt:  { fontSize: 12, color: GOLD, fontWeight: '700' },
  loadBox:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { flex: 1, paddingHorizontal: 6 },
  notice:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a1a', margin: 10, borderRadius: 10, padding: 10 },
  noticeTxt: { fontSize: 11, color: '#666', flex: 1 },
  dateSep:   { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 10 },
  dateLine:  { flex: 1, height: 1, backgroundColor: '#1c1c1c' },
  datePill:  { backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10 },
  dateTxt:   { fontSize: 11, color: '#666' },
  row:       { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-end', paddingHorizontal: 4 },
  rowMe:     { justifyContent: 'flex-end' },
  aCol:      { width: 40, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 },
  av:        { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avTxt:     { fontSize: 13, color: '#fff', fontWeight: '800' },
  block:     { maxWidth: '72%' },
  name:      { fontSize: 12, fontWeight: '700' },
  nameId:    { fontSize: 10, color: '#555', marginLeft: 2 },
  bubble:    { borderRadius: 18, padding: 10, maxWidth: '100%' },
  bMe:       { backgroundColor: '#1a3d1a', borderBottomRightRadius: 4 },
  bPolice:   { backgroundColor: '#0d1b4a', borderBottomLeftRadius: 4 },
  bOther:    { backgroundColor: '#1e1e1e', borderBottomLeftRadius: 4 },
  deleteBtn: { position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 3 },
  polBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(144,202,249,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6, alignSelf: 'flex-start' },
  polBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#90caf9' },
  msgTxt:    { fontSize: 14, color: '#f0f0f0', lineHeight: 20 },
  voiceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 200 },
  playBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  wave:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  bar:       { width: 3, borderRadius: 2 },
  footer:    { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, justifyContent: 'flex-end' },
  time:      { fontSize: 10, color: '#555' },
  recBar:    { backgroundColor: '#1a0000', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputBar:  { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1c1c1c', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  inputRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  iconBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  input:     { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 120, borderWidth: 1, borderColor: '#2a2a2a' },
  sendBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  tipCard:   { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: BLUE, gap: 12 },
  tipIco:    { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0d1b4a', alignItems: 'center', justifyContent: 'center' },
  nav:       { flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1c1c1c', paddingVertical: 10 },
  navActive: { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:   { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navTxtA:   { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navTxt:    { fontSize: 9, color: '#555', marginTop: 2 },
});