import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, TextInput,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../services/AuthContext';

const RED   = '#d32f2f';
const BLUE  = '#1565C0';
const GREEN = '#2e7d32';
const GOLD  = '#f5c518';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── API base URL ──────────────────────────────────────────────────────────────
const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tsn-backend-53yj.onrender.com'
  : 'http://localhost:8000';

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
  const timerRef     = useRef(null);
  const intervalRef  = useRef(null);

  // ── Load messages from backend every time screen opens ──────────────────────
  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const res  = await fetch(BASE_URL + '/api/chat/messages');
      const data = await res.json();
      const msgs = data.messages || [];
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (e) {
      console.log('Chat load error:', e.message);
      setError('Could not load messages. Check connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTips = useCallback(async () => {
    try {
      const res  = await fetch(BASE_URL + '/api/chat/tips');
      const data = await res.json();
      setTips(data.tips || []);
    } catch (e) {}
  }, []);

  // ── On mount — load messages and start auto-refresh ──────────────────────
  useEffect(() => {
    setLoading(true);
    loadMessages();
    loadTips();
    // Refresh every 5 seconds to get new messages from other users
    intervalRef.current = setInterval(loadMessages, 5000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  // ── Send text message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // Show immediately in UI (optimistic)
    const local = {
      id:         'local_' + Date.now(),
      senderId:   myId,
      senderName: myName,
      senderType: role || 'driver',
      message:    text,
      type:       role === 'police' ? 'tip' : 'text',
      timestamp:  new Date().toISOString(),
      likes:      0,
    };
    setMessages(prev => [...prev, local]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Save to backend (MongoDB)
    try {
      const res = await fetch(BASE_URL + '/api/chat/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          senderId:   myId,
          senderName: myName,
          senderType: role || 'driver',
          message:    text,
          type:       role === 'police' ? 'tip' : 'text',
        }),
      });
      const saved = await res.json();
      // Replace local copy with server copy (has real MongoDB ID)
      setMessages(prev => prev.map(m =>
        m.id === local.id
          ? { ...saved, senderName: myName, senderType: role }
          : m
      ));
    } catch (e) {
      console.log('Send error — message kept locally:', e.message);
    }
  };

  // ── Share live location in chat ────────────────────────────────────────────
  const handleShareLocation = async () => {
    if (!location) {
      Alert.alert('Location not available', 'Please enable location access first.');
      return;
    }
    const lat  = location.latitude.toFixed(5);
    const lng  = location.longitude.toFixed(5);
    const url  = 'https://maps.google.com?q=' + lat + ',' + lng;
    const text = '📍 My Live Location\n' + lat + '° N, ' + lng + '° E\n' + url;

    const local = {
      id:         'local_' + Date.now(),
      senderId:   myId,
      senderName: myName,
      senderType: role || 'driver',
      message:    text,
      type:       'location',
      timestamp:  new Date().toISOString(),
      likes:      0,
    };
    setMessages(prev => [...prev, local]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await fetch(BASE_URL + '/api/chat/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          senderId: myId, senderName: myName,
          senderType: role, message: text, type: 'location',
        }),
      });
    } catch (e) {}
  };

  // ── Voice recording — hold to record ───────────────────────────────────────
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Stop recording and send ────────────────────────────────────────────────
  const stopRecording = async () => {
    if (!isRecording || !recordingRef.current) return;
    clearInterval(timerRef.current);
    const secs = recSecs;
    setIsRecording(false);
    setRecSecs(0);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (!uri || secs < 1) return;

      const local = {
        id:         'local_' + Date.now(),
        senderId:   myId,
        senderName: myName,
        senderType: role || 'driver',
        message:    '🎙 Voice note (' + secs + 's)',
        type:       'voice',
        voiceUri:   uri,
        timestamp:  new Date().toISOString(),
        likes:      0,
      };
      setMessages(prev => [...prev, local]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        await fetch(BASE_URL + '/api/chat/messages', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            senderId: myId, senderName: myName, senderType: role,
            message: '🎙 Voice note (' + secs + 's)', type: 'voice', voiceUri: uri,
          }),
        });
      } catch (e) {}
    } catch (e) {
      Alert.alert('Recording Error', e.message);
    }
  };

  // ── Play voice note ────────────────────────────────────────────────────────
  const playVoice = async (msg) => {
    const id = msg.id || msg._id;
    if (playingId === id) {
      await soundRef.current?.stopAsync();
      setPlayingId(null);
      return;
    }
    if (!msg.voiceUri) {
      Alert.alert('Cannot Play', 'Voice note not available on this device.');
      return;
    }
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.voiceUri }, { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(id);
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.didJustFinish) { setPlayingId(null); sound.unloadAsync(); }
      });
    } catch (e) {
      setPlayingId(null);
      Alert.alert('Playback Error', e.message);
    }
  };

  // ── Like a message ─────────────────────────────────────────────────────────
  const handleLike = async (id) => {
    setMessages(prev => prev.map(m =>
      (m.id === id || m._id === id) ? { ...m, likes: (m.likes || 0) + 1 } : m
    ));
    try {
      await fetch(BASE_URL + '/api/chat/messages/' + id + '/like', { method: 'POST' });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(role === 'police' ? 'policeDashboard' : 'driverDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={s.hAvatar}>
          <Text style={{ fontSize: 20 }}>🛡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.hName}>TSN Community Group</Text>
          <Text style={s.hSub}>
            🟢 {messages.length} messages · All drivers & police · Open group
          </Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); loadMessages(); }}>
          <Text style={{ fontSize: 22, color: GREEN, marginLeft: 8 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'chat' && s.tabOn]}
          onPress={() => setTab('chat')}
        >
          <Text style={[s.tabTxt, tab === 'chat' && s.tabTxtOn]}>
            💬 Group Chat ({messages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'tips' && { ...s.tabOn, backgroundColor: BLUE }]}
          onPress={() => setTab('tips')}
        >
          <Text style={[s.tabTxt, tab === 'tips' && s.tabTxtOn]}>🛡 Safety Tips</Text>
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorTxt}>⚠ {error}</Text>
          <TouchableOpacity onPress={loadMessages}>
            <Text style={s.retryTxt}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={{ color: '#666', marginTop: 12 }}>
            Loading messages from server...
          </Text>
        </View>
      ) : tab === 'chat' ? (
        <View style={{ flex: 1 }}>

          {/* Message list */}
          <ScrollView
            ref={scrollRef}
            style={s.list}
            showsVerticalScrollIndicator={false}
          >
            {/* Notice */}
            <View style={s.notice}>
              <Text style={s.noticeTxt}>
                🔒 All messages saved permanently · Visible to all TSN members
              </Text>
            </View>

            {messages.length === 0 && !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#555' }}>
                  No messages yet
                </Text>
                <Text style={{ fontSize: 13, color: '#444', marginTop: 6 }}>
                  Be the first to say something!
                </Text>
              </View>
            ) : (
              messages.map((msg, idx) => {
                const id        = msg.id || msg._id || String(idx);
                const isMe      = msg.senderId === myId;
                const isPolice  = msg.senderType === 'police';
                const isVoice   = msg.type === 'voice';
                const isLoc     = msg.type === 'location';
                const isPlaying = playingId === id;
                const col       = getColor(msg.senderId || '');
                const prev      = messages[idx - 1];
                const next      = messages[idx + 1];

                const showDate = !prev ||
                  new Date(msg.timestamp).toDateString() !==
                  new Date(prev.timestamp).toDateString();

                const showName = !isMe && (!prev || prev.senderId !== msg.senderId);
                const isLast   = !next || next.senderId !== msg.senderId;

                return (
                  <View key={id}>

                    {/* Date separator */}
                    {showDate && (
                      <View style={s.dateSep}>
                        <View style={s.dateLine} />
                        <View style={s.datePill}>
                          <Text style={s.dateTxt}>
                            {new Date(msg.timestamp).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View style={s.dateLine} />
                      </View>
                    )}

                    {/* Message row */}
                    <View style={[s.row, isMe && s.rowMe]}>

                      {/* Avatar left (others) */}
                      {!isMe && (
                        <View style={s.aCol}>
                          {isLast ? (
                            <View style={[s.av, { backgroundColor: isPolice ? BLUE : col }]}>
                              <Text style={s.avTxt}>
                                {isPolice ? '🏛' : getInitials(msg.senderName)}
                              </Text>
                            </View>
                          ) : (
                            <View style={{ width: 34 }} />
                          )}
                        </View>
                      )}

                      {/* Message block */}
                      <View style={[s.block, isMe && { alignItems: 'flex-end' }]}>

                        {/* Sender name */}
                        {showName && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3, marginLeft: 4 }}>
                            <Text style={[s.name, { color: isPolice ? '#90caf9' : col }]}>
                              {isPolice ? '🏛 ' : '🚖 '}{msg.senderName || 'Unknown User'}
                            </Text>
                            <Text style={s.nameId}>
                              {isPolice ? ' · Police Officer' : ' · ' + msg.senderId}
                            </Text>
                          </View>
                        )}

                        {/* Bubble */}
                        <View style={[
                          s.bubble,
                          isMe ? s.bMe : isPolice ? s.bPolice : s.bOther,
                        ]}>
                          {/* Police tip badge */}
                          {msg.type === 'tip' && (
                            <View style={s.polBadge}>
                              <Text style={s.polBadgeTxt}>🛡 OFFICIAL TIP</Text>
                            </View>
                          )}

                          {/* Voice message */}
                          {isVoice ? (
                            <TouchableOpacity
                              style={s.voiceRow}
                              onPress={() => playVoice(msg)}
                            >
                              <View style={[s.playBtn, isPlaying && { backgroundColor: GOLD }]}>
                                <Text style={{ fontSize: 16, color: '#fff' }}>
                                  {isPlaying ? '⏸' : '▶'}
                                </Text>
                              </View>
                              <View style={s.wave}>
                                {[3,7,11,8,13,9,6,12,8,5,10,7,4,9,11,6,8,10,5,7].map((h, i) => (
                                  <View key={i} style={[s.bar, {
                                    height: h,
                                    backgroundColor: isPlaying
                                      ? GOLD
                                      : isMe
                                      ? 'rgba(255,255,255,0.6)'
                                      : 'rgba(255,255,255,0.4)',
                                  }]} />
                                ))}
                              </View>
                              <Text style={{ fontSize: 10, color: '#aaa', minWidth: 55 }}>
                                {isPlaying ? 'Playing...' : (msg.message || '🎙')}
                              </Text>
                            </TouchableOpacity>

                          /* Location message */
                          ) : isLoc ? (
                            <View>
                              <Text style={{ fontSize: 13, color: '#90caf9', lineHeight: 20, marginBottom: 8 }}>
                                {msg.message.split('\n').slice(0, 2).join('\n')}
                              </Text>
                              <TouchableOpacity
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 8 }}
                                onPress={() => {
                                  const url = msg.message.split('\n').find(l => l.startsWith('http'));
                                  if (url) Linking.openURL(url);
                                }}
                              >
                                <Text style={{ fontSize: 12, color: GOLD, fontWeight: '700' }}>
                                  🗺 Open in Google Maps →
                                </Text>
                              </TouchableOpacity>
                            </View>

                          /* Text message */
                          ) : (
                            <Text style={s.msgTxt}>{msg.message}</Text>
                          )}

                          {/* Footer */}
                          <View style={s.footer}>
                            <Text style={s.time}>{formatTime(msg.timestamp)}</Text>
                            {isMe && <Text style={{ fontSize: 11, color: '#4caf50' }}>✓✓</Text>}
                            <TouchableOpacity onPress={() => handleLike(id)}>
                              {(msg.likes || 0) > 0 && (
                                <Text style={{ fontSize: 11, color: '#666' }}>
                                  👍 {msg.likes}
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Avatar right (me) */}
                      {isMe && (
                        <View style={s.aCol}>
                          {isLast ? (
                            <View style={[s.av, { backgroundColor: role === 'police' ? BLUE : RED }]}>
                              <Text style={s.avTxt}>
                                {role === 'police' ? '🏛' : getInitials(myName)}
                              </Text>
                            </View>
                          ) : (
                            <View style={{ width: 34 }} />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 12 }} />
          </ScrollView>

          {/* Recording indicator */}
          {isRecording && (
            <View style={s.recBar}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RED }} />
              <Text style={{ fontSize: 13, color: RED, fontWeight: '700' }}>
                🔴 Recording... {recSecs}s — Release 🎙 to send
              </Text>
            </View>
          )}

          {/* Police banner */}
          {role === 'police' && !isRecording && (
            <View style={{ backgroundColor: '#0d1b4a', paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#90caf9', fontWeight: '600' }}>
                🏛 Posting as Police Officer — marked as official
              </Text>
            </View>
          )}

          {/* Input bar */}
          <View style={s.inputBar}>
            <View style={s.inputRow}>
              {/* Location */}
              <TouchableOpacity style={s.iconBtn} onPress={handleShareLocation}>
                <Text style={{ fontSize: 20 }}>📍</Text>
              </TouchableOpacity>

              {/* Text input */}
              <TextInput
                style={s.input}
                placeholder="Message TSN Community..."
                placeholderTextColor="#555"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />

              {/* Voice — hold to record */}
              <TouchableOpacity
                style={[s.iconBtn, isRecording && { backgroundColor: RED }]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>🎙</Text>
              </TouchableOpacity>

              {/* Send */}
              {input.trim() !== '' && (
                <TouchableOpacity
                  style={[s.sendBtn, role === 'police' && { backgroundColor: BLUE }]}
                  onPress={handleSend}
                >
                  <Text style={{ fontSize: 18, color: '#fff' }}>➤</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 9, color: '#444', textAlign: 'center', marginTop: 5 }}>
              Tap 📍 location · Hold 🎙 voice · Type + ➤ text
            </Text>
          </View>
        </View>

      ) : (
        /* Safety Tips tab */
        <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 14 }}>
          <View style={{ backgroundColor: BLUE, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>
              🏛 Official Police Safety Guidelines
            </Text>
            <Text style={{ fontSize: 11, color: '#90caf9', marginTop: 4 }}>
              Defensive advice from TSN Command · Cameroon
            </Text>
          </View>
          {tips.map(tip => (
            <View key={tip.id} style={s.tipCard}>
              <View style={s.tipIco}>
                <Text style={{ fontSize: 22 }}>{tip.ico}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#90caf9', marginBottom: 4 }}>
                  {tip.category}
                </Text>
                <Text style={{ fontSize: 12, color: '#bbb', lineHeight: 18 }}>
                  {tip.tip}
                </Text>
              </View>
            </View>
          ))}
          {role === 'police' && (
            <TouchableOpacity
              style={{ backgroundColor: BLUE, borderRadius: 12, padding: 14, alignItems: 'center', margin: 10 }}
              onPress={() => setTab('chat')}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
                + Post Safety Tip in Chat
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={s.nav}>
        {(role === 'driver' ? [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'emergency'       },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
        ] : [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'policeDashboard' },
          { ico: '🗺',  lbl: 'LIVE MAP', to: 'liveMap'         },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
        ]).map(({ ico, lbl, to }) => (
          <TouchableOpacity
            key={lbl}
            style={lbl === 'CHAT' ? s.navActive : s.navItem}
            onPress={() => nav(to)}
          >
            <Text style={lbl === 'CHAT' ? s.navIcoA : s.navIco}>{ico}</Text>
            <Text style={lbl === 'CHAT' ? s.navTxtA : s.navTxt}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0a0a0a' },
  header:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1c1c1c' },
  back:       { fontSize: 22, color: RED, fontWeight: '600', marginRight: 10 },
  hAvatar:    { width: 42, height: 42, borderRadius: 21, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  hName:      { fontSize: 15, fontWeight: '800', color: '#fff' },
  hSub:       { fontSize: 10, color: '#888', marginTop: 2 },
  tabs:       { flexDirection: 'row', backgroundColor: '#111', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  tab:        { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  tabOn:      { backgroundColor: RED },
  tabTxt:     { fontSize: 12, fontWeight: '700', color: '#666' },
  tabTxtOn:   { color: '#fff' },
  errorBanner:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2d0000', padding: 10, paddingHorizontal: 16 },
  errorTxt:   { fontSize: 12, color: '#ff8a80', flex: 1 },
  retryTxt:   { fontSize: 12, color: GOLD, fontWeight: '700', marginLeft: 10 },
  loadBox:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:       { flex: 1, paddingHorizontal: 6 },
  notice:     { backgroundColor: '#1a1a1a', margin: 10, borderRadius: 10, padding: 10 },
  noticeTxt:  { fontSize: 11, color: '#666', textAlign: 'center', lineHeight: 16 },
  dateSep:    { flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 10 },
  dateLine:   { flex: 1, height: 1, backgroundColor: '#1c1c1c' },
  datePill:   { backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10 },
  dateTxt:    { fontSize: 11, color: '#666' },
  row:        { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-end', paddingHorizontal: 4 },
  rowMe:      { justifyContent: 'flex-end' },
  aCol:       { width: 40, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 },
  av:         { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avTxt:      { fontSize: 13, color: '#fff', fontWeight: '800' },
  block:      { maxWidth: '72%' },
  name:       { fontSize: 12, fontWeight: '700' },
  nameId:     { fontSize: 10, color: '#555', marginLeft: 2 },
  bubble:     { borderRadius: 18, padding: 10, maxWidth: '100%' },
  bMe:        { backgroundColor: '#1a3d1a', borderBottomRightRadius: 4 },
  bPolice:    { backgroundColor: '#0d1b4a', borderBottomLeftRadius: 4 },
  bOther:     { backgroundColor: '#1e1e1e', borderBottomLeftRadius: 4 },
  polBadge:   { backgroundColor: 'rgba(144,202,249,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6, alignSelf: 'flex-start' },
  polBadgeTxt:{ fontSize: 10, fontWeight: '800', color: '#90caf9' },
  msgTxt:     { fontSize: 14, color: '#f0f0f0', lineHeight: 20 },
  voiceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 200 },
  playBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  wave:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  bar:        { width: 3, borderRadius: 2 },
  footer:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, justifyContent: 'flex-end' },
  time:       { fontSize: 10, color: '#555' },
  recBar:     { backgroundColor: '#1a0000', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputBar:   { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1c1c1c', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  iconBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center' },
  input:      { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 120, borderWidth: 1, borderColor: '#2a2a2a' },
  sendBtn:    { width: 42, height: 42, borderRadius: 21, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  tipCard:    { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: BLUE, gap: 12 },
  tipIco:     { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0d1b4a', alignItems: 'center', justifyContent: 'center' },
  nav:        { flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1c1c1c', paddingVertical: 10 },
  navActive:  { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:    { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:    { fontSize: 18, color: '#fff' },
  navTxtA:    { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:     { fontSize: 18, color: '#555' },
  navTxt:     { fontSize: 9, color: '#555', marginTop: 2 },
});