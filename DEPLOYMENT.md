# Google App Engine Deployment Guide

This project consists of two separate App Engine services:

## Services

1. **user-facing-backend** - User-facing API (uses `server.userfacing.js`)
2. **control-desk-backend** - Control desk/onboarding API (uses `server.onboarding.js`)

## Prerequisites

1. Install Google Cloud SDK (gcloud CLI)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`
4. Enable App Engine API: `gcloud app create --region=YOUR_REGION`

## Environment Variables

Before deploying, you need to set environment variables for each service. You can either:

### Option 1: Add to app.yaml files

Edit `app.yaml` and `app.control-desk.yaml` to add your environment variables:

```yaml
env_variables:
  NODE_ENV: "production"
  DATABASE_URL: "your-database-url"
  # Add other environment variables here
```

### Option 2: Use Secret Manager (Recommended)

For sensitive data like database credentials, use Google Secret Manager:

```bash
# Create a secret
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-

# Reference in app.yaml using beta_settings
beta_settings:
  cloud_sql_instances: YOUR_INSTANCE_CONNECTION_NAME
```

## Deployment Commands

### Deploy User-Facing Backend

```bash
gcloud app deploy app.yaml
```

This will deploy the user-facing-backend service.

### Deploy Control Desk Backend

```bash
gcloud app deploy app.control-desk.yaml
```

This will deploy the control-desk-backend service.

### Deploy Both Services

```bash
gcloud app deploy app.yaml app.control-desk.yaml
```

## Service URLs

After deployment, your services will be available at:

- **user-facing-backend**: `https://user-facing-backend-dot-YOUR_PROJECT_ID.REGION.r.appspot.com`
- **control-desk-backend**: `https://control-desk-backend-dot-YOUR_PROJECT_ID.REGION.r.appspot.com`

## Cloud SQL Connection

If you're using Cloud SQL, make sure to:

1. Add the Cloud SQL connection string to your app.yaml:

```yaml
beta_settings:
  cloud_sql_instances: PROJECT_ID:REGION:INSTANCE_NAME
```

2. Ensure your DATABASE_URL is properly formatted for Cloud SQL

## View Logs

```bash
# View user-facing backend logs
gcloud app logs tail -s user-facing-backend

# View control desk backend logs
gcloud app logs tail -s control-desk-backend
```

## Scaling Configuration

Both services are configured with automatic scaling. You can modify the scaling parameters in the respective app.yaml files:

- `min_idle_instances`: Minimum number of idle instances
- `max_idle_instances`: Maximum number of idle instances
- `max_concurrent_requests`: Maximum concurrent requests per instance

## Local Testing

Test each service locally before deploying:

```bash
# Test user-facing backend
NODE_ENV=development npm run dev

# Or manually
node server.userfacing.js

# Or manually
node server.onboarding.js
```

## Troubleshooting

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Service won't start**: Check logs with `gcloud app logs tail`
3. **Database connection fails**: Verify Cloud SQL instance is running and connection string is correct
4. **Environment variables missing**: Ensure they're set in app.yaml or Secret Manager

## Cost Optimization

- Use `min_idle_instances: 0` to scale down to zero when not in use
- Use appropriate instance class (F1, F2, F4, etc.) based on your needs
- Monitor usage in Cloud Console

## Additional Resources

- [App Engine Node.js Documentation](https://cloud.google.com/appengine/docs/standard/nodejs)
- [App Engine Pricing](https://cloud.google.com/appengine/pricing)
- [Cloud SQL for App Engine](https://cloud.google.com/sql/docs/mysql/connect-app-engine-standard)
