# 🎨 Frontend Integration Fix - Connect to Kaha Main V3

## 🚨 Current Problem

The frontend is using **mock authentication** with hardcoded JWT tokens instead of calling the real Kaha Main V3 API for login.

### Current Flow (WRONG):
```
User enters credentials
  ↓
Frontend generates mock JWT token (hardcoded)
  ↓
Frontend stores token in localStorage
  ↓
Backend receives token but can't verify role with Kaha Main V3
```

### Correct Flow (NEEDED):
```
User enters credentials
  ↓
Frontend calls Kaha Main V3 login API
  ↓
Kaha Main V3 returns real JWT token
  ↓
Frontend stores token in localStorage
  ↓
Backend receives token and verifies role with Kaha Main V3
```

---

## 🔍 Issues Found in Frontend

### 1. **Mock Authentication in `auth.api.ts`**

**Location:** `src/api/auth.api.ts`

**Problem:**
```typescript
// ❌ Hardcoded mock tokens
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ❌ Returns mock token instead of calling API
login: async (email: string, password: string): Promise<AuthResponse> => {
  return {
    accessToken: USER_TOKEN, // Hardcoded!
    refreshToken: 'mock-refresh-token',
    user: { ... }
  };
}
```

---

### 2. **Vite Proxy Configuration Issue**

**Location:** `vite.config.ts`

**Current:**
```typescript
'/api/v1/auth': {
  target: 'http://localhost:3002', // ❌ Wrong port
  changeOrigin: true,
  rewrite: (path) => path.replace('/api/v1/auth', '/api/auth'),
}
```

**Problem:** 
- Points to port 3002 (doesn't exist)
- Should point to Kaha Main V3 production URL

---

### 3. **Environment Variables**

**Location:** `.env`

**Current:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_API_URL=http://localhost:3001  # ❌ Wrong
VITE_BUSINESS_ID=biz-mock-001
```

**Missing:**
- Kaha Main V3 API URL
- Proper business ID from Kaha Main V3

---

## ✅ Solution: Update Frontend to Use Real Authentication

### Step 1: Update `.env` File

**File:** `/home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend/.env`

```env
# Backend API (Restaurant E-Commerce)
VITE_API_BASE_URL=http://localhost:3001

# Kaha Main V3 API (for authentication)
VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3

# Business ID from Kaha Main V3
VITE_BUSINESS_ID=00000000-0000-4000-a000-000000000100
```

---

### Step 2: Update `vite.config.ts`

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth calls → Kaha Main V3 (production)
      '/api/v1/auth': {
        target: 'https://api.kaha.com.np/main/api/v3',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace('/api/v1/auth', '/auth'),
      },
      // Everything else → Restaurant E-Commerce Backend (NestJS)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

---

### Step 3: Create Real Authentication API

**File:** `src/api/auth.api.ts`

Replace the entire file with:

```typescript
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
```

---

### Step 4: Update `axios.ts` (Optional Enhancement)

**File:** `src/api/axios.ts`

Add token refresh logic:

```typescript
import axios from 'axios';

const BASE_URL = '/api/v1'; // Proxied by Vite to http://localhost:3001/api/v1

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kaha_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Authentication failed. Redirecting to login...');
      localStorage.removeItem('kaha_token');
      localStorage.removeItem('kaha_user');
      localStorage.removeItem('kaha_refresh_token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 🧪 Testing the Integration

### Test 1: Customer Login

```bash
# Start frontend
cd /home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
npm run dev
```

1. Open http://localhost:5173/login
2. Enter credentials:
   - Email: `user@example.com` (create in Kaha Main V3 first)
   - Password: `password123`
3. Click "Sign In"
4. Check browser console for API calls
5. Check localStorage for `kaha_token`

---

### Test 2: Admin Login

1. Open http://localhost:5173/admin/login
2. Enter credentials:
   - Email: `admin@kahastays.com`
   - Password: `password123`
3. Click "Sign In"
4. Should redirect to admin dashboard
5. Try creating a menu item

---

### Test 3: Verify Token in Backend

Open browser DevTools → Application → Local Storage:
- Copy `kaha_token` value
- Decode at https://jwt.io
- Verify payload contains: `id`, `kahaId`, `businessId`

---

## 🔍 Debugging Frontend Issues

### Issue 1: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest at 'https://api.kaha.com.np/main/api/v3/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
The Vite proxy should handle this. Verify `vite.config.ts` is correct and restart dev server.

---

### Issue 2: 404 Not Found on Login

**Symptoms:**
```
POST http://localhost:5173/api/v1/auth/login 404 (Not Found)
```

**Cause:** Vite proxy not configured correctly

**Solution:**
```typescript
// In vite.config.ts
'/api/v1/auth': {
  target: 'https://api.kaha.com.np/main/api/v3',
  changeOrigin: true,
  secure: true,
  rewrite: (path) => path.replace('/api/v1/auth', '/auth'),
}
```

---

### Issue 3: "Invalid credentials" but credentials are correct

**Cause:** Kaha Main V3 API might be down or credentials don't exist

**Solution:**
Test directly:
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kahastays.com","password":"password123"}'
```

---

### Issue 4: Token works but backend rejects requests

**Cause:** Backend can't verify role with Kaha Main V3

**Solution:**
1. Verify backend `.env` has correct `KAH_API_V3_BASE_URL`
2. Check backend logs for external API call errors
3. Ensure `USE_MOCK_AUTH=false` in backend

---

## 📋 Complete Testing Checklist

### Frontend
- [ ] `.env` updated with Kaha Main V3 URL
- [ ] `vite.config.ts` proxy configured
- [ ] `auth.api.ts` calls real API (not mock)
- [ ] Dev server restarted
- [ ] Can login with Kaha Main V3 credentials
- [ ] Token stored in localStorage
- [ ] Token is valid JWT from Kaha Main V3

### Backend
- [ ] `USE_MOCK_AUTH=false` in `.env`
- [ ] `KAH_API_V3_BASE_URL` correct
- [ ] Backend restarted
- [ ] Logs show "Production Mode"
- [ ] External API calls to Kaha Main V3 working

### Integration
- [ ] Customer can login and view menu
- [ ] Customer cannot create menu items (403)
- [ ] Admin can login and create menu items
- [ ] Backend verifies roles with Kaha Main V3
- [ ] Token refresh works (if implemented)

---

## 🎯 Expected Behavior After Fix

### Customer Flow:
1. ✅ Login with Kaha Main V3 credentials
2. ✅ Receive real JWT token
3. ✅ Can view menu, add to cart
4. ✅ Cannot access admin functions (403)

### Admin Flow:
1. ✅ Login with admin credentials
2. ✅ Receive JWT with admin role
3. ✅ Backend verifies role with Kaha Main V3
4. ✅ Can create/update/delete menu items
5. ✅ All CRUD operations work

---

## 🚀 Quick Implementation

Run these commands to apply the fix:

```bash
# 1. Update frontend .env
cd /home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3
VITE_BUSINESS_ID=00000000-0000-4000-a000-000000000100
EOF

# 2. Backup old auth.api.ts
cp src/api/auth.api.ts src/api/auth.api.ts.backup

# 3. Update vite.config.ts (manual edit required)
# See Step 2 above

# 4. Update auth.api.ts (manual edit required)
# See Step 3 above

# 5. Restart frontend
npm run dev
```

---

**Status:** Ready for implementation
**Priority:** HIGH - Required for production authentication
