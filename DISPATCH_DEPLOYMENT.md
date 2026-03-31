# Dispatch.yaml Deployment Guide

## Overview
The `dispatch.yaml` file routes incoming requests to the appropriate App Engine services based on URL patterns.

## Routing Configuration

### Current Setup
- **`/onboarding/*`** → `control-desk-backend` service
- **`/app/*`** → `user-facing-backend` service

### CORS Configuration
Both services now allow API calls from:
- `https://vidyaarohan.in`
- Local development URLs (localhost:5173, 5174, 5000, 5001)
- Custom `FRONTEND_URL` from environment variables

## Deployment Steps

### 1. Deploy Both Services First
Before deploying dispatch.yaml, ensure both services are deployed:

```bash
# Deploy control-desk-backend
gcloud app deploy app.control-desk.yaml

# Deploy user-facing-backend
gcloud app deploy app.yaml
```

### 2. Deploy dispatch.yaml
The dispatch.yaml must be deployed **after** the services it references:

```bash
gcloud app deploy dispatch.yaml
```

**Note:** The dispatch.yaml is deployed to your default service.

### 3. Verify Deployment

Check your dispatch rules:
```bash
gcloud app describe
```

Test the routing:
```bash
# Test control-desk-backend
curl https://YOUR-PROJECT-ID.appspot.com/onboarding/health

# Test user-facing-backend
curl https://YOUR-PROJECT-ID.appspot.com/app/health
```

## How Dispatch Works

1. **Pattern Matching**: App Engine matches the incoming URL against dispatch rules from top to bottom
2. **First Match Wins**: The first matching rule determines which service handles the request
3. **Wildcard Support**: The `*` matches any subdomain or path segment

### Example Requests
```
https://your-app.appspot.com/onboarding/login
  → Routed to: control-desk-backend

https://your-app.appspot.com/onboarding/schools
  → Routed to: control-desk-backend

https://your-app.appspot.com/app/login
  → Routed to: user-facing-backend

https://your-app.appspot.com/app/attendance
  → Routed to: user-facing-backend
```

## Custom Domain Support

If you're using a custom domain (e.g., api.vidyaarohan.in), the dispatch rules work the same:

```
https://api.vidyaarohan.in/onboarding/login
  → Routed to: control-desk-backend

https://api.vidyaarohan.in/app/login
  → Routed to: user-facing-backend
```

## Troubleshooting

### Issue: "Service not found"
- **Solution**: Ensure both services are deployed before deploying dispatch.yaml

### Issue: "404 Not Found"
- **Solution**: Check that your routes in the backend match the URL patterns
  - control-desk-backend should have routes prefixed with `/onboarding`
  - user-facing-backend should have routes prefixed with `/app`

### Issue: CORS errors from vidyaarohan.in
- **Solution**: Verify that `https://vidyaarohan.in` is in the allowedOrigins array
- Check browser console for specific CORS error messages
- Ensure credentials are properly configured in your frontend requests

### Issue: Dispatch not working
- **Solution**: Try redeploying dispatch.yaml
```bash
gcloud app deploy dispatch.yaml --promote
```

## Important Notes

1. **Deployment Order**: Always deploy services before dispatch.yaml
2. **Testing**: Test each service independently before adding dispatch rules
3. **Updates**: If you change dispatch.yaml, you must redeploy it
4. **Default Service**: dispatch.yaml is deployed to the default service, not to individual services
5. **HTTPS Only**: All services are configured with `secure: always` for HTTPS enforcement

## Updating Dispatch Rules

To modify routing:

1. Edit `dispatch.yaml`
2. Deploy the changes:
```bash
gcloud app deploy dispatch.yaml
```

3. Changes take effect immediately (no service restart required)

## Monitoring

View logs for dispatched requests:
```bash
# Control-desk-backend logs
gcloud app logs tail -s control-desk-backend

# User-facing-backend logs
gcloud app logs tail -s user-facing-backend
```

## Next Steps

After deployment:
1. Update your frontend application to use the correct API endpoints
2. Update `FRONTEND_URL` environment variable in both app.yaml files if needed
3. Test all API endpoints from https://vidyaarohan.in
4. Monitor logs for any CORS or routing issues
