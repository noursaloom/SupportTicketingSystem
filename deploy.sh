#!/bin/bash

echo "🚀 Deploying Support Ticketing System to Your Hosting..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

echo "📦 Building and deploying containers..."

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   API Documentation: http://localhost:5000/swagger"
echo ""
echo "📋 Demo Accounts:"
echo "   👑 Admin: admin@demo.com / password"
echo "   📝 Ticket Applier: applier@demo.com / password"
echo "   📋 Ticket Receiver: receiver@demo.com / password"
echo "   👤 Legacy User: user@demo.com / password"
echo ""
echo "📧 To enable email notifications:"
echo "   1. Configure SMTP settings in your .env file"
echo "   2. Restart the containers: docker-compose -f docker-compose.prod.yml restart"