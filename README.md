# 💰 Cash Advance Management System - Professional Edition

ប្រព័ន្ធគ្រប់គ្រងលុយឈានមុខដ៏ល្អ ដែលមាន Authentication និង Role-Based Access Control

---

## ✨ Features

✅ **User Authentication** - Username/Password/Email  
✅ **Admin User Management** - Admin កំណត់ role ដល់ users  
✅ **Role-Based Access** - Requestor, Verifier, Approver, Disburser  
✅ **Complete Request Workflow** - Request → Verify → Approve → Disburse  
✅ **Real-time Dashboard** - Statistics និង tracking  
✅ **Secure API** - JWT Token-based authentication  
✅ **Cloud Database** - MongoDB Atlas (Free Tier)  
✅ **24/7 Online** - Cloud Hosting

---

## 📋 Installation

### **ជំហាន 1: ដាក់ Node.js និង npm**

1. ចូលទៅ https://nodejs.org
2. Download LTS version
3. Install ដូចធម្មតា

### **ជំហាន 2: ក្លូន Project**

```bash
git clone <repository-url>
cd cash-advance-system
npm install
```

### **ជំហាន 3: បង្កើត MongoDB Database (Free)**

1. ចូលទៅ https://www.mongodb.com/cloud/atlas
2. ចុច "Sign Up" ឬ "Sign In"
3. បង្កើត Cluster ថ្មី (Free Tier)
4. ធាតុចូលប្រើប្រាស់ (Username/Password)
5. ទទួលបាន Connection String:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/cash-advance?retryWrites=true&w=majority
   ```

### **ជំហាន 4: កំណត់ Environment Variables**

1. បង្កើត `.env` file:
   ```bash
   cp .env.example .env
   ```

2. កែ `.env`:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/cash-advance?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-key-change-this
   PORT=5000
   NODE_ENV=development
   ```

### **ជំហាន 5: ដំឡើង Local**

```bash
# ដាក់ដំឡើងកម្មវិធី
npm install

# ដំណើរការ server
npm start
```

Server នឹងដំណើរការលើ `http://localhost:5000`

ចូលទៅ `index.html` ក្នុង browser របស់អ្នក

---

## 🚀 Deploy ដោយឥតគិតថ្លៃ (Render.com)

### **ជំហាន 1: Upload ទៅ GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push origin main
```

### **ជំហាន 2: Deploy ដោយ Render**

1. ចូលទៅ https://render.com
2. ចុច "Sign Up" ក្រោយ Connect GitHub
3. ចុច "New+" → "Web Service"
4. ជ្រើស Repository របស់អ្នក
5. កំណត់:
   - **Name**: cash-advance-system
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     MONGODB_URI=<your-mongodb-uri>
     JWT_SECRET=<your-secret>
     NODE_ENV=production
     ```
6. ចុច "Create Web Service"

រង់ចាំ 3-5 នាទីដែលវាដាក់ដំឡើង។ URL នឹងលេចឡើង ដូច:
```
https://cash-advance-system.onrender.com
```

### **ជំហាន 3: ធ្វើឱ្យ Frontend ចូលទៅ Backend**

កែ `index.html` line 2:
```javascript
const API_URL = localStorage.getItem('apiUrl') || 'https://cash-advance-system.onrender.com/api';
```

---

## 🔐 Admin Setup

### **ចុងក្រោយ ឯើយក់ Account Admin ដំបូង:**

1. បើក `index.html`
2. ចុច "Register"
3. បង្កើត Account:
   - **Full Name**: Admin
   - **Email**: admin@company.com
   - **Username**: admin
   - **Password**: password123

4. បើក MongoDB:
   - ចូលទៅ Collections
   - រកឹង User ដែលបង្កើត
   - កែ role: `"admin"`

ឬប្រើ MongoDB Compass:
```javascript
db.users.updateOne(
    { username: "admin" },
    { $set: { role: "admin" } }
)
```

---

## 📱 Default Test Accounts

បន្ទាប់ពីដាក់ដំឡើង Admin, ប្រើ Admin ដើម្បីបង្កើត Users:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password123 |
| Requestor | user1 | password123 |
| Verifier | user2 | password123 |
| Approver | user3 | password123 |
| Disburser | user4 | password123 |

---

## 🔄 Workflow

### **ដំណើរការលម្អ:**

1. **Requestor** បង្កើត Request
2. **Verifier** ពិនិត្យលម្អិត → Verify
3. **Approver** ឯកភាព → Approve
4. **Disburser** ផ្តល់លុយ → Disburse
5. **Admin** គ្រប់គ្រង Users

---

## 🛠️ API Endpoints

### **Authentication**
```
POST   /api/auth/register
POST   /api/auth/login
```

### **Users (Admin)**
```
GET    /api/users
POST   /api/users
PUT    /api/users/:userId
DELETE /api/users/:userId
```

### **Requests**
```
GET    /api/requests
POST   /api/requests
PUT    /api/requests/:requestId/verify
PUT    /api/requests/:requestId/approve
PUT    /api/requests/:requestId/disburse
PUT    /api/requests/:requestId/reject
DELETE /api/requests/:requestId
```

### **Dashboard**
```
GET    /api/dashboard/stats
```

---

## 💡 Tips & Troubleshooting

### **MongoDB Connection Error**
- ✅ ពិនិត្យលម្អិត MONGODB_URI ក្នុង .env
- ✅ IP Whitelist: ចូល MongoDB Atlas → Network Access → Add 0.0.0.0/0

### **CORS Error**
- ✅ ធានាថា Frontend এবং Backend URL ត្រឹមត្រូវ
- ✅ CORS ត្រូវបាន Enable ក្នុង server.js

### **Token Expired**
- ✅ Refresh page ដើម្បី Login ឡើងវិញ
- ✅ Token រហូតដល់ 7 ថ្ងៃ

---

## 📞 Support

សម្រាប់ជំនួយ ឬ បញ្ហា សូមទាក់ទងក្រុម IT របស់អ្នក។

---

**Happy Deployment!** 🚀💰
