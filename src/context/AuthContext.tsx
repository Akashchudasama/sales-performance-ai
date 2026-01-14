import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, getEmployees, getEmployeeById, initializeDefaultAdmin } from '@/lib/dataService';

interface AuthContextType {
  user: Employee | null;
  login: (email: string, password: string, role: 'employee' | 'admin') => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'salestrack_current_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const userId = JSON.parse(stored);
        return getEmployeeById(userId) || null;
      }
    } catch {
      // Ignore errors
    }
    return null;
  });

  useEffect(() => {
    // Initialize default admin on first load
    initializeDefaultAdmin();
  }, []);

  const login = (email: string, password: string, role: 'employee' | 'admin'): boolean => {
    const employees = getEmployees();
    const matchedUser = employees.find(e => 
      e.email.toLowerCase() === email.toLowerCase() && 
      e.role === role
    );
    
    if (matchedUser) {
      // For demo: accept any password or check if password matches
      if (!matchedUser.password || matchedUser.password === password) {
        setUser(matchedUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser.id));
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
