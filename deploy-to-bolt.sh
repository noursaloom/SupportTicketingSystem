#!/bin/bash

echo "🚀 Building and Deploying Support Ticketing System..."

# Build Frontend
echo "📦 Building Angular frontend..."
cd frontend
npm install
npm run build --prod
cd ..

# Build Backend
echo "🔧 Building .NET backend..."
cd backend/SupportTicketingSystem.Api
dotnet restore
dotnet publish -c Release -o ./publish
cd ../..

echo "✅ Build completed!"
echo ""
echo "📁 Built files locations:"
echo "   Frontend: ./frontend/dist/support-ticketing-frontend/"
echo "   Backend: ./backend/SupportTicketingSystem.Api/publish/"
echo ""
echo "🌐 Deploy to your hosting service using these built files"
echo ""
echo "🎮 Demo Accounts:"
echo "   👑 Admin: admin@demo.com / password"
echo "   📝 Ticket Applier: applier@demo.com / password"
echo "   📋 Ticket Receiver: receiver@demo.com / password"