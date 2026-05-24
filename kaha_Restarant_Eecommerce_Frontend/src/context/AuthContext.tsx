import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { UserRoleEnum } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isBusinessAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('kaha_token');
    const userStr = localStorage.getItem('kaha_user');
    if (token && userStr) {
      try {
        return { token, user: JSON.parse(userStr), isAuthenticated: true };
      } catch {
        return { token: null, user: null, isAuthenticated: false };
      }
    }
    return { token: null, user: null, isAuthenticated: false };
  });

  const login = (token: string, user: User) => {
    localStorage.setItem('kaha_token', token);
    localStorage.setItem('kaha_user', JSON.stringify(user));
    setAuthState({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('kaha_token');
    localStorage.removeItem('kaha_user');
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  const isAdmin =
    authState.user?.role === UserRoleEnum.ADMIN ||
    authState.user?.role === UserRoleEnum.BUSINESS_SUPER_ADMIN ||
    authState.user?.role === UserRoleEnum.SUPER_ADMIN;

  const isBusinessAdmin =
    authState.user?.role === UserRoleEnum.BUSINESS_SUPER_ADMIN ||
    authState.user?.role === UserRoleEnum.SUPER_ADMIN;

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isAdmin, isBusinessAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
