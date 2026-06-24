import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getChatMessages, sendChatMessage, likeChatMessage, getSafetyTips } from '../services/api';
import { useAuth } from '../services/AuthContext';

const RED  = '#d32f2f';
const BLUE = '#1565C0';
const GREEN = '#2e7d32';
const GOLD = '#f5c518';

export default function ChatBoardScreen({ nav }) {
  const { user, role } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [tips,      setTips]      = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [tab,       setTab]       = useState('chat'); // chat | tips
  const scrollRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([loadMessages(), loadTips()]);
    setLoading(false);
  };

  const loadMessages = async () => {
    try {
      const data = await getChatMessages();
      setMessages(data.messages || []);
    } catch (e) { console.log('Chat error:', e.message); }
  };

  const loadTips = async () => {
    try {
      const data = await getSafetyTips();
      setTips(data.tips || []);
    } catch (e) { console.log('Tips error:', e.message); }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert('Empty Message', 'Please type a message before sending.');
      return;
    }
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to send messages.');
      return;
    }
    setSending(true);
    try {
      const msg = {
        senderId:   user?.badgeId || user?.stationId || 'unknown',
        senderName: user?.fullName || user?.stationName || 'TSN User',
        senderType: role || 'driver',
        message:    trimmed,
        type:       role === 'police' ? 'tip' : 'text',
      };
      console.log('Sending chat message:', msg);
      const newMsg = await sendChatMessage(msg);
      console.log('Message sent:', newMsg);
      setMessages(prev => [...prev, newMsg]);
      setInput('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.log('Chat send error:', e.message);
      // Add message locally even if backend fails
      const localMsg = {
        id: Date.now().toString(),
        senderId:   user?.badgeId || user?.stationId || 'unknown',
        senderName: user?.fullName || user?.stationName || 'TSN User',
        senderType: role || 'driver',
        message:    trimmed,
        type:       role === 'police' ? 'tip' : 'text',
        timestamp:  new Date().toISOString(),
        likes: 0,
        local: true,
      };
      setMessages(prev => [...prev, localMsg]);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (id) => {
    try {
      await likeChatMessage(id);
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m
      ));
    } catch (e) {}
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return d.toLocaleDateString();
  };

  const getBubbleColor = (msg) => {
    if (msg.senderType === 'police') return '#1a237e';
    if (msg.senderId === (user?.badgeId || user?.stationId)) return RED;
    return '#333';
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav(role === 'police' ? 'policeDashboard' : 'driverDashboard')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>💬 Community Board</Text>
          <Text style={s.headerSub}>TSN Driver & Police Network</Text>
        </View>
        <View style={s.liveDot} />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'chat' && s.tabBtnActive]}
          onPress={() => setTab('chat')}
        >
          <Text style={[s.tabBtnTxt, tab === 'chat' && s.tabBtnTxtActive]}>
            💬 Live Chat ({messages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'tips' && { ...s.tabBtnActive, backgroundColor: BLUE }]}
          onPress={() => setTab('tips')}
        >
          <Text style={[s.tabBtnTxt, tab === 'tips' && s.tabBtnTxtActive]}>
            🛡 Safety Tips ({tips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={s.loadingTxt}>Loading community board...</Text>
        </View>
      ) : tab === 'chat' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Pinned notice */}
            <View style={s.pinnedBanner}>
              <Text style={s.pinnedIco}>📌</Text>
              <Text style={s.pinnedTxt}>
                This is a community board for drivers and police to share incidents and safety advice.
                Police officers are identified with 🏛. Be respectful.
              </Text>
            </View>

            {messages.map((msg) => {
              const isMe = msg.senderId === (user?.badgeId || user?.stationId);
              const isPolice = msg.senderType === 'police';
              return (
                <View key={msg.id} style={[s.msgRow, isMe && s.msgRowMe]}>
                  {/* Avatar */}
                  {!isMe && (
                    <View style={[s.avatar, { backgroundColor: isPolice ? BLUE : '#555' }]}>
                      <Text style={s.avatarTxt}>{isPolice ? '🏛' : '🚖'}</Text>
                    </View>
                  )}

                  <View style={[s.bubble, {
                    backgroundColor: isMe ? RED : isPolice ? '#1a237e' : '#2c2c2c',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    marginLeft: isMe ? 40 : 0,
                    marginRight: isMe ? 0 : 40,
                  }]}>
                    {/* Sender name */}
                    {!isMe && (
                      <Text style={[s.senderName, { color: isPolice ? '#90caf9' : '#aaa' }]}>
                        {isPolice ? '🏛 ' : '🚖 '}{msg.senderName}
                        {isPolice ? ' · Officer' : ` · ${msg.senderId}`}
                      </Text>
                    )}

                    {/* Tip badge */}
                    {msg.type === 'tip' && (
                      <View style={s.tipBadge}>
                        <Text style={s.tipBadgeTxt}>🛡 SAFETY TIP</Text>
                      </View>
                    )}

                    <Text style={s.msgTxt}>{msg.message}</Text>

                    <View style={s.msgFooter}>
                      <Text style={s.msgTime}>{formatTime(msg.timestamp)}</Text>
                      <TouchableOpacity
                        style={s.likeBtn}
                        onPress={() => handleLike(msg.id)}
                      >
                        <Text style={s.likeTxt}>👍 {msg.likes || 0}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isMe && (
                    <View style={[s.avatar, { backgroundColor: RED }]}>
                      <Text style={s.avatarTxt}>👤</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {messages.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyIco}>💬</Text>
                <Text style={s.emptyTxt}>No messages yet</Text>
                <Text style={s.emptySub}>Be the first to share something with the community</Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Input */}
          <View style={s.inputArea}>
            {role === 'police' && (
              <View style={s.policeInputBanner}>
                <Text style={s.policeInputTxt}>
                  🏛 You are posting as a Police Officer — your message will be marked as official
                </Text>
              </View>
            )}
            <View style={s.inputRow}>
              <TextInput
                style={s.chatInput}
                placeholder={role === 'police'
                  ? 'Share safety advice or incident update...'
                  : 'Share an incident or ask for advice...'}
                placeholderTextColor="#888"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, !input.trim() && { opacity: 0.5 },
                  role === 'police' && { backgroundColor: BLUE }]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.sendIco}>➤</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* SAFETY TIPS TAB */
        <ScrollView style={s.tipsList} showsVerticalScrollIndicator={false}>
          <View style={s.tipsHeader}>
            <Text style={s.tipsHeaderTxt}>🏛 Official Police Safety Guidelines</Text>
            <Text style={s.tipsHeaderSub}>Defensive advice from TSN Command</Text>
          </View>

          {tips.map((tip) => (
            <View key={tip.id} style={s.tipCard}>
              <View style={s.tipIconWrap}>
                <Text style={s.tipIcon}>{tip.ico}</Text>
              </View>
              <View style={s.tipContent}>
                <Text style={s.tipCategory}>{tip.category}</Text>
                <Text style={s.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}

          {/* Post as police */}
          {role === 'police' && (
            <TouchableOpacity
              style={s.addTipBtn}
              onPress={() => setTab('chat')}
            >
              <Text style={s.addTipTxt}>+ Share New Safety Tip in Chat</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        {(role === 'driver' ? [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'driverDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'emergency'       },
          { ico: '💬', lbl: 'CHAT',      to: 'chatBoard'       },
          { ico: '👤', lbl: 'PROFILE',   to: 'profileSetup'    },
        ] : [
          { ico: '⊞', lbl: 'DASHBOARD', to: 'policeDashboard' },
          { ico: '⚠',  lbl: 'ALERTS',   to: 'policeDashboard' },
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
  safe:            { flex: 1, backgroundColor: '#0d0d0d' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  back:            { fontSize: 22, color: RED, fontWeight: '600', marginRight: 12 },
  headerMid:       { flex: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 10, color: '#888', marginTop: 1 },
  liveDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4caf50' },
  tabRow:          { flexDirection: 'row', backgroundColor: '#111', paddingHorizontal: 14, paddingBottom: 10, gap: 10 },
  tabBtn:          { flex: 1, backgroundColor: '#222', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive:    { backgroundColor: RED },
  tabBtnTxt:       { fontSize: 12, fontWeight: '700', color: '#888' },
  tabBtnTxtActive: { color: '#fff' },
  loadingBox:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d' },
  loadingTxt:      { color: '#888', marginTop: 12 },
  pinnedBanner:    { flexDirection: 'row', backgroundColor: '#1a1a2e', margin: 12, borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: BLUE },
  pinnedIco:       { fontSize: 16, marginRight: 8 },
  pinnedTxt:       { flex: 1, fontSize: 11, color: '#aaa', lineHeight: 16 },
  messageList:     { flex: 1, backgroundColor: '#0d0d0d', paddingHorizontal: 12 },
  msgRow:          { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  msgRowMe:        { justifyContent: 'flex-end' },
  avatar:          { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  avatarTxt:       { fontSize: 16 },
  bubble:          { maxWidth: '78%', borderRadius: 16, padding: 12 },
  senderName:      { fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  tipBadge:        { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  tipBadgeTxt:     { fontSize: 10, fontWeight: '800', color: '#90caf9' },
  msgTxt:          { fontSize: 13, color: '#fff', lineHeight: 19 },
  msgFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  msgTime:         { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  likeBtn:         { flexDirection: 'row', alignItems: 'center' },
  likeTxt:         { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  emptyBox:        { alignItems: 'center', paddingVertical: 60 },
  emptyIco:        { fontSize: 48, marginBottom: 12 },
  emptyTxt:        { fontSize: 18, fontWeight: '700', color: '#555' },
  emptySub:        { fontSize: 13, color: '#444', marginTop: 6, textAlign: 'center' },
  inputArea:       { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222', padding: 12 },
  policeInputBanner:{ backgroundColor: '#1a237e', borderRadius: 8, padding: 8, marginBottom: 8 },
  policeInputTxt:  { fontSize: 10, color: '#90caf9', fontWeight: '600', textAlign: 'center' },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput:       { flex: 1, backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#333' },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  sendIco:         { fontSize: 18, color: '#fff' },
  tipsList:        { flex: 1, backgroundColor: '#0d0d0d', padding: 14 },
  tipsHeader:      { backgroundColor: BLUE, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
  tipsHeaderTxt:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  tipsHeaderSub:   { fontSize: 11, color: '#90caf9', marginTop: 4 },
  tipCard:         { flexDirection: 'row', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: BLUE },
  tipIconWrap:     { width: 42, height: 42, borderRadius: 12, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  tipIcon:         { fontSize: 22 },
  tipContent:      { flex: 1 },
  tipCategory:     { fontSize: 11, fontWeight: '800', color: '#90caf9', marginBottom: 4, letterSpacing: 0.5 },
  tipText:         { fontSize: 12, color: '#ccc', lineHeight: 18 },
  addTipBtn:       { backgroundColor: BLUE, borderRadius: 12, padding: 16, alignItems: 'center', margin: 14 },
  addTipTxt:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  bottomNav:       { flexDirection: 'row', backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222', paddingVertical: 10 },
  navActive:       { flex: 1, alignItems: 'center', backgroundColor: RED, borderRadius: 12, paddingVertical: 6, marginHorizontal: 4 },
  navItem:         { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navIcoA:         { fontSize: 18, color: '#fff' },
  navTxtA:         { fontSize: 9, color: '#fff', marginTop: 2, fontWeight: '700' },
  navIco:          { fontSize: 18, color: '#666' },
  navTxt:          { fontSize: 9, color: '#666', marginTop: 2 },
});
