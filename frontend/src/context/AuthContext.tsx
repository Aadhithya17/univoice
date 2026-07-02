import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  signup: (username: string, email: string, password: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  setGuestMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme] = useState<'dark'>('dark');

  // Load user session and theme settings on mount
  useEffect(() => {
    // Theme initialization: Always force dark mode
    localStorage.setItem('theme', 'dark');
    document.body.classList.remove('light-theme');

    // 2. Guest state initialization
    const storedGuest = localStorage.getItem('guest_mode') === 'true';
    if (storedGuest) {
      setIsGuest(true);
    }

    // 3. User fetch
    const checkSession = async () => {
      try {
        const data = await api.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          setIsGuest(false);
          localStorage.removeItem('guest_mode');
        }
      } catch (err) {
        // Expected if token cookie not set
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const toggleTheme = () => {
    // Light mode feature removed as requested. Always stay in dark mode.
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/signup', { username, email, password });
      if (data.success && data.user) {
        setUser(data.user);
        setIsGuest(false);
        localStorage.removeItem('guest_mode');
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/verify', { email, code });
      if (data.success && data.user) {
        setUser(data.user);
        setIsGuest(false);
        localStorage.removeItem('guest_mode');
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.success && data.user) {
        setUser(data.user);
        setIsGuest(false);
        localStorage.removeItem('guest_mode');
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem('guest_mode');
      setIsLoading(false);
    }
  };

  const setGuestMode = (mode: boolean) => {
    setIsGuest(mode);
    if (mode) {
      localStorage.setItem('guest_mode', 'true');
      setUser(null);
    } else {
      localStorage.removeItem('guest_mode');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isGuest,
        theme,
        toggleTheme,
        signup,
        verifyEmail,
        login,
        logout,
        setGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
