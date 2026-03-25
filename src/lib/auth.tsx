import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Role } from './types';
import { fetchProfile, loginApi, signupApi, updateProfile, adminLoginApi } from './api';

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (payload: { 
    fullName: string; 
    email: string; 
    password: string; 
    role?: Role;
    mobile?: string;
    socialLinks?: string;
    businessCategory?: string;
    interests?: string[];
  }) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (updates: { fullName: string }) => Promise<void>;
  syncUser: (nextUser: User) => void;
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_TOKEN_KEY = 'wellnest_token';
const STORAGE_USER_KEY = 'wellnest_user';

const getStoredToken = () => (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : null);
const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(STORAGE_USER_KEY);
  return item ? (JSON.parse(item) as User) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(getStoredUser());

  const clearStorage = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  };

  const storeUser = (nextUser: User) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    }
  };

  useEffect(() => {
    if (!token) return;
    let canceled = false;
    fetchProfile(token)
      .then(response => {
        if (canceled) return;
        storeUser(response);
      })
      .catch(() => {
        if (canceled) return;
        clearStorage();
      });
    return () => { canceled = true; };
  }, [token]);

  const persistAuth = (newToken: string, nextUser: User) => {
    setToken(newToken);
    storeUser(nextUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await loginApi(email, password);
      persistAuth(response.token, response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signup = async (payload: { 
    fullName: string; 
    email: string; 
    password: string; 
    role?: Role;
    mobile?: string;
    socialLinks?: string;
    businessCategory?: string;
    interests?: string[];
  }): Promise<AuthResult> => {
    try {
      const response = await signupApi(payload);
      persistAuth(response.token, response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const logout = () => {
    clearStorage();
  };

  const updateUser = async (updates: { fullName: string }) => {
    if (!token) return;
    try {
      const response = await updateProfile(token, updates);
      storeUser(response);
    } catch (error) {
      console.error(error);
    }
  };

  const syncUser = (nextUser: User) => {
    storeUser(nextUser);
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await adminLoginApi(email, password);
      persistAuth(response.token, response.user);
      return true;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = () => {
    logout();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser, syncUser, isAdmin: !!isAdmin, adminLogin, adminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
