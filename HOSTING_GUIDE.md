# 🚀 Deploy to Your Paid Hosting Service

Since you have paid hosting, here's how to deploy your Support Ticketing System:

## 🐳 **Docker-based Hosting (Recommended)**

Most paid hosting services support Docker. Use these files:

### **Quick Deploy:**
```bash
# 1. Copy .env.example to .env and configure
cp .env.example .env
nano .env  # Edit with your settings

# 2. Deploy
chmod +x deploy.sh
./deploy.sh
```

## ☁️ **Common Paid Hosting Services:**

### **1. DigitalOcean App Platform**
- Upload your code to GitHub
- Connect repository in DigitalOcean
- Uses `docker-compose.prod.yml` automatically

### **2. AWS Elastic Beanstalk**
- Zip your project
- Upload to Elastic Beanstalk
- Configure environment variables

### **3. Google Cloud Run**
```bash
# Deploy backend
gcloud run deploy backend --source ./backend

# Deploy frontend  
gcloud run deploy frontend --source ./frontend
```

### **4. Azure Container Instances**
```bash
# Create resource group
az group create --name ticketing-rg --location eastus

# Deploy containers
az container create --resource-group ticketing-rg --file docker-compose.prod.yml
```

### **5. Heroku (Container Registry)**
```bash
# Login to Heroku
heroku login
heroku container:login

# Deploy backend
heroku create your-app-backend
heroku container:push web --app your-app-backend -v
heroku container:release web --app your-app-backend

# Deploy frontend
heroku create your-app-frontend
heroku container:push web --app your-app-frontend -v
heroku container:release web --app your-app-frontend
```

## 🔧 **Configuration Steps:**

### **1. Environment Variables**
Set these in your hosting service:
```bash
ASPNETCORE_ENVIRONMENT=Production
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourcompany.com
JWT_SECRET=your-secure-secret-key
```

### **2. Domain Configuration**
Update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api'
};
```

### **3. Email Setup (Gmail)**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use in SMTP_PASSWORD

## 🎯 **What You Get:**

✅ **Professional deployment** ready for production
✅ **Docker containers** for easy scaling
✅ **Email notifications** fully configured
✅ **Database persistence** with volumes
✅ **Automatic restarts** if containers fail
✅ **Environment-based configuration**

## 📋 **Demo Accounts:**
- **👑 Admin**: admin@demo.com / password
- **📝 Applier**: applier@demo.com / password  
- **📋 Receiver**: receiver@demo.com / password

## 🆘 **Need Help?**

Tell me which hosting service you're using, and I'll provide specific deployment instructions!

**Common services:**
- DigitalOcean
- AWS
- Google Cloud
- Azure
- Heroku
- VPS/Dedicated Server