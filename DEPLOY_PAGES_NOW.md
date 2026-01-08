# Deploy Pages Frontend - Step by Step

## Current Status
- ✅ Worker deployed: `https://worker.o-abdelgadir32.workers.dev`
- ✅ Pages app built: `apps/web/dist/`
- ⏳ **Next: Deploy Pages**

## Quick Deployment Guide

### Option 1: Cloudflare Dashboard (Easiest - Recommended)

1. **Open Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Make sure you're logged in

2. **Navigate to Pages**
   - Click: **Workers & Pages** (left sidebar)
   - Click: **Create application** button
   - Select: **Pages** tab
   - Click: **Upload assets**

3. **Upload Your Build**
   - **Project name**: `interview-coach` (or any name you like)
   - **Drag and drop** the `apps/web/dist` folder
     - Or click "Select folder" and navigate to: `C:\Users\oabde\New folder\cf_ai_interview_coach\apps\web\dist`
   - Click: **Deploy site**

4. **Wait for Deployment**
   - Cloudflare will upload and deploy
   - You'll get a URL like: `https://interview-coach.pages.dev`

5. **Configure Environment Variable** (IMPORTANT!)
   - After deployment, click on your Pages project
   - Go to: **Settings** tab
   - Scroll to: **Environment Variables**
   - Click: **Add variable**
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://worker.o-abdelgadir32.workers.dev/api`
   - **Environment**: Select **Production** (and **Preview** if you want)
   - Click: **Save**

6. **Redeploy to Apply Variable**
   - Go to: **Deployments** tab
   - Find your latest deployment
   - Click the **three dots** (⋯) menu
   - Select: **Retry deployment**
   - Wait for it to complete

7. **Test Your App!**
   - Visit your Pages URL
   - Click "Start Interview"
   - Verify it connects to your Worker

### Option 2: Wrangler CLI (After creating project in dashboard)

If you prefer command line:

```powershell
cd apps/web
npx wrangler pages deploy dist --project-name=interview-coach --commit-dirty=true
```

**Note**: You still need to set the `VITE_API_URL` environment variable in the dashboard.

## What You'll Have After Deployment

- **Frontend URL**: `https://interview-coach.pages.dev` (or similar)
- **Backend URL**: `https://worker.o-abdelgadir32.workers.dev`
- **Full Application**: Chat interface + AI + Persistent state

## Troubleshooting

**If frontend shows errors:**
- Check browser console (F12)
- Verify `VITE_API_URL` is set correctly
- Make sure Worker URL is accessible

**If can't connect to Worker:**
- Verify Worker is deployed and accessible
- Check CORS settings (should be handled automatically)
- Test Worker directly: `https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test`

**If build files not found:**
- Make sure you're uploading the `dist` folder, not `src`
- Verify build completed: `cd apps/web && npm run build`

## Quick Checklist

- [ ] Navigate to Cloudflare Dashboard
- [ ] Create new Pages project
- [ ] Upload `apps/web/dist` folder
- [ ] Wait for deployment
- [ ] Set `VITE_API_URL` environment variable
- [ ] Redeploy to apply variable
- [ ] Test the application
- [ ] Share your deployed URL!

---

**Your app is almost complete! Just deploy Pages and you're done! 🚀**

