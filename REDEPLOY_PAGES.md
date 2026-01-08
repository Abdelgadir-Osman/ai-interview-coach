# How to Redeploy Pages After Adding Environment Variable

## Quick Steps to Redeploy

### Option 1: Retry Latest Deployment (Easiest)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Navigate to: **Workers & Pages** → **interview-coach** (your Pages project)

2. **Go to Deployments Tab**
   - Click on the **Deployments** tab at the top

3. **Retry Deployment**
   - Find your latest deployment in the list
   - Click the **three dots (⋯)** menu on the right side of that deployment
   - Select: **Retry deployment**
   - Wait for it to complete (usually 1-2 minutes)

4. **Verify**
   - Once deployment completes, visit: https://interview-coach.pages.dev
   - Test that it connects to your Worker

### Option 2: Trigger New Deployment via Dashboard

1. **Go to your Pages project**
   - Navigate to: **Workers & Pages** → **interview-coach**

2. **Upload Again**
   - Go to: **Deployments** tab
   - Click: **Create deployment** or **Upload assets**
   - Upload the `apps/web/dist` folder again
   - This will create a new deployment with the environment variable

### Option 3: Redeploy via Wrangler CLI

If you prefer command line:

```powershell
cd apps/web
npx wrangler pages deploy dist --project-name=interview-coach --commit-dirty=true
```

**Note**: The environment variable is already set in the dashboard, so this will use it.

## Verify Environment Variable is Applied

After redeployment:

1. **Test in Browser**
   - Visit: https://interview-coach.pages.dev
   - Click "Start Interview"
   - Check browser console (F12) for any errors
   - Verify it connects to: `https://worker.o-abdelgadir32.workers.dev/api`

2. **Check Network Tab**
   - Open browser DevTools (F12)
   - Go to **Network** tab
   - Click "Start Interview"
   - Look for a request to `/api/chat`
   - Verify the request goes to your Worker URL

## Troubleshooting

**If it still doesn't work after redeploy:**

1. **Double-check environment variable:**
   - Go to: **Settings** → **Environment Variables**
   - Verify: `VITE_API_URL` = `https://worker.o-abdelgadir32.workers.dev/api`
   - Make sure it's set for **Production** environment

2. **Clear browser cache:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or clear cache and reload

3. **Check deployment status:**
   - Make sure the deployment shows as "Success" (green checkmark)
   - If it failed, check the logs

4. **Verify Worker is accessible:**
   - Test directly: https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test
   - Should return JSON (not "Not found")

---

**After redeploy, your app should be fully functional! 🚀**

