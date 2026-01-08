# Deployment Guide

## Quick Steps to Deploy Your Worker

### Option 1: Register Subdomain via Dashboard (Current Step)

You're on the "Create a Worker" page. To register your `workers.dev` subdomain:

1. **Click "Start with Hello World!"** - This will:
   - Register your `workers.dev` subdomain
   - Create a simple test Worker
   - Complete the onboarding process

2. **After registration**, you can delete the Hello World Worker and deploy your actual Worker

### Option 2: Skip Dashboard, Use Command Line

If you want to skip the dashboard, just run:

```powershell
cd cf_ai_interview_coach\worker
npm run dev:remote
```

This will prompt you to register if needed, or you can register at: https://dash.cloudflare.com/workers/onboarding

## Deploy Your Interview Coach Worker

Once your subdomain is registered, deploy your Worker:

```powershell
cd cf_ai_interview_coach\worker
npm run deploy
```

This will:
- Deploy your Worker to `https://worker.your-subdomain.workers.dev`
- Enable all bindings (AI, Durable Objects)
- Make it accessible via the deployed URL

## Update Pages to Use Deployed Worker

After deploying, update your Pages app:

1. Go to Cloudflare Dashboard → Pages
2. Select your Pages project (or create one)
3. Go to Settings → Environment Variables
4. Add: `VITE_API_URL=https://worker.your-subdomain.workers.dev`
5. Redeploy Pages

## Verify Deployment

Test your deployed Worker:

```powershell
curl https://worker.your-subdomain.workers.dev/api/chat -X POST -H "Content-Type: application/json" -d '{\"sessionId\":\"test\",\"message\":\"/start behavioral\"}'
```

---

**Note**: You can also use remote development mode (`npm run dev:remote`) which doesn't require deployment but still gives you full AI functionality.

