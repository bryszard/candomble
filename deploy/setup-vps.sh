#!/bin/bash

# VPS Setup Script for Candomblé Website
# Run this script on your VPS to set up nginx and SSL

set -e

# Configuration
DOMAIN="candomble.pl"
EMAIL="piotr.brych@gmail.com"  # For Let's Encrypt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Setting up VPS for Candomblé website...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install nginx
echo -e "${YELLOW}🌐 Installing nginx...${NC}"
apt install nginx -y

# Install certbot for SSL
echo -e "${YELLOW}🔒 Installing certbot for SSL...${NC}"
apt install certbot python3-certbot-nginx -y

# Create website directory
echo -e "${YELLOW}📁 Creating website directory...${NC}"
mkdir -p /var/www/candomble
chown -R www-data:www-data /var/www/candomble
chmod -R 755 /var/www/candomble

# Create nginx configuration
echo -e "${YELLOW}⚙️ Creating nginx configuration...${NC}"
cat > /etc/nginx/sites-available/candomble << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name candomble.pl www.candomble.pl;

    root /var/www/candomble;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
EOF

# Enable the site
echo -e "${YELLOW}🔗 Enabling nginx site...${NC}"
ln -sf /etc/nginx/sites-available/candomble /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
nginx -t

# Start and enable nginx
echo -e "${YELLOW}🚀 Starting nginx...${NC}"
systemctl start nginx
systemctl enable nginx

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo -e "${GREEN}✅ VPS setup completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update the domain in nginx configuration: /etc/nginx/sites-available/candomble"
echo "2. Run: sudo certbot --nginx -d candomble.pl -d www.candomble.pl"
echo "3. Configure Squarespace DNS to point to this VPS"
echo "4. Deploy your website files"
