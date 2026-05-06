# App Engine Deployment - Quick Start

## 🎯 What Was Changed

Your project has been configured for Google Cloud App Engine deployment with **2 separate backend services**:

### Files Created/Modified:

1. ✅ **server.userfacing.js** - Entry point for user-facing backend
2. ✅ **server.onboarding.js** - Entry point for control-desk backend  
3. ✅ **app.yaml** - App Engine config for user-facing-backend service
4. ✅ **app.control-desk.yaml** - App Engine config for control-desk-backend service
5. ✅ **.gcloudignore** - Files to exclude from deployment
6. ✅ **package.json** - Added deployment scripts
7. ✅ **src/server.js** - Updated for production compatibility
8. ✅ **DEPLOYMENT.md** - Full deployment documentation

## 🚀 Quick Deployment

### Prerequisites
```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### Deploy Commands

**Deploy user-facing backend:**
```bash
npm run deploy:userfacing
# or
gcloud app deploy app.yaml
```

**Deploy control-desk backend:**
```bash
npm run deploy:onboarding
# or
gcloud app deploy app.control-desk.yaml
```

**Deploy both at once:**
```bash
npm run deploy:all
# or
gcloud app deploy app.yaml app.control-desk.yaml
```

## 📝 Important: Environment Variables

**Before deploying**, you MUST add your environment variables to the app.yaml files!

Edit both `app.yaml` and `app.control-desk.yaml` to add:

```yaml
env_variables:
  NODE_ENV: "production"
  DATABASE_URL: "your-database-connection-string"
  ONBOARDING_PORT: "8080"  # or remove, will use PORT from App Engine
  USERFACING_PORT: "8080"  # or remove, will use PORT from App Engine
  # Add all other required environment variables from your .env file
```

## 🔗 Service URLs

After deployment, your services will be accessible at:

- **User-Facing**: `https://user-facing-backend-dot-YOUR_PROJECT_ID.REGION.r.appspot.com`
- **Control Desk**: `https://control-desk-backend-dot-YOUR_PROJECT_ID.REGION.r.appspot.com`

## 🧪 Local Testing

Test each service locally before deploying:

```bash
# Test user-facing backend
npm run dev:userfacing

# Test control-desk backend  
npm run dev:onboarding
```

## 📊 View Logs

```bash
# User-facing backend logs
gcloud app logs tail -s user-facing-backend

# Control-desk backend logs
gcloud app logs tail -s control-desk-backend
```

## 💾 Database Connection

If using **Cloud SQL**, add this to both yaml files:

```yaml
beta_settings:
  cloud_sql_instances: YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE_NAME
```

And update your DATABASE_URL format for Cloud SQL connection.

## 🔧 Configuration Details

| Setting | Value | Description |
|---------|-------|-------------|
| Runtime | nodejs22 | Node.js 22 runtime |
| Instance Class | F2 | 512MB RAM, 1.2GHz CPU |
| Min Idle Instances | 0 | Scales to zero when not in use |
| Max Idle Instances | 1 | Maximum idle instances |
| Max Concurrent Requests | 80 | Per instance |

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide including:
- Secret Manager setup
- Cloud SQL configuration
- Troubleshooting tips
- Cost optimization
- Monitoring and logging

## ⚠️ Before First Deployment

1. ✅ Add all environment variables to yaml files
2. ✅ Test locally with `npm run dev:userfacing` and `npm run dev:onboarding`
3. ✅ Ensure database is accessible from GCP
4. ✅ Enable App Engine API in your GCP project
5. ✅ Set up Cloud SQL connection (if applicable)

---

**Need help?** Check DEPLOYMENT.md or visit [App Engine Documentation](https://cloud.google.com/appengine/docs/standard/nodejs)
