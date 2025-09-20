'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type Admin, type LoginResponse } from '@/lib/api';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!admin && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('admin_token');
        const storedAdmin = localStorage.getItem('admin_data');

        if (storedToken && storedAdmin) {
          // Verify token is still valid
          const response = await authApi.verifyToken(storedToken);
          if (response.success && response.data) {
            setToken(storedToken);
            setAdmin(JSON.parse(storedAdmin));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_data');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        const { admin: adminData, token: authToken } = response.data;
        
        // Store in localStorage
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_data', JSON.stringify(adminData));
        
        // Update state
        setAdmin(adminData);
        setToken(authToken);

        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.signup(username, email, password);

      if (response.success && response.data) {
        const { admin: adminData, token: authToken } = response.data;
        
        // Store in localStorage
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_data', JSON.stringify(adminData));
        
        // Update state
        setAdmin(adminData);
        setToken(authToken);

        return { success: true, message: 'Registration successful' };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    
    // Clear state
    setAdmin(null);
    setToken(null);
  };

  const value: AuthContextType = {
    admin,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}