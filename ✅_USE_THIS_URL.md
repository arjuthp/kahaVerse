# ✅ USE THIS URL - Frontend is on Port 5173!

## 🎯 CORRECT URLs (Port 5173)

### Admin Login:
```
http://localhost:5173/admin/login
```

### Customer Home:
```
http://localhost:5173/
```

### Menu:
```
http://localhost:5173/menu
```

---

## ⚠️ Why Port 5173, Not 5174?

When you started the frontend, it successfully started on port **5173** (the default Vite port).

Earlier I mentioned 5174 because Vite said "Port 5173 is in use, trying another one..." but it seems the process on 5173 was cleared and now your frontend is running on 5173.

---

## 🧪 Quick Test

### Open Admin Login:
```
http://localhost:5173/admin/login
```

### Login with:
```
Email:    admin@kahastays.com
Password: password123
```

---

## 🔍 Verify Which Port You're Using

Run this command:
```bash
lsof -i :5173 -i :5174 | grep LISTEN
```

**Current result:** Frontend is on port **5173**

---

## ✅ Correct URLs Summary

| Purpose | URL |
|---------|-----|
| **Admin Login** | http://localhost:5173/admin/login |
| **Customer Home** | http://localhost:5173/ |
| **Menu** | http://localhost:5173/menu |
| **Customer Login** | http://localhost:5173/login |
| **Backend API** | http://localhost:3001/api/v1 |

---

**Status:** ✅ Frontend running on port 5173
**Admin Login:** http://localhost:5173/admin/login
