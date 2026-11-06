#!/bin/bash
set -e

echo "🚀 Starting CampusVault Deployment..."

# Navigate to project root
cd "$(dirname "$0")"

# Pull latest code from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Build frontend into backend/public
echo "🔨 Building frontend..."
npm --prefix frontend install
npm --prefix frontend run build

# Install backend dependencies
echo "📦 Installing backend packages..."
npm --prefix backend install

# Restart PM2 process
echo "🔄 Reloading PM2 backend service..."
pm2 restart campusvault || pm2 start backend/server.js --name campusvault

echo "✅ CampusVault deployed successfully!"

