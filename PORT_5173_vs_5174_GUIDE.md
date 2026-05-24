# 🔌 Frontend Port Guide - 5173 vs 5174

## 🎯 Quick Answer

**Both ports work fine!** Vite automatically uses port 5174 if 5173 is busy. Your system will work on either port.

---

## ✅ Current Situation

Your frontend is running on **port 5174** because:
- Port 5173 was in use when you started `npm run dev`
- Vite automatically picked the next available port (5174)
- This is normal Vite behavior

**Access your frontend at:** http://localhost:5174

---

## 🔧 Option 1: Use Port 5174 (No Action Needed)

Everything works on port 5174. Just use:
- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:3001/api/v1

The Vite proxy configuration works the same on any port.

---

## 🔧 Option 2: Force Port 5173

If you prefer to always use port 5173:

### Step 1: Kill Any Process on 5173
```bash
# Check what's using port 5173
lsof -i :5173

# Kill it
kill -9 $(lsof -t -i:5173)
```

### Step 2: Stop Current Frontend (on 5174)
```bash
# Find the process
ps aux | grep vite

# Kill it (use the PID from above)
kill -9 <PID>

# Or kill all Vite processes
pkill -f vite
```

### Step 3: Restart Frontend
```bash
cd /home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
npm run dev
```

It should now start on port 5173.

---

## 🔧 Option 3: Configure Fixed Port in Vite

To always use port 5173 (and fail if it's busy):

### Edit `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,           // ✅ Fixed port
    strictPort: true,     // ✅ Fail if port is busy (don't auto-switch)
    proxy: {
      '/api/v1/auth': {
        target: 'https://api.kaha.com.np/main/api/v3',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace('/api/v1/auth', '/auth'),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 🧪 Testing on Port 5174

Everything works the same on port 5174:

### Test 1: Access Frontend
```bash
# Open in browser
xdg-open http://localhost:5174
```

### Test 2: Test API Proxy
```bash
# The proxy still works
curl http://localhost:5174/api/v1/menu/biz-mock-001
```

### Test 3: Login
1. Go to http://localhost:5174/admin/login
2. Email: `admin@kahastays.com`
3. Password: `password123`
4. Should work perfectly!

---

## 🔍 Why Did This Happen?

### Common Causes:
1. **Previous Vite process didn't close properly**
   - You ran `npm run dev` before
   - Pressed Ctrl+C but process didn't fully terminate
   - Port 5173 remained occupied

2. **Another application using port 5173**
   - Another dev server
   - Another Vite project
   - System service

3. **Zombie process**
   - Process crashed but didn't release port
   - Need to manually kill it

---

## 🛠️ Troubleshooting

### Check What's Using Port 5173
```bash
lsof -i :5173
```

**Output examples:**

**If port is free:**
```
(no output)
```

**If port is busy:**
```
COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    12345  kali   23u  IPv4 123456      0t0  TCP *:5173 (LISTEN)
```

---

### Kill Process on Port 5173
```bash
# Method 1: Kill by port
kill -9 $(lsof -t -i:5173)

# Method 2: Kill by process name
pkill -f vite

# Method 3: Kill specific PID
kill -9 12345  # Replace with actual PID
```

---

### Verify Port is Free
```bash
lsof -i :5173
# Should show nothing

# Or check with netstat
netstat -tuln | grep 5173
# Should show nothing
```

---

## 📊 Port Comparison

| Aspect | Port 5173 | Port 5174 |
|--------|-----------|-----------|
| **Functionality** | ✅ Full | ✅ Full |
| **Vite Proxy** | ✅ Works | ✅ Works |
| **Authentication** | ✅ Works | ✅ Works |
| **API Calls** | ✅ Works | ✅ Works |
| **Default Port** | ✅ Yes | ⚠️ Fallback |

**Conclusion:** Both ports work identically!

---

## 🚀 Recommended Approach

### For Development (Current Situation):
**Use port 5174** - It's already running and works perfectly.

### For Production:
Configure a fixed port in your deployment configuration.

### For Team Development:
Document that the frontend runs on port 5173 by default, but may use 5174 if 5173 is busy.

---

## 📝 Update Documentation URLs

If you want to standardize on 5174, update these files:

### 1. README Files
Replace all instances of:
- `http://localhost:5173` → `http://localhost:5174`

### 2. Environment Variables
No changes needed - the port is not in `.env`

### 3. Vite Config
Add `port: 5174` if you want to make it default

---

## ✅ Quick Fix Commands

### Restart on Port 5173
```bash
# Kill everything
pkill -f vite
kill -9 $(lsof -t -i:5173) 2>/dev/null
kill -9 $(lsof -t -i:5174) 2>/dev/null

# Wait a moment
sleep 2

# Restart
cd /home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
npm run dev
```

### Keep Using Port 5174
```bash
# Do nothing! It's already working.
# Just use http://localhost:5174
```

---

## 🎯 Bottom Line

**Your system is working correctly on port 5174.**

You have three options:
1. ✅ **Keep using 5174** (easiest, no changes needed)
2. 🔄 **Switch to 5173** (kill processes and restart)
3. 🔧 **Configure fixed port** (edit vite.config.ts)

**Recommendation:** Keep using 5174 for now. It works perfectly!

---

## 📞 Still Having Issues?

### Check Both Ports
```bash
# Check 5173
curl http://localhost:5173

# Check 5174
curl http://localhost:5174
```

### Check Vite Process
```bash
ps aux | grep vite
```

### Check Logs
```bash
# If using startup script
tail -f /tmp/kaha-frontend.log

# Or check terminal output where you ran npm run dev
```

---

**Status:** ✅ Frontend working on port 5174
**Action Required:** None (or switch to 5173 if preferred)
**Impact:** Zero - both ports work identically
