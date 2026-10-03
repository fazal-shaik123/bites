import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';

export interface UserSession {
  id: number;
  name: string;
  role: 'her' | 'admin';
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (role: 'her' | 'admin', pin: string) => Promise<UserSession>;
  instantLogin: (role?: 'her' | 'admin') => Promise<UserSession>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: UserSession }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (role: 'her' | 'admin', pin: string): Promise<UserSession> => {
    const data = await apiRequest<{ user: UserSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, pin })
    });
    setUser(data.user);
    return data.user;
  };

  const instantLogin = async (role: 'her' | 'admin' = 'her'): Promise<UserSession> => {
    const data = await apiRequest<{ user: UserSession }>('/api/auth/instant-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, instantLogin, logout, refreshUser }}>
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
