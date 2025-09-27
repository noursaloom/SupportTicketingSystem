# 🚀 Deployment Guide - Support Ticketing System

This guide provides multiple deployment options for your team to test the Support Ticketing System.

## 📋 Demo Accounts

Once deployed, your team can test with these accounts:

- **👑 Admin**: `admin@demo.com` / `password` (Full system access)
- **📝 Ticket Applier**: `applier@demo.com` / `password` (Create tickets)
- **📋 Ticket Receiver**: `receiver@demo.com` / `password` (Manage tickets)
- **👤 Legacy User**: `user@demo.com` / `password` (Basic access)

## 🐳 Quick Local Deployment (Recommended for Team Testing)

### Option 1: Docker Compose (Easiest)
```bash
# Clone the repository
git clone <your-repo-url>
cd SupportTicketingSystem

# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Documentation: http://localhost:5000/swagger
```

### Option 2: Manual Setup
```bash
# Backend
cd backend
dotnet restore
dotnet ef database update
dotnet run

# Frontend (new terminal)
cd frontend
npm install
ng serve

# Access at http://localhost:4200
```

## ☁️ Cloud Deployment Options

### 🚂 Railway (Recommended - Free & Easy)

1. **Sign up**: Go to [railway.app](https://railway.app)
2. **Deploy**: Connect your GitHub repo
3. **Configure**: Railway will auto-detect the `railway.json` config
4. **Access**: Get your public URL from Railway dashboard

**Pros**: Free tier, automatic HTTPS, easy setup
**Cons**: Limited free hours per month

### 🎨 Render (Great for Full-Stack Apps)

1. **Sign up**: Go to [render.com](https://render.com)
2. **Deploy**: Use the `render.yaml` configuration
3. **Configure**: Set environment variables in Render dashboard
4. **Access**: Get your public URLs

**Pros**: Free tier, good for databases, automatic deployments
**Cons**: Slower cold starts on free tier

### 🌐 Netlify + Heroku (Frontend + Backend)

#### Frontend on Netlify:
1. **Sign up**: Go to [netlify.com](https://netlify.com)
2. **Deploy**: Drag & drop the `frontend/dist` folder or connect GitHub
3. **Configure**: Uses `netlify.toml` configuration
4. **Update API URL**: Set your backend URL in environment variables

#### Backend on Heroku:
1. **Sign up**: Go to [heroku.com](https://heroku.com)
2. **Create App**: `heroku create your-app-name`
3. **Deploy**: Uses `heroku.yml` configuration
4. **Database**: Heroku will provide PostgreSQL (update connection string)

### ⚡ Vercel (Frontend Only)

1. **Sign up**: Go to [vercel.com](https://vercel.com)
2. **Deploy**: Connect GitHub repo
3. **Configure**: Uses `vercel.json` configuration
4. **Backend**: Deploy backend separately (Railway/Render/Heroku)

## 🔧 Configuration for Production

### Environment Variables to Set:

#### Backend:
```bash
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<your-db-connection>
JwtSettings__SecretKey=<secure-random-key>
EmailSettings__SmtpUsername=<your-email>
EmailSettings__SmtpPassword=<your-password>
EmailSettings__EnableEmailNotifications=true
```

#### Frontend:
```bash
VITE_API_URL=<your-backend-url>/api
```

## 📧 Email Configuration (Optional)

To enable email notifications:

1. **Gmail Setup**:
   - Enable 2FA on your Gmail account
   - Generate an App Password
   - Use these settings:
     ```json
     {
       "SmtpServer": "smtp.gmail.com",
       "SmtpPort": 587,
       "SmtpUsername": "your-email@gmail.com",
       "SmtpPassword": "your-app-password",
       "EnableSsl": true,
       "EnableEmailNotifications": true
     }
     ```

2. **Other Providers**:
   - **Outlook**: `smtp-mail.outlook.com:587`
   - **SendGrid**: `smtp.sendgrid.net:587`
   - **Mailgun**: `smtp.mailgun.org:587`

## 🧪 Testing Checklist

Once deployed, test these features:

### ✅ Authentication
- [ ] Login with demo accounts
- [ ] Register new account
- [ ] Logout functionality

### ✅ Ticket Management
- [ ] Create new ticket
- [ ] View ticket list
- [ ] Edit ticket details
- [ ] Assign tickets (Admin/Receiver)
- [ ] Change ticket status

### ✅ Notifications
- [ ] Bell icon shows unread count
- [ ] Notification dropdown works
- [ ] Click notification navigates to ticket
- [ ] Mark as read functionality

### ✅ Admin Features (Admin account only)
- [ ] User management (create/edit/delete users)
- [ ] Project management (create/edit/delete projects)
- [ ] Assign users to projects

### ✅ Email Notifications (if configured)
- [ ] New ticket creation emails
- [ ] Status change emails
- [ ] Assignment emails
- [ ] New user account emails

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**: Update backend CORS policy with your frontend URL
2. **Database Issues**: Check connection string and ensure migrations ran
3. **Email Not Working**: Verify SMTP settings and credentials
4. **404 Errors**: Ensure frontend routing is configured for SPA

### Support:
- Check browser console for frontend errors
- Check backend logs for API errors
- Verify environment variables are set correctly

## 🎯 Recommended for Team Testing

**Best Option**: **Railway** or **Render** for full-stack deployment
- Easy setup
- Free tier available
- Automatic HTTPS
- Good for team collaboration

**Alternative**: **Docker Compose locally** on a shared server
- Full control
- No external dependencies
- Can be accessed by team on local network