#!/bin/bash

echo "🚀 GPS Tracking System - Production Deployment Setup"
echo "===================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Setting up production deployment files..."

# Create Vercel configuration
cat > vercel.json << 'EOF'
{
  "name": "gps-tracking-dashboard",
  "version": 2,
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/build",
  "installCommand": "npm install && cd client && npm install",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.railway.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF

# Create Railway configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run server:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create production environment template
cat > .env.production.example << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gps-tracking

# CORS Origins (comma-separated)
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com

# Security
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
API_KEY=your-api-authentication-key

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# Update package.json with production scripts
if command -v jq > /dev/null; then
    jq '.scripts["server:prod"] = "ts-node server/production-server.ts"' package.json > package.tmp.json && mv package.tmp.json package.json
    jq '.scripts["build:client"] = "cd client && npm install && npm run build"' package.json > package.tmp.json && mv package.tmp.json package.json
    jq '.scripts.start = "npm run server:prod"' package.json > package.tmp.json && mv package.tmp.json package.json
    echo "✅ Updated package.json with production scripts"
else
    echo "⚠️  Please manually add these scripts to package.json:"
    echo '  "server:prod": "ts-node server/production-server.ts",'
    echo '  "build:client": "cd client && npm install && npm run build",'
    echo '  "start": "npm run server:prod"'
fi

# Create deployment instructions
cat > DEPLOY.md << 'EOF'
# 🚀 Quick Deployment Guide

## Prerequisites
1. GitHub account
2. Vercel account (free): https://vercel.com
3. Railway account (free): https://railway.app
4. MongoDB Atlas account (free): https://mongodb.com/atlas

## Step 1: Database Setup (5 minutes)
1. Go to MongoDB Atlas: https://mongodb.com/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Replace in `.env.production`

## Step 2: Backend Deployment (3 minutes)
1. Push code to GitHub
2. Go to Railway: https://railway.app
3. "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables from `.env.production.example`
6. Deploy automatically!

## Step 3: Frontend Deployment (2 minutes)
1. Go to Vercel: https://vercel.com
2. "New Project" → Import from GitHub
3. Select repository
4. Set Framework: "Create React App"
5. Set Root Directory: `client`
6. Add environment variable: `REACT_APP_API_URL=https://your-backend.railway.app`
7. Deploy!

## Step 4: Update Device Agents (1 minute)
Update all your device agent configs:
```json
{
  "server_url": "https://your-backend.railway.app"
}
```

## You're Live! 🎉
- Dashboard: https://your-project.vercel.app
- Backend: https://your-project.railway.app
- Total time: ~10 minutes
- Cost: $0 (free tiers)

## Custom Domain (Optional)
- Vercel: Add custom domain in project settings
- Railway: Add custom domain in project settings
- Both support free SSL certificates
EOF

echo ""
echo "✅ Production deployment files created!"
echo ""
echo "📁 Files created:"
echo "  - vercel.json (Vercel configuration)"
echo "  - railway.json (Railway configuration)" 
echo "  - .env.production.example (Environment template)"
echo "  - DEPLOY.md (Step-by-step deployment guide)"
echo ""
echo "🎯 Next steps:"
echo "1. Copy .env.production.example to .env.production"
echo "2. Fill in your MongoDB Atlas connection string"
echo "3. Follow the DEPLOY.md guide"
echo "4. Your system will be live in ~10 minutes!"
echo ""
echo "🌟 GitHub hosting options:"
echo "  Frontend: GitHub Pages (free) or Vercel (recommended)"
echo "  Backend: Railway (free $5 credits) or Render (free tier)"
echo "  Database: MongoDB Atlas (free 512MB)"
echo ""
echo "💰 Total cost: FREE for development, ~$15/month for production scale"
