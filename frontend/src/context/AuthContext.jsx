import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'campus_lost_found_token';

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to read auth token from localStorage:', err);
    return null;
  }
}

function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth token to localStorage:', err);
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token to axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check current user on mount or token change
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        const res = await axios.get('/api/auth/me');
        if (isMounted) {
          setUser(res.data.user);
          setToken(currentToken);
        }
      } catch (err) {
        // Token invalid or expired
        if (isMounted) {
          setStoredToken(null);
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newUser;
  };

  const register = async (email, password) => {
    const res = await axios.post('/api/auth/register', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newUser;
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
