/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  register: (name: string, email: string, password?: string, role?: string) => boolean;
  logout: () => void;
  fillDemoCredentials: () => { email: string; password: string };
}

const DEMO_USER: User = {
  name: 'Demo Analyst',
  email: 'demo@geomeasure.io',
  role: 'GIS Specialist',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('geomeasure_user');
      return saved ? JSON.parse(saved) : DEMO_USER; // Default logged in as demo for instant smooth test
    } catch {
      return DEMO_USER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('geomeasure_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('geomeasure_user');
    }
  }, [user]);

  const login = (email: string, _password?: string) => {
    if (!email) {
      toast.error('Please enter an email address');
      return false;
    }

    const matchedName = email.toLowerCase().includes('demo') 
      ? DEMO_USER.name 
      : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const loggedUser: User = {
      name: matchedName || 'Surveyor',
      email: email.trim(),
      role: email.toLowerCase().includes('demo') ? DEMO_USER.role : 'Geospatial Engineer',
    };

    setUser(loggedUser);
    toast.success(`Welcome back, ${loggedUser.name}!`);
    return true;
  };

  const register = (name: string, email: string, _password?: string, role?: string) => {
    if (!name || !email) {
      toast.error('Please fill in required fields');
      return false;
    }

    const newUser: User = {
      name: name.trim(),
      email: email.trim(),
      role: role?.trim() || 'GIS Analyst',
    };

    setUser(newUser);
    toast.success(`Account created successfully! Welcome, ${newUser.name}.`);
    return true;
  };

  const logout = () => {
    const prevName = user?.name || 'User';
    setUser(null);
    toast.success(`Signed out successfully. Goodbye, ${prevName}!`);
  };

  const fillDemoCredentials = () => {
    toast('Demo credentials auto-filled', { icon: '🔑' });
    return {
      email: 'demo@geomeasure.io',
      password: 'password123',
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fillDemoCredentials,
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
