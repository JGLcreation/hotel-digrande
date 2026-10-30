import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/hotel.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  demoLogin: (role: 'superadmin' | 'admin' | 'staff' | 'guest') => Promise<void>;
  register: (name: string, email: string, pass: string, phone?: string, username?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('grand_luxe_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('grand_luxe_token');
    if (!storedToken) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('grand_luxe_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('grand_luxe_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('grand_luxe_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('grand_luxe_token', data.token);
      return true;
    } catch (err: any) {
      setError('Network error during authentication');
      return false;
    }
  };

  const demoLogin = async (role: 'superadmin' | 'admin' | 'staff' | 'guest') => {
    setError(null);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('grand_luxe_token', data.token);
      } else {
        setError(data.error || 'Demo switch failed');
      }
    } catch (err) {
      setError('Network error switching accounts');
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string, username?: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, phone, username })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('grand_luxe_token', data.token);
      return true;
    } catch (err) {
      setError('Registration error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('grand_luxe_token');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        hasPermission,
        error,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
