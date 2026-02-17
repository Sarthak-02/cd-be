#!/bin/bash

# Custom Domain Setup Script for App Engine
# Replace 'yourdomain.com' with your actual domain

echo "🚀 App Engine Custom Domain Setup"
echo "=================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get domain from user
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Domain name is required"
    exit 1
fi

read -p "Enter subdomain for user-facing backend (e.g., api): " USER_SUBDOMAIN
USER_SUBDOMAIN=${USER_SUBDOMAIN:-api}

read -p "Enter subdomain for control-desk backend (e.g., admin): " ADMIN_SUBDOMAIN
ADMIN_SUBDOMAIN=${ADMIN_SUBDOMAIN:-admin}

USER_DOMAIN="${USER_SUBDOMAIN}.${DOMAIN}"
ADMIN_DOMAIN="${ADMIN_SUBDOMAIN}.${DOMAIN}"

echo ""
echo "📋 Configuration:"
echo "  User-facing backend: https://${USER_DOMAIN}"
echo "  Control-desk backend: https://${ADMIN_DOMAIN}"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "🔧 Step 1: Mapping domains to App Engine services..."
echo ""

# Map user-facing backend domain
echo "Mapping ${USER_DOMAIN} to user-facing-backend..."
gcloud app domain-mappings create "${USER_DOMAIN}" \
  --certificate-management=automatic \
  --service=user-facing-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ User-facing backend domain mapped successfully${NC}"
else
    echo -e "${YELLOW}⚠️  User-facing backend domain mapping may have failed. Check output above.${NC}"
fi

echo ""

# Map control-desk backend domain
echo "Mapping ${ADMIN_DOMAIN} to control-desk-backend..."
gcloud app domain-mappings create "${ADMIN_DOMAIN}" \
  --certificate-management=automatic \
  --service=control-desk-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Control-desk backend domain mapped successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Control-desk backend domain mapping may have failed. Check output above.${NC}"
fi

echo ""
echo "📝 Step 2: DNS Records to add in Hostinger"
echo "=========================================="
echo ""
echo "Add these CNAME records in your Hostinger DNS settings:"
echo ""
echo "Type   | Name  | Value                   | TTL"
echo "-------|-------|-------------------------|------"
echo "CNAME  | ${USER_SUBDOMAIN}    | ghs.googlehosted.com.  | 14400"
echo "CNAME  | ${ADMIN_SUBDOMAIN}   | ghs.googlehosted.com.  | 14400"
echo ""
echo "⚠️  Note: Remove any conflicting A or AAAA records for these subdomains"
echo ""

echo "🔍 Step 3: View current domain mappings"
echo "========================================"
gcloud app domain-mappings list

echo ""
echo -e "${GREEN}✅ Domain mapping initiated!${NC}"
echo ""
echo "⏱️  Next steps:"
echo "1. Add the CNAME records shown above to your Hostinger DNS"
echo "2. Wait 15-60 minutes for SSL certificate provisioning"
echo "3. Verify domains are working:"
echo "   curl https://${USER_DOMAIN}"
echo "   curl https://${ADMIN_DOMAIN}"
echo ""
echo "📚 Check status with:"
echo "   gcloud app domain-mappings list"
echo ""
echo "📖 Full guide: See CUSTOM_DOMAIN_SETUP.md"
