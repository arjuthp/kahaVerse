# How to Get Credentials for Postman Testing

## 🎯 The 3 Servers You Need

| Server | Purpose | Port | URL |
|--------|---------|------|-----|
| **Frontend UI** | Restaurant E-commerce Client | 5173 or 5174 | `http://localhost:5173` |
| **Restaurant API** | Backend API Being Tested | 3001 | `http://localhost:3001/api/v1` |
| **Kaha Main V3** | Auth Service (External) | 3002 or 5002 | `http://localhost:3002/api/v3` |
| **Database** | PostgreSQL/MySQL | 5432 | `localhost:5432` |

---

## 📋 Step 1: Check Kaha Main V3 is Running

```bash
# First, go to Kaha Main folder
cd /home/kali/Documents/KAHA_Verse/Documents/kaha-main-api-v3

# Check if it's running (port might be 3002 or 5002)
curl http://localhost:3002/api/v3/health
# OR
curl http://localhost:5002/api/v3/health
```

If you see a response like `{"status":"ok"}` ✅ it's running!

**If not running, start it:**
```bash
npm run dev
# OR
npm start
```

---

## 🔐 Step 2: Get Your Credentials

### Option A: Using Curl (Simple)

```bash
# Login to Kaha Main V3
curl -X POST http://localhost:3002/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kaha.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-abc-123",
    "email": "admin@kaha.com",
    "businessId": "biz-xyz-789"
  }
}
```

**Copy these values:**
- `token` → your `authToken`
- `user.id` → your `userId`  
- `user.businessId` → your `businessId`

### Option B: Direct Database Query

If you have database access, query directly:

```bash
# Connect to database
mysql -u root -p kaha_main

# Find test user
SELECT id, email, business_id FROM users WHERE email = 'test@kaha.com' LIMIT 1;

# Result:
# id: user-abc-123
# business_id: biz-xyz-789
```

---

## 🎨 Step 3: Update Postman Environment

1. Open Postman
2. Click **Environments** → **Kaha-Restaurant-Environment**
3. Edit these values:

```
baseUrl = http://localhost:3001/api/v1
authToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
userId = user-abc-123
businessId = biz-xyz-789
```

4. Click **Save**

---

## ✅ Step 4: Test It Works

```bash
# Get current user info to verify token works
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Should return your user info ✅

---

## 🗄️ Step 5: Use Database IDs (Optional)

Yes! You can query the Kaha Main V3 database directly:

```bash
# Connect to database
mysql -u root -p your_database_name

# Get all users with business
SELECT u.id as userId, u.email, b.id as businessId, b.name 
FROM users u 
JOIN businesses b ON u.business_id = b.id 
LIMIT 5;

# Get test/mock users
SELECT * FROM users WHERE email LIKE '%test%' OR email LIKE '%mock%';
```

Then use these IDs directly in Postman!

---

## 🐛 Troubleshooting

### Issue: Connection refused at port 3002

**Solution 1:** Check if Kaha Main is running
```bash
ps aux | grep node
# Look for kaha-main process
```

**Solution 2:** Find the correct port
```bash
# Check what port is listening
netstat -tulpn | grep LISTEN | grep node
```

**Solution 3:** Start Kaha Main
```bash
cd /home/kali/Documents/KAHA_Verse/Documents/kaha-main-api-v3
npm run dev
```

### Issue: "Invalid credentials"

**Solution:** Make sure you're using correct credentials:
- Email must exist in Kaha Main database
- Password must be correct
- Try with `admin@kaha.com` / `password123` (default test user)

### Issue: "Token expired"

**Solution:** Get a new token by running login again

---

## 🎯 Complete Workflow Example

```bash
# 1. Start Kaha Main (if not running)
cd ../kaha-main-api-v3
npm run dev &

# 2. Wait 5 seconds for startup
sleep 5

# 3. Get credentials
curl -X POST http://localhost:3002/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kaha.com","password":"password123"}'

# 4. Copy: token, user.id, user.businessId
# 5. Paste in Postman environment
# 6. Open Postman and test!
```

---

## 📌 Quick Reference

**Kaha Main V3 URLs:**
- Health Check: `http://localhost:3002/api/v3/health`
- Login: `http://localhost:3002/api/v3/auth/login`
- Get Me: `http://localhost:3002/api/v3/auth/me`

**Restaurant API URLs:**
- Health: `http://localhost:3001/api/v1`
- Categories: `http://localhost:3001/api/v1/categories`
- Menu: `http://localhost:3001/api/v1/menu`
- etc.

**Test Credentials (usually):**
- Email: `admin@kaha.com`
- Password: `password123`

---

## ✨ Done!

Now you have:
- ✅ `authToken` - JWT from Kaha Main
- ✅ `userId` - Your user ID
- ✅ `businessId` - Your restaurant business ID
- ✅ Postman ready to test!

Go to Postman and click **Send** on any request! 🚀

