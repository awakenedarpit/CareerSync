/**
 * CarrerSync Authentication Context & Provider
 * Manages reactive user state, role transitions, and persistent JWT session synchronization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  authService,
  DEMO_CREDENTIALS,
  DEMO_ROLES,
  getDashboardPathForRole
} from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setTokenState] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Sync state on initial load and handle cross-tab changes
  useEffect(() => {
    function syncAuth() {
      const activeToken = authService.getToken();
      const activeUser = authService.getCurrentUser();
      setTokenState(activeToken);
      setUser(activeUser);
      setIsLoading(false);
    }

    syncAuth();

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const currentUser = authService.getCurrentUser() || response.user;
      const currentToken = authService.getToken() || response.token;
      setUser(currentUser);
      setTokenState(currentToken);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey] || DEMO_CREDENTIALS.student;
    return await login({
      email: creds.email,
      password: creds.password,
      role: creds.role
    });
  }, [login]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.token) {
        const currentUser = authService.getCurrentUser() || response.user;
        const currentToken = authService.getToken() || response.token;
        setUser(currentUser);
        setTokenState(currentToken);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setTokenState(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('user', JSON.stringify(next));
        if (next.role) localStorage.setItem('role', next.role);
        if (next.tenantId) localStorage.setItem('tenant_id', next.tenantId);
      } catch {}
      return next;
    });
  }, []);

  const role = user?.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : null) || null;
  const isAuth = !!token && authService.isAuthenticated();

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated: isAuth,
      isLoading,
      login,
      demoLogin,
      register,
      logout,
      updateUser,
      getDashboardPath: getDashboardPathForRole,
      demoCredentials: DEMO_CREDENTIALS,
      demoRoles: DEMO_ROLES
    }),
    [user, token, role, isAuth, isLoading, login, demoLogin, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful fallback for non-provider renders
    return {
      user: authService.getCurrentUser(),
      token: authService.getToken(),
      role: authService.getCurrentUser()?.role || localStorage.getItem('role'),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      login: authService.login,
      demoLogin: async (r) => authService.login(DEMO_CREDENTIALS[r] || DEMO_CREDENTIALS.student),
      register: authService.register,
      logout: authService.logout,
      updateUser: () => {},
      getDashboardPath: getDashboardPathForRole,
      demoCredentials: DEMO_CREDENTIALS,
      demoRoles: DEMO_ROLES
    };
  }
  return context;
}

export default AuthContext;
