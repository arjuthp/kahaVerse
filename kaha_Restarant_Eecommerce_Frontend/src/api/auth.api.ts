import axios from 'axios';
import type { User } from '../types';
import { UserRoleEnum } from '../types';

const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || '7476ee15-1407-41fa-9a49-89e0caaf945d';

// All auth goes through the restaurant backend via Vite proxy (/api/v1 → localhost:3001)
// No external Kaha Main V3 server needed for customer auth
const localApi = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Map restaurant backend user shape to frontend User type
 */
function mapUserToFrontend(userData: Record<string, unknown>, token: string): User {
  let businessId = BUSINESS_ID;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    businessId = (payload.businessId as string) || BUSINESS_ID;
  } catch { /* use default */ }

  const rawRole = ((userData.role as string) || 'user').toLowerCase();
  let role = UserRoleEnum.USER;
  if (rawRole === 'admin' || rawRole === 'super_admin') {
    role = UserRoleEnum.ADMIN;
  } else if (rawRole === 'business_super_admin' || rawRole === 'business_admin') {
    role = UserRoleEnum.BUSINESS_SUPER_ADMIN;
  }

  return {
    id: userData.id as string,
    name: (userData.fullName as string) || (userData.name as string) || (userData.email as string) || '',
    email: (userData.email as string) || '',
    phone: (userData.contactNumber as string) || (userData.phone as string) || '',
    role,
    businessId,
  };
}

const authApi = {
  /**
   * Customer Login — hits restaurant backend /api/v1/auth/login
   * Stored in kaha_restaurant_db. No external server or OTP needed.
   */
  login: async (contactNumber: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      const response = await localApi.post('/auth/login', { contactNumber, password });
      const data = response.data as Record<string, unknown>;

      const token = (data.accessToken as string) || (data.access_token as string);
      const user = mapUserToFrontend(data.user as Record<string, unknown>, token);

      return { accessToken: token, refreshToken: token, user };
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Login error:', axiosErr.response?.data || error);
      throw new Error(
        (axiosErr.response?.data?.message as string) || 'Invalid contact number or password',
        { cause: error }
      );
    }
  },

  /**
   * Customer Register — hits restaurant backend /api/v1/auth/register
   * Stored in kaha_restaurant_db. No OTP. No external server needed.
   */
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      const response = await localApi.post('/auth/register', {
        fullName: payload.name,
        email: payload.email,
        password: payload.password,
        contactNumber: payload.phone,
      });

      const data = response.data as Record<string, unknown>;
      const token = (data.access_token as string) || (data.accessToken as string);
      const user = mapUserToFrontend(data.user as Record<string, unknown>, token);

      return { accessToken: token, refreshToken: token, user };
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Registration error:', axiosErr.response?.data || error);
      throw new Error(
        (axiosErr.response?.data?.message as string) || 'Registration failed',
        { cause: error }
      );
    }
  },

  /**
   * Admin Login — hits restaurant backend /api/v1/auth/admin-login
   * Restaurant backend validates against production Kaha Main V3.
   */
  adminLogin: async (contactNumber: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
    try {
      const response = await localApi.post('/auth/admin-login', { contactNumber, password });
      const { access_token, refreshToken, user: adminUser } = response.data;

      const mappedUser = {
        id: adminUser.id,
        name: adminUser.fullName || adminUser.name || adminUser.email || 'Administrator',
        email: adminUser.email || '',
        phone: adminUser.contactNumber || adminUser.phone || '',
        role: adminUser.role || 'admin',
        businessId: adminUser.businessId || BUSINESS_ID,
        kahaId: adminUser.kahaId,
      };

      return {
        accessToken: access_token,
        refreshToken: refreshToken || access_token,
        user: mappedUser,
      };
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Admin login error:', axiosErr.response?.data || error);
      throw new Error(
        (axiosErr.response?.data?.message as string) || 'Invalid administrator credentials',
        { cause: error }
      );
    }
  },

  /**
   * Logout — clears local storage
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('kaha_token');
    localStorage.removeItem('kaha_user');
    localStorage.removeItem('kaha_refresh_token');
  },

  /**
   * Verify token — decode JWT locally (no external call needed)
   */
  verifyToken: async (token: string): Promise<User | null> => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
      if (!payload.id) return null;
      return mapUserToFrontend(
        {
          id: payload.id as string,
          role: (payload.role as string) || 'user',
          phone: (payload.phone as string) || '',
        },
        token
      );
    } catch {
      return null;
    }
  },
};

export { authApi };
