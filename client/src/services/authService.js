/**
 * CarrerSync Client Authentication Service
 * Manages JWT tokens, authenticated sessions, tenant context, and user state.
 * Strictly adheres to CareerSync M3 Mint design & security standards.
 */

import apiClient from './api';

export const DEMO_CREDENTIALS = {
  student: {
    email: 'aditya.sharma@apex.edu',
    password: 'DemoPassword@123',
    role: 'student',
    fullName: 'Aditya Sharma',
    label: 'Student',
    dashboardPath: '/student',
    description: 'B.Tech CSE, Batch 2025'
  },
  tpo_admin: {
    email: 'tpo@apex.edu',
    password: 'DemoPassword@123',
    role: 'tpo_admin',
    fullName: 'Prof. Rajiv Menon',
    label: 'TPO Admin',
    dashboardPath: '/admin',
    description: 'Training & Placement Officer'
  },
  admin: {
    // Alias for tpo_admin compatibility
    email: 'tpo@apex.edu',
    password: 'DemoPassword@123',
    role: 'tpo_admin',
    fullName: 'Prof. Rajiv Menon',
    label: 'TPO Admin',
    dashboardPath: '/admin',
    description: 'Training & Placement Officer'
  },
  college_admin: {
    email: 'admin@apex.edu',
    password: 'DemoPassword@123',
    role: 'college_admin',
    fullName: 'Dr. Rajesh Sharma',
    label: 'College Admin',
    dashboardPath: '/college-admin',
    description: 'Institutional Dean / Principal'
  },
  recruiter: {
    email: 'recruiter@cloudscale.example.com',
    password: 'DemoPassword@123',
    role: 'recruiter',
    fullName: 'Vikram Mehta',
    label: 'Recruiter',
    dashboardPath: '/recruiter',
    description: 'Lead Technical Recruiter, CloudScale'
  },
  superadmin: {
    email: 'admin@carrersync.internal',
    password: 'DemoPassword@123',
    role: 'superadmin',
    fullName: 'Platform Super Admin',
    label: 'Super Admin',
    dashboardPath: '/super-admin',
    description: 'Multi-Tenant Platform Administrator'
  },
  super_admin: {
    // Alias for superadmin compatibility
    email: 'admin@carrersync.internal',
    password: 'DemoPassword@123',
    role: 'superadmin',
    fullName: 'Platform Super Admin',
    label: 'Super Admin',
    dashboardPath: '/super-admin',
    description: 'Multi-Tenant Platform Administrator'
  },
  alumni: {
    email: 'alumni@apex.edu',
    password: 'DemoPassword@123',
    role: 'alumni',
    fullName: 'Vikram Malhotra',
    label: 'Alumni',
    dashboardPath: '/alumni',
    description: 'Alumni Mentor (Class of 2022)'
  }
};

export const DEMO_ROLES = [
  DEMO_CREDENTIALS.student,
  DEMO_CREDENTIALS.tpo_admin,
  DEMO_CREDENTIALS.college_admin,
  DEMO_CREDENTIALS.recruiter,
  DEMO_CREDENTIALS.superadmin,
  DEMO_CREDENTIALS.alumni,
];

/**
 * Returns canonical dashboard redirect path for any role string.
 */
export function getDashboardPathForRole(role) {
  const normalized = String(role || '').toLowerCase().trim();
  switch (normalized) {
    case 'student':
      return '/student';
    case 'tpo_admin':
    case 'tpo':
    case 'admin':
    case 'faculty_coordinator':
      return '/admin';
    case 'college_admin':
      return '/college-admin';
    case 'recruiter':
      return '/recruiter';
    case 'superadmin':
    case 'super_admin':
      return '/super-admin';
    case 'alumni':
      return '/alumni';
    default:
      return '/student';
  }
}

/**
 * Retrieves the sanitized Bearer token from localStorage or sessionStorage.
 * Returns null if missing, empty, 'null', or 'undefined'.
 */
