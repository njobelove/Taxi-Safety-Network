/**
 * AuthContext — stores the logged-in user globally.
 * Works for both drivers and police stations.
 */
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);   // driver or station document
  const [userType, setUserType] = useState(null); // 'driver' | 'police'

  const login  = (doc, type) => { setUser(doc); setUserType(type); };
  const logout = ()          => { setUser(null); setUserType(null); };

  return (
    <AuthContext.Provider value={{ user, userType, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
