#!/bin/bash

# Candomblé Website Deployment Script
# This script deploys the static site to your VPS

set -e  # Exit on any error

# Configuration
DOMAIN="candomble.pl"
VPS_USER="root"  # Change this to your VPS username
VPS_HOST="2a01:4f9:4a:27c1::288"  # Your VPS IPv6 address
DEPLOY_PATH="/var/www/candomble"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/candomble"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Candomblé deployment...${NC}"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist directory not found. Please run 'npm run build' first.${NC}"
    exit 1
fi

# Build the project
echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

# Create deployment package
echo -e "${YELLOW}📁 Creating deployment package...${NC}"
tar -czf candomble-deploy.tar.gz -C dist .

# Upload to VPS
echo -e "${YELLOW}📤 Uploading to VPS...${NC}"
scp candomble-deploy.tar.gz ${VPS_USER}@[${VPS_HOST}]:/tmp/

# Deploy on VPS
echo -e "${YELLOW}🔧 Deploying on VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'EOF'
    # Create deployment directory
    sudo mkdir -p /var/www/candomble

    # Extract files
    sudo tar -xzf /tmp/candomble-deploy.tar.gz -C /var/www/candomble

    # Set proper permissions
    sudo chown -R www-data:www-data /var/www/candomble
    sudo chmod -R 755 /var/www/candomble

    # Clean up
    rm /tmp/candomble-deploy.tar.gz

    echo "✅ Deployment completed on VPS"
EOF

# Clean up local files
rm candomble-deploy.tar.gz

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