export function getToken() {
  try {
    const raw = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!raw) return null;
    const sanitized = String(raw).replace(/^(bearer(\s+|$))+/i, '').trim();
    if (!sanitized || sanitized.toLowerCase() === 'null' || sanitized.toLowerCase() === 'undefined') {
      return null;
    }
    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Stores the authenticated session token and user context in localStorage.
 */
export function setToken(token, user = null, tenantId = null, role = null) {
  try {
    if (!token) {
      localStorage.removeItem('token');
      return;
    }
    const sanitized = String(token).replace(/^(bearer(\s+|$))+/i, '').trim();
    if (!sanitized || sanitized.toLowerCase() === 'null' || sanitized.toLowerCase() === 'undefined') {
      localStorage.removeItem('token');
      return;
    }
    localStorage.setItem('token', sanitized);

    const resolvedTenantId = tenantId || user?.tenantId || user?.tenant_id;
    if (resolvedTenantId && resolvedTenantId.toLowerCase() !== 'null' && resolvedTenantId.toLowerCase() !== 'undefined') {
      localStorage.setItem('tenant_id', resolvedTenantId);
    }

    const resolvedRole = role || user?.role;
    if (resolvedRole) {
      localStorage.setItem('role', resolvedRole);
    }

    if (user) {
      localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
    }
  } catch (err) {
    console.warn('Failed to persist auth token:', err);
  }
}

/**
 * Clears all authentication tokens, session storage, and cached user context.
 */
export function logout() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tenant_id');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('user');
  } catch {}
}

/**
 * Validates whether an active, non-expired token exists.
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  // Check token expiration if JWT standard structure is detected
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        logout();
        return false;
      }
    }
  } catch {
    // If not standard JWT string, retain validity if token is non-empty
  }

  return true;
}

/**
 * Retrieves the current authenticated user context from localStorage or decoded JWT.
 */
export function getCurrentUser() {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      return JSON.parse(rawUser);
    }
  } catch {}

  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenant_id,
        fullName: payload.fullName || payload.name || 'Authenticated User'
      };
    }
  } catch {}

  const role = localStorage.getItem('role') || 'student';
  const tenantId = localStorage.getItem('tenant_id') || '';
  return { role, tenantId };
}

/**
 * Authenticates user credentials via /api/v1/auth/login and stores session.
 */
export async function login(credentials) {
  const response = await apiClient.post('/auth/login', credentials);
  const data = response?.data || response;
  const token = data?.token || response?.token;
  const user = data?.user || response?.user;

  if (token) {
    setToken(
      token,
      user,
      user?.tenantId || user?.tenant_id || data?.tenantId || credentials.tenantId,
      user?.role || data?.role || credentials.role
    );
  }

  return {
    success: data?.success ?? true,
    token,
    user: user || getCurrentUser(),
    message: data?.message || 'Login successful',
    ...data
  };
}

/**
 * Registers new user account via /api/v1/auth/register and stores session.
 */
export async function register(userData) {
  const response = await apiClient.post('/auth/register', userData);
  const data = response?.data || response;
  const token = data?.token || response?.token;
  const user = data?.user || response?.user;

  if (token) {
    setToken(
      token,
      user,
      user?.tenantId || user?.tenant_id || data?.tenantId || userData.tenantId,
      user?.role || data?.role || userData.role
    );
  }

  return {
    success: data?.success ?? true,
    token,
    user: user || getCurrentUser(),
    message: data?.message || 'Registration successful',
    ...data
  };
}

/**
 * Ensures a valid authenticated session exists for the given role.
 * If no session exists or the token has expired, attempts to establish a demo/development
 * authenticated session so subsequent API requests succeed with valid Authorization headers.
 */
export async function ensureAuthenticatedSession(role = 'student') {
  if (isAuthenticated()) {
    const user = getCurrentUser();
    return { authenticated: true, user, token: getToken() };
  }

  // Strict User Isolation: Do NOT silently login with demo credentials if unauthenticated.
  return {
    authenticated: false,
    error: 'Authentication required. Please sign in.'
  };
}

export const authService = {
  login,
  register,
  logout,
  getToken,
  setToken,
  isAuthenticated,
  getCurrentUser,
  getDashboardPathForRole,
  ensureAuthenticatedSession,
  DEMO_CREDENTIALS,
  DEMO_ROLES
};

export default authService;
