#!/bin/bash

echo "🚀 Publishing Support Ticketing System..."

# Create publish directory
mkdir -p publish

echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🔧 Building Backend..."
cd backend/SupportTicketingSystem.Api
dotnet restore
dotnet publish -c Release -o ../../publish/backend
cd ../..

echo "📁 Copying Frontend..."
cp -r frontend/dist/support-ticketing-frontend/* publish/frontend/ 2>/dev/null || mkdir -p publish/frontend && cp -r frontend/dist/support-ticketing-frontend/* publish/frontend/

echo "📋 Creating deployment files..."
cp docker-compose.prod.yml publish/
cp .env.example publish/
cp README.md publish/

echo "✅ Build Complete!"
echo ""
echo "📂 Published files are in: ./publish/"
echo "   📱 Frontend: ./publish/frontend/"
echo "   🔧 Backend: ./publish/backend/"
echo ""
echo "🌐 Deployment Options:"
echo "   1. Upload to your hosting service"
echo "   2. Use Docker: docker-compose -f publish/docker-compose.prod.yml up -d"
echo "   3. Deploy to cloud platforms"
echo ""
echo "🎮 Demo Accounts:"
echo "   👑 Admin: admin@demo.com / password"
echo "   📝 Applier: applier@demo.com / password"
echo "   📋 Receiver: receiver@demo.com / password"