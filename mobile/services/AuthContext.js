import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(null);
  const [role,         setRole]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [voiceUri,     setVoiceUri]     = useState(null);

  // ── Restore session on app start ─────────────────────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('tsn_token');
      const savedUser  = localStorage.getItem('tsn_user');
      const savedRole  = localStorage.getItem('tsn_role');
      const savedPhoto = localStorage.getItem('tsn_photo');
      const savedVoice = localStorage.getItem('tsn_voice');

      if (savedToken && savedUser && savedRole) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
        if (savedPhoto) setProfilePhoto(savedPhoto);
        if (savedVoice) setVoiceUri(savedVoice);
        console.log('✅ Session restored:', savedRole);
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
    console.log('LOGIN — role:', userRole, 'user:', userData?.badgeId || userData?.stationId);

    try {
      localStorage.setItem('tsn_token', userToken);
      localStorage.setItem('tsn_user',  JSON.stringify(userData));
      localStorage.setItem('tsn_role',  userRole);
    } catch (e) {}

    setToken(userToken);
    setRole(userRole);
    setUser(userData);
  };

  // ── Save photo permanently ────────────────────────────────────────────────
  const savePhoto = (uri) => {
    setProfilePhoto(uri);
    try {
      localStorage.setItem('tsn_photo', uri);
      console.log('✅ Photo saved to profile');
    } catch (e) {}
  };

  // ── Save voice permanently ────────────────────────────────────────────────
  const saveVoice = (uri) => {
    setVoiceUri(uri);
    try {
      localStorage.setItem('tsn_voice', uri);
      console.log('✅ Voice note saved to profile');
    } catch (e) {}
  };

  const logout = () => {
    console.log('Logging out...');
    try {
      localStorage.removeItem('tsn_token');
      localStorage.removeItem('tsn_user');
      localStorage.removeItem('tsn_role');
      // Note: photo and voice stay saved on device for next login
    } catch (e) {}
    // Clear all auth state — triggers useEffect in Navigator → goes to login
    setUser(null);
    setToken(null);
    setRole(null);
    console.log('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user, token, role, loading,
      profilePhoto, voiceUri,
      login, logout, savePhoto, saveVoice
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
