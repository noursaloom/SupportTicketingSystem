#!/bin/bash

echo "🚀 Deploying Support Ticketing System..."

# Build and start containers
echo "📦 Building Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 API Documentation: http://localhost:5000/swagger"

echo ""
echo "Demo Accounts:"
echo "👑 Admin: admin@demo.com / password"
echo "📝 Ticket Applier: applier@demo.com / password"
echo "📋 Ticket Receiver: receiver@demo.com / password"
echo "👤 Legacy User: user@demo.com / password"