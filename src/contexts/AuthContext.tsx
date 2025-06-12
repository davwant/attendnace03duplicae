import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Teacher, AuthContextType } from '../types';
import { authenticateTeacherAndFetchData, TeacherAuthResponse } from '../utils/teacherAuthService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [authData, setAuthData] = useState<TeacherAuthResponse['data'] | null>(null);
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const login = async (loginId: string, password: string): Promise<{ success: boolean; warning?: string }> => {
    try {
      const result = await authenticateTeacherAndFetchData(loginId, password);
      
      if (result.success && result.data) {
        const teacher: Teacher = {
          id: result.data.teacher.id,
          name: result.data.teacher.name,
          loginId: result.data.teacher.loginId,
          password: '', // Don't store password
          schoolId: result.data.teacher.schoolId,
          schoolName: result.data.school?.name || 'School Name Unavailable'
        };
        
        setCurrentTeacher(teacher);
        setAuthData(result.data);
        setAuthWarning(result.warning || null);
        
        return { 
          success: true, 
          warning: result.warning 
        };
      } else {
        console.error('Login failed:', result.error);
        setAuthWarning(null);
        return { success: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthWarning(null);
      return { success: false };
    }
  };

  const logout = () => {
    setCurrentTeacher(null);
    setAuthData(null);
    setAuthWarning(null);
  };

  const value = {
    currentTeacher,
    authData,
    authWarning,
    isAuthenticated: !!currentTeacher,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}