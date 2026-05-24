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

interface LoginPayload {
  email: string;
  password: string;
}

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
 */
function mapKahaUserToFrontendUser(kahaUser: any, token: string): User {
  // Decode JWT to get businessId
  let businessId = BUSINESS_ID;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    businessId = payload.businessId || BUSINESS_ID;
  } catch (e) {
    console.warn('Could not decode JWT token');
  }

  // Map role
  let role = UserRoleEnum.USER;
  if (kahaUser.role === 'admin') {
    role = UserRoleEnum.ADMIN;
  } else if (kahaUser.role === 'business_super_admin') {
    role = UserRoleEnum.BUSINESS_SUPER_ADMIN;
  }

  return {
    id: kahaUser.id,
    name: kahaUser.fullName || kahaUser.email,
    email: kahaUser.email,
    phone: kahaUser.contactNumber || '',
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
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
  },

  /**
   * Admin Login
   * Same as regular login, but validates admin role
   */
  adminLogin: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      const response = await authAxios.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { access_token, user: kahaUser } = response.data;

      // Verify user has admin role
      if (kahaUser.role !== 'admin' && kahaUser.role !== 'business_super_admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      const user = mapKahaUserToFrontendUser(kahaUser, access_token);

      return {
        accessToken: access_token,
        refreshToken: access_token,
        user,
      };
    } catch (error: any) {
      console.error('Admin login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Invalid administrator credentials');
    }
  },

  /**
   * Register new user
   * Note: Kaha Main V3 may not have a public registration endpoint
   * You may need to implement this in your restaurant backend
   */
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      // Option 1: Call Kaha Main V3 register endpoint (if available)
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
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      
      // If Kaha Main V3 doesn't support registration, show helpful error
      if (error.response?.status === 404) {
        throw new Error('Registration is not available. Please contact support.');
      }
      
      throw new Error(error.response?.data?.message || 'Registration failed');
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const response = await authAxios.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return mapKahaUserToFrontendUser(response.data, token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  },
};
