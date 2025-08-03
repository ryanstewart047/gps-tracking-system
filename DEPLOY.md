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
