# Custom Domain Setup for App Engine

## 📍 Current DNS Configuration

You've added these DNS records in Hostinger:
```
A     @  0  216.239.32.21          14400
AAAA  @  0  2001:4860:4802:32::15  14400
```

These point to Google App Engine's IP addresses. ✅

## 🔧 Complete Setup Steps

### Step 1: Map Custom Domain in Google Cloud Console

You need to map your custom domain to each App Engine service:

#### For User-Facing Backend:

```bash
# Map domain for user-facing-backend service
gcloud app domain-mappings create "api.yourdomain.com" \
  --certificate-management=automatic \
  --service=user-facing-backend
```

#### For Control-Desk Backend:

```bash
# Map domain for control-desk-backend service  
gcloud app domain-mappings create "admin.yourdomain.com" \
  --certificate-management=automatic \
  --service=control-desk-backend
```

**OR** use the Google Cloud Console:
1. Go to: https://console.cloud.google.com/appengine/settings/domains
2. Click "Add a custom domain"
3. Follow the verification steps
4. Map subdomains to services

### Step 2: Update DNS Records

Based on Google's instructions after domain mapping, you may need to add CNAME records for subdomains:

```
# For api.yourdomain.com (user-facing-backend)
CNAME  api   ghs.googlehosted.com.   14400

# For admin.yourdomain.com (control-desk-backend)  
CNAME  admin ghs.googlehosted.com.   14400
```

### Step 3: Verify DNS Records

After adding CNAME records, verify they're working:

```bash
# Check DNS propagation
nslookup api.yourdomain.com
nslookup admin.yourdomain.com

# Or use dig
dig api.yourdomain.com
dig admin.yourdomain.com
```

### Step 4: Wait for SSL Certificate

App Engine will automatically provision SSL certificates. This can take 15 minutes to a few hours.

Check status:
```bash
gcloud app domain-mappings list
```

### Step 5: Update CORS and Environment Variables

Once your domains are set up, update your app.yaml files.

## 📝 Required DNS Records Summary

### Option A: Using Root Domain

If you want to use root domain (yourdomain.com):
```
A     @     216.239.32.21          14400
A     @     216.239.34.21          14400
A     @     216.239.36.21          14400
A     @     216.239.38.21          14400
AAAA  @     2001:4860:4802:32::15  14400
AAAA  @     2001:4860:4802:34::15  14400
AAAA  @     2001:4860:4802:36::15  14400
AAAA  @     2001:4860:4802:38::15  14400
```

### Option B: Using Subdomains (Recommended)

For better service separation:
```
# User-facing backend
CNAME  api    ghs.googlehosted.com.  14400

# Control-desk backend
CNAME  admin  ghs.googlehosted.com.  14400
```

## 🔍 Troubleshooting

### SSL Certificate Not Working
- Wait 15-60 minutes for certificate provisioning
- Verify DNS records are correctly configured
- Check: `gcloud app domain-mappings describe yourdomain.com`

### Domain Not Resolving
- DNS propagation can take up to 48 hours
- Check with: `nslookup yourdomain.com 8.8.8.8`
- Verify domain ownership in Google Cloud Console

### Service Not Accessible
- Ensure service is deployed: `gcloud app services list`
- Check domain mapping: `gcloud app domain-mappings list`
- Review logs: `gcloud app logs tail`

## 📚 Useful Commands

```bash
# List all domain mappings
gcloud app domain-mappings list

# Describe a specific mapping
gcloud app domain-mappings describe yourdomain.com

# Update a mapping
gcloud app domain-mappings update yourdomain.com

# Delete a mapping
gcloud app domain-mappings delete yourdomain.com
```

## 🌐 Expected Result

After setup:
- `https://api.yourdomain.com` → user-facing-backend service
- `https://admin.yourdomain.com` → control-desk-backend service
- Automatic HTTPS with managed SSL certificates
- Both domains will route to their respective services

## ⏱️ Timeline

1. DNS changes: 5 minutes - 48 hours (usually < 1 hour)
2. SSL certificate provisioning: 15 minutes - 2 hours
3. Full propagation: Up to 24 hours globally

## 🔐 Security Notes

- SSL certificates are automatically managed by Google
- Certificates auto-renew before expiration
- HTTPS is enforced (configured in app.yaml with `secure: always`)
