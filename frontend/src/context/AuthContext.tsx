import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../shared/types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, role?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthority: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('roadguard_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
        } catch (e) {
          console.warn('Session expired or invalid token:', e);
          localStorage.removeItem('roadguard_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    const data = await api.login(email, pass);
    localStorage.setItem('roadguard_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, pass: string, role?: string): Promise<User> => {
    const data = await api.register({ name, email, password: pass, role });
    localStorage.setItem('roadguard_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('roadguard_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAuthority = user?.role === 'AUTHORITY' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated,
        isAuthority,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
