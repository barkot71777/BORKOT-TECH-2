import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string) => Promise<User>;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('borkot_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('borkot_auth_token');
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('borkot_auth_token'));
    } catch {
      return false;
    }
  });

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('borkot_auth_token') : null);
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  const refreshUser = useCallback(async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('borkot_auth_token') : null);
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        try {
          localStorage.setItem('borkot_auth_user', JSON.stringify(data.user));
        } catch {
          // ignore
        }
      } else {
        // Token invalid or expired
        localStorage.removeItem('borkot_auth_token');
        localStorage.removeItem('borkot_auth_user');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, password: string): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), email: identifier.trim(), password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    try {
      localStorage.setItem('borkot_auth_token', data.token);
      localStorage.setItem('borkot_auth_user', JSON.stringify(data.user));
    } catch {
      // ignore
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<User> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    try {
      localStorage.setItem('borkot_auth_token', data.token);
      localStorage.setItem('borkot_auth_user', JSON.stringify(data.user));
    } catch {
      // ignore
    }
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const setSession = (newUser: User, newToken: string) => {
    try {
      localStorage.setItem('borkot_auth_token', newToken);
      localStorage.setItem('borkot_auth_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('borkot_auth_token');
      localStorage.removeItem('borkot_auth_user');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const isAdmin = Boolean(user && user.role !== 'customer');
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isSuperAdmin,
        login,
        register,
        setSession,
        logout,
        refreshUser,
        authFetch
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
