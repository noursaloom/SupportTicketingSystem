# 🚀 How to Publish Your Support Ticketing System

## 📦 **Quick Publish (All Platforms)**

### **1. Build Everything**
```bash
chmod +x publish.sh
./publish.sh
```

This creates a `publish/` folder with everything ready to deploy!

## 🌐 **Publishing Options**

### **Option 1: 🐳 Docker (Easiest)**
```bash
# After running publish.sh
cd publish
docker-compose -f docker-compose.prod.yml up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### **Option 2: 📱 Netlify (Frontend)**
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop `publish/frontend/` folder
3. Or connect GitHub and use `netlify-publish.toml`

### **Option 3: ⚡ Vercel (Frontend)**
1. Go to [vercel.com](https://vercel.com)
2. Connect GitHub repository
3. Uses `vercel-publish.json` automatically

### **Option 4: 🚂 Railway (Full Stack)**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Auto-deploys using `railway-publish.json`

### **Option 5: 🟣 Heroku (Full Stack)**
```bash
# Install Heroku CLI
heroku create your-app-name
git push heroku main
```

### **Option 6: 💰 Your Paid Hosting**
Upload these files to your hosting service:
- **Frontend files**: `publish/frontend/` → Upload to web root
- **Backend files**: `publish/backend/` → Deploy to server
- **Database**: SQLite file included

## 🔧 **Configuration**

### **Environment Variables**
Set these in your hosting service:
```bash
ASPNETCORE_ENVIRONMENT=Production
VITE_API_URL=https://your-domain.com/api
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### **Domain Setup**
Update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api'
};
```

## 🎮 **Demo Accounts**
Share these with your team:
- **👑 Admin**: admin@demo.com / password
- **📝 Ticket Applier**: applier@demo.com / password
- **📋 Ticket Receiver**: receiver@demo.com / password

## 📧 **Email Setup (Optional)**
For email notifications:
1. Get Gmail App Password
2. Set SMTP_USERNAME and SMTP_PASSWORD
3. Restart application

## 🆘 **Need Help?**
Tell me which hosting service you're using and I'll provide specific instructions!

## 📊 **What You Get**
✅ Professional ticketing system
✅ User management
✅ Project management  
✅ Real-time notifications
✅ Email notifications
✅ Role-based access control
✅ Responsive design
✅ Production-ready