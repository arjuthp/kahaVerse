import axios from 'axios';
import type { User } from '../types';
import { UserRoleEnum } from '../types';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    kahaId?: string;
  };
}

// cspell:disable-next-line
// Kaha Main V3 API base URL
const KAHA_V3_URL = import.meta.env.VITE_KAHA_MAIN_V3_URL || 'https://api.kaha.com.np/main/api/v3';
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || '00000000-0000-4000-a000-000000000100';

// Create separate axios instance for auth (no interceptors)
const authAxios = axios.create({
  baseURL: KAHA_V3_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Map Kaha Main V3 user to frontend User type
 * Extracts businessId from JWT token
 */
function mapKahaUserToFrontendUser(kahaUser: Record<string, unknown>, token: string): User {
  // Decode JWT to get businessId and other claims
  let businessId = BUSINESS_ID;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    businessId = (payload.businessId as string) || (payload.business_id as string) || BUSINESS_ID;
  } catch (e) {
    console.warn('Could not decode JWT token:', e);
  }

  // Map role (case-insensitive)
  let role = UserRoleEnum.USER;
  const kahaRole = ((kahaUser.role as string) || '').toLowerCase();
  if (kahaRole === 'admin' || kahaRole === 'super_admin') {
    role = UserRoleEnum.ADMIN;
  } else if (kahaRole === 'business_super_admin' || kahaRole === 'business_admin') {
    role = UserRoleEnum.BUSINESS_SUPER_ADMIN;
  }

  return {
    id: kahaUser.id as string,
    name: (kahaUser.fullName as string) || (kahaUser.name as string) || (kahaUser.email as string),
    email: kahaUser.email as string,
    phone: (kahaUser.contactNumber as string) || (kahaUser.phone as string) || '',
    role: role,
    businessId: businessId,
  };
}

export const authApi = {
  /**
   * Customer/User Login
   * Calls Kaha Main V3 login endpoint
   */
  login: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      const response = await authAxios.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { access_token, user: kahaUser } = response.data;
      
      // Map to frontend user format
      const user = mapKahaUserToFrontendUser(kahaUser, access_token);

      return {
        accessToken: access_token,
        refreshToken: access_token, // Kaha V3 doesn't return separate refresh token
        user,
      };
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Login error:', axiosErr.response?.data || error);
      throw new Error((axiosErr.response?.data?.message as string) || 'Invalid email or password', { cause: error });
    }
  },

  /**
   * Admin Login
   * Calls Restaurant Backend admin login endpoint
   * Admin must be registered in Kaha Main V3 first (with admin role)
   * Then backend validates against Kaha Main V3 and returns auth token
   */
  adminLogin: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      // Admin login calls Restaurant Backend /api/v1/auth/admin/login
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await axios.post(
        `${backendUrl}/api/v1/auth/admin/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access_token, refreshToken, user: adminUser } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refreshToken,
        user: adminUser,
      };
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Admin login error:', axiosErr.response?.data || error);
      throw new Error((axiosErr.response?.data?.message as string) || 'Invalid administrator credentials', { cause: error });
    }
  },

  /**
   * Register new user (Customer)
   * Currently Kaha Main V3 does not support public registration
   * Customers should use existing Kaha Main V3 accounts
   */
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      // Try to register with Kaha Main V3
      const response = await authAxios.post<AuthResponse>('/auth/register', {
        fullName: payload.name,
        email: payload.email,
        password: payload.password,
        contactNumber: payload.phone,
      });

      const { access_token, user: kahaUser } = response.data;
      const user = mapKahaUserToFrontendUser(kahaUser, access_token);

      return {
        accessToken: access_token,
        refreshToken: access_token,
        user,
      };
    } catch (error) {
      const axiosErr = error as { response?: { status?: number; data?: { message?: string } } };
      console.error('Registration error:', axiosErr.response?.data || error);
      
      throw new Error(
        'Registration is not available. Please log in with your existing Kaha account or contact support.',
        { cause: error }
      );
    }
  },

  /**
   * Logout
   * Clear local storage
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('kaha_token');
    localStorage.removeItem('kaha_user');
    localStorage.removeItem('kaha_refresh_token');
  },

  /**
   * Verify token is still valid
   * Calls Kaha Main V3 to get current user info
   */
  verifyToken: async (token: string): Promise<User | null> => {
    try {
      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
      const userId = payload.id as string;

      const response = await authAxios.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return mapKahaUserToFrontendUser(response.data as Record<string, unknown>, token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  },
};
