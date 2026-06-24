import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(null);
  const [role,         setRole]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [voiceUri,     setVoiceUri]     = useState(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('tsn_token');
      const savedUser  = localStorage.getItem('tsn_user');
      const savedRole  = localStorage.getItem('tsn_role');

      if (savedToken && savedUser && savedRole) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setRole(savedRole);

        // ── Load photo and voice FOR THIS SPECIFIC USER ACCOUNT ──
        const userId  = parsedUser?.badgeId || parsedUser?.stationId || 'unknown';
        const photo   = localStorage.getItem(`tsn_photo_${userId}`);
        const voice   = localStorage.getItem(`tsn_voice_${userId}`);
        if (photo) setProfilePhoto(photo);
        if (voice) setVoiceUri(voice);
      }
    } catch (e) {
      console.log('Session restore error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (data, userRole) => {
    const userData  = data.user  || data;
    const userToken = data.token || '';

    try {
      localStorage.setItem('tsn_token', userToken);
      localStorage.setItem('tsn_user',  JSON.stringify(userData));
      localStorage.setItem('tsn_role',  userRole);
    } catch (e) {}

    // ── Load THIS user's photo and voice ─────────────────────────────────
    const userId = userData?.badgeId || userData?.stationId || 'unknown';
    const photo  = localStorage.getItem(`tsn_photo_${userId}`);
    const voice  = localStorage.getItem(`tsn_voice_${userId}`);
    setProfilePhoto(photo || null);
    setVoiceUri(voice || null);

    setToken(userToken);
    setRole(userRole);
    setUser(userData);
  };

  // ── Save photo only for THIS user's account ───────────────────────────────
  const savePhoto = (uri) => {
    const userId = user?.badgeId || user?.stationId || 'unknown';
    setProfilePhoto(uri);
    try {
      localStorage.setItem(`tsn_photo_${userId}`, uri);
      console.log('Photo saved for user:', userId);
    } catch (e) {}
  };

  // ── Save voice only for THIS user's account ───────────────────────────────
  const saveVoice = (uri) => {
    const userId = user?.badgeId || user?.stationId || 'unknown';
    setVoiceUri(uri);
    try {
      localStorage.setItem(`tsn_voice_${userId}`, uri);
      console.log('Voice saved for user:', userId);
    } catch (e) {}
  };

  const logout = () => {
    try {
      localStorage.removeItem('tsn_token');
      localStorage.removeItem('tsn_user');
      localStorage.removeItem('tsn_role');
    } catch (e) {}

    // Clear state but NOT the per-user photo/voice
    // They stay in localStorage under tsn_photo_{userId}
    setUser(null);
    setToken(null);
    setRole(null);
    setProfilePhoto(null);
    setVoiceUri(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, role, loading,
      profilePhoto, voiceUri,
      login, logout, savePhoto, saveVoice,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
