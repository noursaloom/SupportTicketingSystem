# 🚀 Deployment Instructions

Since you want to deploy your Support Ticketing System, here are the proper deployment methods:

## 🎯 **Quick Deployment Options:**

### **1. 🐳 Docker (Recommended)**
```bash
# Build and run everything
docker-compose up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### **2. 📦 Manual Build & Deploy**
```bash
# Run the build script
chmod +x deploy-to-bolt.sh
./deploy-to-bolt.sh

# This creates:
# - frontend/dist/support-ticketing-frontend/ (Upload to static hosting)
# - backend/SupportTicketingSystem.Api/publish/ (Upload to server)
```

### **3. ☁️ Cloud Hosting Services**

#### **Netlify (Frontend)**
1. Drag & drop `frontend/dist/support-ticketing-frontend/` to Netlify
2. Or connect GitHub and use `netlify-deploy.toml`

#### **Vercel (Frontend)**
1. Connect GitHub repository
2. Uses `vercel-deploy.json` configuration

#### **Heroku (Backend)**
```bash
# Deploy backend to Heroku
heroku create your-app-backend
git subtree push --prefix backend heroku main
```

#### **Railway (Full Stack)**
1. Go to railway.app
2. Connect GitHub repository
3. Auto-deploys both frontend and backend

## 🌐 **Access URLs:**

After deployment, you'll get URLs like:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.herokuapp.com`

## 🎮 **Demo Accounts:**
- **👑 Admin**: admin@demo.com / password
- **📝 Ticket Applier**: applier@demo.com / password
- **📋 Ticket Receiver**: receiver@demo.com / password

## 🔧 **Environment Variables:**

Set these in your hosting service:
```
ASPNETCORE_ENVIRONMENT=Production
VITE_API_URL=https://your-backend-url.com/api
```

## 🆘 **Need Help?**

Tell me which hosting service you want to use, and I'll provide specific instructions!