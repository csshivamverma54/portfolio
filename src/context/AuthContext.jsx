import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem('admin_token');
    if (!currentToken) {
      setUser(null);
      setCheckingAuth(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Invalid or expired token
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      localStorage.removeItem('admin_token');
      setToken(null);
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      throw new Error('Network error: Unable to contact the authentication server.');
    }

    let data = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (!res.ok) {
        throw new Error(`Authentication server returned HTTP ${res.status}.`);
      }
      throw new Error('Invalid response received from authentication server.');
    }

    if (!res.ok) {
      throw new Error(data.error || `Authentication failed (HTTP ${res.status})`);
    }

    localStorage.setItem('admin_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    checkingAuth,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
