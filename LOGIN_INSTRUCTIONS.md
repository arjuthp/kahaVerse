# 🔐 How to Login to Admin Dashboard

## ❌ Problem: Redirected to Admin Sign Up Page

This happens when:
- You're not logged in
- Your token expired
- Token is missing from localStorage

---

## ✅ Solution: Login with Mock Login Page

### Step 1: Open Mock Login Page
The page should have opened automatically. If not:
```
file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html
```

Or run:
```bash
xdg-open file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html
```

### Step 2: Select "Business Admin"
Click on the **"Business Admin"** card (the middle one)

### Step 3: Click "Login as Business Admin"
The button will appear after you select the user type

### Step 4: Wait for Redirect
You'll be automatically redirected to: `http://localhost:5173/admin`

---

## 🎯 What Happens When You Login

1. **Token is saved** to localStorage
2. **User data is saved** to localStorage
3. **You're redirected** to `/admin` dashboard
4. **You can now** create categories, menu items, etc.

---

## 🔑 Your Login Credentials

### Business Admin (Recommended)
- **Email:** admin@test.com
- **Role:** BUSINESS_SUPER_ADMIN
- **Business ID:** biz-mock-001
- **Token:** Valid for 30 days

### What You Can Do:
- ✅ Create categories
- ✅ Add menu items
- ✅ Manage orders
- ✅ View analytics
- ✅ All admin features

---

## 🧪 Verify You're Logged In

After logging in, open browser console (F12) and run:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('kaha_token'));

// Check if user data exists
console.log('User:', localStorage.getItem('kaha_user'));
```

**Expected Result:**
- Token: Should show a long JWT string
- User: Should show JSON with your user data

---

## 🔄 If You're Already on Admin Dashboard

If you're already on `http://localhost:5173/admin` but getting redirected:

### Option 1: Use Mock Login Page (Recommended)
1. Open: `file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html`
2. Select "Business Admin"
3. Click "Login"

### Option 2: Manual Token Setup (Advanced)
1. Open browser console (F12)
2. Paste this code:

```javascript
// Business Admin Token
localStorage.setItem('kaha_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTYwMTk5NywiZXhwIjoxNzgyMTkzOTk3fQ.ugCTcsykEiGgppBCz3GFfBtA_069Hu7NmKFg2-BGsaw');

// Business Admin User Data
localStorage.setItem('kaha_user', '{"id":"admin-mock-001","kahaId":"kaha-admin-001","businessId":"biz-mock-001","email":"admin@test.com","role":"BUSINESS_SUPER_ADMIN"}');

// Reload page
location.reload();
```

3. Press Enter
4. Page will reload with admin access

---

## 🚨 Common Issues

### Issue 1: "Redirected to sign up page"
**Cause:** Not logged in or token expired  
**Solution:** Use mock login page

### Issue 2: "Token exists but still redirected"
**Cause:** Token format is wrong or user data is missing  
**Solution:** Clear localStorage and login again:
```javascript
localStorage.clear();
location.reload();
```
Then use mock login page

### Issue 3: "Login button doesn't work"
**Cause:** JavaScript error or page not loaded  
**Solution:** 
1. Refresh the mock login page (F5)
2. Try again
3. Check browser console for errors

---

## 📋 Step-by-Step Login Process

### Visual Guide:

```
1. Open Mock Login Page
   ↓
2. You see 3 user cards:
   - Regular User (Customer)
   - Business Admin ← SELECT THIS
   - Business Owner
   ↓
3. Click on "Business Admin" card
   (Card will turn purple/highlighted)
   ↓
4. Button appears: "Login as Business Admin"
   ↓
5. Click the button
   ↓
6. Success message appears
   ↓
7. Redirected to: http://localhost:5173/admin
   ↓
8. You see Admin Dashboard with sidebar
   ✅ You're logged in!
```

---

## ✅ After Successful Login

You should see:
- ✅ Admin Dashboard at `/admin`
- ✅ Sidebar with: Overview, Orders, Menu, Categories, Users
- ✅ Your name in bottom left: "Administrator"
- ✅ No redirect to sign up page

Now you can:
- ✅ Click "Categories Control" tab
- ✅ Click "Add Category" button
- ✅ Fill in category details
- ✅ Save successfully

---

## 🔗 Quick Links

- **Mock Login Page:** `file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html`
- **Admin Dashboard:** `http://localhost:5173/admin`
- **Customer Homepage:** `http://localhost:5173/`

---

## 📞 Need Help?

If you're still having issues:

1. **Clear browser cache and cookies**
2. **Close all browser tabs**
3. **Open mock login page in new tab**
4. **Login again**

---

**Use the mock login page that just opened to login as Business Admin!** 🚀
