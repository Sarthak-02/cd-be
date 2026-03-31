# 🌐 Your DNS Setup - Next Steps

## Current Status

You've added A and AAAA records pointing to Google's App Engine IPs:
```
A     @  0  216.239.32.21          14400
AAAA  @  0  2001:4860:4802:32::15  14400
```

## ✅ What You Need to Do Next

### Option 1: Using Subdomains (Recommended)

**Better approach**: Instead of root domain, use subdomains for each service.

#### In Hostinger DNS, REPLACE your current records with:

```
Type   | Host  | Value                   | TTL
-------|-------|-------------------------|------
CNAME  | api   | ghs.googlehosted.com.  | 14400
CNAME  | admin | ghs.googlehosted.com.  | 14400
```

#### Then run these commands:

```bash
# Map api subdomain to user-facing backend
gcloud app domain-mappings create "api.yourdomain.com" \
  --certificate-management=automatic \
  --service=user-facing-backend

# Map admin subdomain to control-desk backend
gcloud app domain-mappings create "admin.yourdomain.com" \
  --certificate-management=automatic \
  --service=control-desk-backend
```

**Result:**
- User-facing API: `https://api.yourdomain.com`
- Control-desk API: `https://admin.yourdomain.com`

---

### Option 2: Using Root Domain (If you prefer)

If you want to keep your current A/AAAA records and use the root domain:

#### Add MORE A records for redundancy:

```
Type   | Host | Value              | TTL
-------|------|--------------------|----- 
A      | @    | 216.239.32.21      | 14400
A      | @    | 216.239.34.21      | 14400
A      | @    | 216.239.36.21      | 14400
A      | @    | 216.239.38.21      | 14400
AAAA   | @    | 2001:4860:4802:32::15 | 14400
AAAA   | @    | 2001:4860:4802:34::15 | 14400
AAAA   | @    | 2001:4860:4802:36::15 | 14400
AAAA   | @    | 2001:4860:4802:38::15 | 14400
```

#### Then map ONE service to root domain:

```bash
# Map root domain to ONE service (you can only have one default)
gcloud app domain-mappings create "yourdomain.com" \
  --certificate-management=automatic
```

**Issue**: You can only map root domain to ONE service, not both. That's why subdomains are recommended.

---

## 🎯 Recommended Action Plan

1. **Deploy your services first:**
   ```bash
   npm run deploy:all
   ```

2. **Choose your subdomain structure:**
   - User-facing: `api.yourdomain.com`
   - Control-desk: `admin.yourdomain.com`

3. **Run the automated setup:**
   ```bash
   chmod +x setup-custom-domain.sh
   ./setup-custom-domain.sh
   ```

4. **Update DNS in Hostinger** with the CNAME records shown by the script

5. **Update app.yaml files** with your custom domain:
   ```yaml
   env_variables:
     FRONTEND_URL: "https://yourdomain.com"
   ```

6. **Wait 15-60 minutes** for SSL certificates to provision

7. **Test your domains:**
   ```bash
   curl https://api.yourdomain.com
   curl https://admin.yourdomain.com
   ```

## 🔍 Verify Setup

```bash
# Check if domains are mapped
gcloud app domain-mappings list

# Check DNS resolution
nslookup api.yourdomain.com
nslookup admin.yourdomain.com

# Check SSL certificate status
gcloud app domain-mappings describe api.yourdomain.com
```

## 💡 Tips

- **DNS Propagation**: Can take 5 minutes to 48 hours (usually < 1 hour)
- **SSL Certificates**: Automatically provisioned and managed by Google
- **HTTPS Only**: Already configured in your app.yaml with `secure: always`
- **Monitoring**: Use `gcloud app logs tail -s SERVICE_NAME` to check logs

## 📞 Need Help?

See detailed guide in `CUSTOM_DOMAIN_SETUP.md`
